package com.khoaluan.backend.controller;

import com.khoaluan.backend.entity.CandidateCv;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.JobApplication;
import com.khoaluan.backend.repository.CandidateCvRepository;
import com.khoaluan.backend.repository.JobApplicationRepository;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.service.SpringAiService;
import com.khoaluan.backend.service.QdrantService;
import io.qdrant.client.grpc.Points.ScoredPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidate-ai")
@CrossOrigin(origins = "http://localhost:3000")
public class CandidateAiController {

    @Autowired
    private CandidateCvRepository cvRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private JobApplicationRepository applicationRepository;
    @Autowired
    private SpringAiService springAiService;
    @Autowired
    private QdrantService qdrantService;

    /**
     * API GỢI Ý VIỆC LÀM CHO ỨNG VIÊN — TỐI ƯU TỐC ĐỘ:
     * - Ưu tiên dùng cached vector từ Qdrant (bỏ qua OCR Gemini nếu đã có)
     * - Gộp luôn applied-jobs status vào 1 response duy nhất
     */
    @GetMapping("/suggest-jobs/{userId}")
    public ResponseEntity<?> suggestJobs(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "30") int limit) {
        try {
            System.out.println("🔍 [CandidateAI] Bắt đầu gợi ý việc làm cho User ID: " + userId);

            // -- Lấy danh sách đã ứng tuyển (gộp vào 1 request) --
            Map<Integer, String> appliedMap = new HashMap<>();
            try {
                List<JobApplication> apps = applicationRepository.findByUserId(userId);
                for (JobApplication app : apps) {
                    appliedMap.put(app.getJobId(), app.getStatus() != null ? app.getStatus() : "pending");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Lỗi lấy applied-jobs: " + e.getMessage());
            }

            // Lấy tất cả active jobs từ SQL Server trước để đảm bảo không bỏ sót bất kỳ Job nào
            List<Job> activeJobs = jobRepository.findAll().stream()
                    .filter(j -> "Đang hiển thị".equalsIgnoreCase(j.getStatus()))
                    .collect(Collectors.toList());

            if (activeJobs.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "jobs", Collections.emptyList(),
                        "total", 0,
                        "source", "SQL_DATABASE",
                        "message", "Không có tin tuyển dụng nào đang hiển thị."));
            }

            List<Float> cvEmbedding = null;

            // BƯỚC 1: Thử lấy cached vector từ Qdrant
            cvEmbedding = qdrantService.getCachedCvVector(Long.valueOf(userId));

            // BƯỚC 2: Nếu chưa có cache, mới OCR + embed (chậm ~5-8s, chỉ chạy lần đầu)
            if (cvEmbedding == null) {
                System.out.println("🧠 [CandidateAI] Chưa có cached vector, tiến hành OCR + embed CV...");
                List<CandidateCv> cvList = cvRepository.findByUser_UserIdOrderByUploadedAtDesc(userId);
                if (cvList != null && !cvList.isEmpty()) {
                    CandidateCv latestCv = cvList.get(0);
                    String cvFileUrl = latestCv.getCvFile();
                    System.out.println("📄 CV mới nhất: " + cvFileUrl);

                    String cvText;
                    try {
                        cvText = springAiService.extractTextFromCvPdf(cvFileUrl);
                        System.out.println("📝 OCR thành công: " + cvText.substring(0, Math.min(80, cvText.length())) + "...");
                    } catch (Exception e) {
                        System.err.println("⚠️ Lỗi OCR → dùng tên file: " + e.getMessage());
                        cvText = latestCv.getOriginalName() != null ? latestCv.getOriginalName() : "CV ứng viên";
                    }

                    cvEmbedding = springAiService.getEmbeddingList(cvText);
                    if (cvEmbedding != null && !cvEmbedding.isEmpty()) {
                        // Lưu vào cache Qdrant để lần sau dùng lại
                        Map<String, String> cvMeta = new HashMap<>();
                        cvMeta.put("userId", String.valueOf(userId));
                        cvMeta.put("cvUrl", cvFileUrl);
                        cvMeta.put("originalName", latestCv.getOriginalName() != null ? latestCv.getOriginalName() : "");
                        qdrantService.upsertCvVector(Long.valueOf(userId), cvEmbedding, cvMeta);
                    }
                }
            }

            // BƯỚC 3: Map điểm số từ Qdrant sang Map<jobId, matchScore>
            Map<Integer, Integer> scoreMap = new HashMap<>();
            if (cvEmbedding != null && !cvEmbedding.isEmpty()) {
                try {
                    List<ScoredPoint> scoredJobs = qdrantService.searchSimilarJobs(cvEmbedding, 100);
                    for (ScoredPoint sp : scoredJobs) {
                        int jobId = (int) sp.getId().getNum();
                        int matchScore = (int) Math.round(Math.max(0, sp.getScore()) * 100);
                        scoreMap.put(jobId, matchScore);
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Lỗi query Qdrant: " + e.getMessage());
                }
            }

            // BƯỚC 4: Tạo danh sách kết quả chứa toàn bộ active jobs, map điểm từ scoreMap
            List<Map<String, Object>> result = new ArrayList<>();
            for (Job job : activeJobs) {
                Map<String, Object> jobMap = jobToMap(job);
                int score = scoreMap.getOrDefault(job.getJobId(), 0);
                jobMap.put("matchScore", score);

                // Gắn trạng thái ứng tuyển
                String appStatus = appliedMap.get(job.getJobId());
                jobMap.put("isApplied", appStatus != null);
                jobMap.put("applicationStatus", appStatus); // pending/interviewing/passed/rejected

                result.add(jobMap);
            }

            // BƯỚC 5: Sắp xếp theo matchScore giảm dần
            result.sort((a, b) -> Integer.compare((Integer) b.get("matchScore"), (Integer) a.get("matchScore")));

            // Giới hạn số lượng trả về theo limit
            if (result.size() > limit) {
                result = result.subList(0, limit);
            }

            System.out.println("✅ [CandidateAI] Gợi ý toàn bộ " + result.size() + " việc làm cho User " + userId);
            return ResponseEntity.ok(Map.of(
                    "jobs", result,
                    "total", result.size(),
                    "source", cvEmbedding != null ? "QDRANT_VECTOR_SEARCH_PRIORITY" : "SQL_DATABASE",
                    "message", cvEmbedding != null ? "Gợi ý thông minh dựa trên nội dung CV thực tế của bạn" : "Bạn chưa tải CV lên hoặc hệ thống đang xử lý. Hiển thị tất cả việc làm."));

        } catch (Exception e) {
            System.err.println("❌ [CandidateAI] Lỗi gợi ý việc làm: " + e.getMessage());
            e.printStackTrace();
            return buildFallbackResponse(limit, "Hệ thống AI đang bận, hiển thị danh sách tổng hợp.", new HashMap<>());
        }
    }

    // ---- HELPER: Fallback toàn bộ job active ----
    private ResponseEntity<?> buildFallbackResponse(int limit, String message, Map<Integer, String> appliedMap) {
        List<Job> activeJobs = jobRepository.findAll().stream()
                .filter(j -> "Đang hiển thị".equalsIgnoreCase(j.getStatus()))
                .limit(limit)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = activeJobs.stream().map(job -> {
            Map<String, Object> m = jobToMap(job);
            m.put("matchScore", 0);
            String appStatus = appliedMap.get(job.getJobId());
            m.put("isApplied", appStatus != null);
            m.put("applicationStatus", appStatus);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "jobs", result,
                "total", result.size(),
                "source", "FALLBACK_ALL_JOBS",
                "message", message));
    }

    // ---- HELPER: Chuyển Job entity → Map ----
    private Map<String, Object> jobToMap(Job job) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", job.getJobId());
        m.put("jobId", job.getJobId());
        m.put("title", job.getTitle());
        m.put("skills", job.getSkills());
        m.put("jobDescription", job.getJobDescription());
        m.put("otherRequirements", job.getOtherRequirements());
        m.put("salary", job.getSalary());
        m.put("jobType", job.getJobType());
        m.put("experience", job.getExperience());
        m.put("workLocation", job.getWorkLocation());
        m.put("location", job.getWorkLocation());
        m.put("status", job.getStatus());
        m.put("bannerUrl", job.getBannerUrl());
        m.put("documentUrl", job.getDocumentUrl());
        m.put("employerId", job.getEmployerId());
        m.put("userId", job.getEmployerId());
        m.put("viewCount", job.getViewCount());
        m.put("applyCount", job.getApplyCount());
        m.put("createdAt", job.getCreatedAt() != null ? job.getCreatedAt().toString() : null);
        m.put("matchScore", 0); // override bởi caller
        return m;
    }
}
