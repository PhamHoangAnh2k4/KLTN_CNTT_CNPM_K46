package com.khoaluan.backend.controller;

import com.khoaluan.backend.dto.CandidateDto;
import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.JobApplication;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.*;
import com.khoaluan.backend.service.SpringAiService;
import com.khoaluan.backend.service.QdrantService;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employer-ai")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployerAiController {

    @Autowired
    private JobApplicationRepository applicationRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ActivityLogRepository activityLogRepository;
    @Autowired
    private SpringAiService springAiService;
    @Autowired
    private EmailController emailController;
    @Autowired
    private QdrantService qdrantService;

    // ========================================================
    // TIỆN ÍCH: Ghi log hoạt động
    // ========================================================
    private void saveLog(Integer userId, String action, String desc) {
        if (userId == null)
            return;
        try {
            ActivityLog log = new ActivityLog();
            log.setUserId(userId);
            log.setActionType(action);
            log.setDescription(desc);
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Lỗi ghi log: " + e.getMessage());
        }
    }

    // ========================================================
    // API 1: LẤY DANH SÁCH ỨNG VIÊN CỦA 1 TIN TUYỂN DỤNG
    // ========================================================
    @GetMapping("/job/{jobId}/candidates")
    public ResponseEntity<?> getCandidates(@PathVariable Integer jobId) {
        List<JobApplication> apps = applicationRepository.findByJobId(jobId);

        List<CandidateDto> dtos = apps.stream().map(app -> {
            User user = userRepository.findById(app.getUserId()).orElse(new User());

            CandidateDto dto = new CandidateDto();
            dto.setId(user.getUserId());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setPhone("098xxx");
            dto.setAvatar(null);
            dto.setCvUrl(app.getCvFileUrl());
            dto.setStatus(app.getStatus());
            dto.setRejectReason(app.getRejectReason());

            // AI Fields
            dto.setMatchScore(app.getMatchScore() != null ? app.getMatchScore() : 0);
            dto.setAiSummary(app.getAiSummary());
            dto.setLegitScore(app.getLegitScore() != null ? app.getLegitScore() : 0);
            dto.setAiEvidence(app.getAiEvidence());
            dto.setInterviewFeedback(app.getInterviewFeedback());
            dto.setOfferSuggestion(app.getOfferSuggestion());
            dto.setCriteriaMatrix(app.getCriteriaMatrix());
            dto.setInterviewPreference(app.getInterviewPreference()); // ← Lựa chọn online/offline của ứng viên

            return dto;
        }).collect(Collectors.toList());

        // Sắp xếp theo Match Score giảm dần
        dtos.sort((d1, d2) -> Integer.compare(d2.getMatchScore(), d1.getMatchScore()));

        return ResponseEntity.ok(dtos);
    }

    // ========================================================
    // API 2: QUÉT AI - NÂNG CẤP VỚI RAG + LEGIT CHECK
    // ========================================================
    @PostMapping("/ai-scan")
    public ResponseEntity<?> processAiScan(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = (Integer) payload.get("jobId");
            String prompt = (String) payload.get("prompt");
            Integer employerId = payload.get("employerId") != null
                    ? Integer.parseInt(payload.get("employerId").toString())
                    : null;

            System.out.println("=== BẮT ĐẦU QUÉT AI AUTONOMOUS AGENT ===");

            // Lấy JD và các tool details
            Job job = jobRepository.findById(jobId).orElse(null);
            String jobDescription = job != null ? job.getJobDescription() : null;
            String jobSalary = job != null && job.getSalary() != null ? job.getSalary() : "Thỏa thuận";

            // Tính Lương TB phòng ban
            List<Job> teamJobs = job != null ? jobRepository.findByEmployerId(job.getEmployerId()) : List.of();
            String avgTeamSalary = teamJobs.stream().map(Job::getSalary).filter(s -> s != null && !s.isEmpty())
                    .collect(Collectors.joining(", "));
            if (avgTeamSalary.isEmpty())
                avgTeamSalary = "Không có dữ liệu";

            // Lấy JD Embedding cho Qdrant Vector DB
            List<Float> jdEmbeddingList = springAiService.getEmbeddingList(jobDescription);
            String jdEmbeddingStr = jdEmbeddingList.toString();

            if (!jdEmbeddingList.isEmpty()) {
                Map<String, String> jobMeta = new HashMap<>();
                jobMeta.put("title", job != null ? job.getTitle() : "");
                jobMeta.put("description", jobDescription);
                qdrantService.upsertJobVector(Long.valueOf(jobId), jdEmbeddingList, jobMeta);
            }

            List<JobApplication> apps = applicationRepository.findByJobId(jobId);
            int successCount = 0;

            for (JobApplication app : apps) {
                String cvUrl = app.getCvFileUrl();
                if (cvUrl == null || cvUrl.isEmpty())
                    continue;

                // Tối ưu tốc độ Demo: Nếu CV này đã từng quét rồi thì bỏ qua không gọi AI nữa
                if (app.getAiSummary() != null && app.getMatchScore() != null && app.getMatchScore() > 0) {
                    System.out.println("⚡ Tối ưu AI: Bỏ qua ứng viên " + app.getUserId() + " vì đã được quét trước đó.");
                    successCount++;
                    continue;
                }

                try {
                    System.out.println("🔍 Đang chạy Autonomous Agent cho CV: " + cvUrl);

                    // 1. Trích xuất text thực bằng Gemini Multimodal và sinh Embedding thực tế
                    String cvText = "";
                    try {
                        cvText = springAiService.extractTextFromCvPdf(cvUrl);
                        System.out.println("📝 Đã trích xuất nội dung CV thực tế: "
                                + (cvText.length() > 100 ? cvText.substring(0, 100) + "..." : cvText));
                    } catch (Exception e) {
                        System.err.println("⚠ Lỗi trích xuất CV bằng Gemini, sử dụng text dự phòng: " + e.getMessage());
                        cvText = "CV file tại " + cvUrl;
                    }

                    List<Float> cvEmbeddingList = springAiService.getEmbeddingList(cvText);
                    String cvEmbeddingStr = cvEmbeddingList.toString();

                    if (!cvEmbeddingList.isEmpty()) {
                        Map<String, String> cvMeta = new HashMap<>();
                        cvMeta.put("cvUrl", cvUrl);
                        cvMeta.put("userId", String.valueOf(app.getUserId()));
                        qdrantService.upsertCvVector(Long.valueOf(app.getUserId()), cvEmbeddingList, cvMeta);
                    }

                    // Tính toán độ tương đồng Cosine thực tế dựa trên nội dung thực
                    double similarity = springAiService.calculateCosineSimilarity(cvEmbeddingStr, jdEmbeddingStr);
                    System.out.println("✅ Qdrant Vector DB (Cosine Similarity): " + similarity);

                    // 2. Chạy Agent với thông số thực
                    String aiResponse = springAiService.scanAndDecideAutonomous(cvUrl, jobDescription, similarity,
                            jobSalary, avgTeamSalary, prompt, cvText);

                    JSONObject json = new JSONObject(aiResponse);
                    int matchScore = json.optInt("matchScore", 0);
                    int legitScore = json.optInt("legitScore", 0);
                    JSONObject summaryObj = json.optJSONObject("summary") != null ? json.getJSONObject("summary")
                            : new JSONObject();
                    summaryObj.put("ocrText", cvText); // Gắn bản OCR vào bản tóm tắt
                    summaryObj.put("recommendation", json.optString("recommendation", "Chưa có đề xuất")); // Thêm đề
                                                                                                           // xuất vào
                                                                                                           // DB
                    String summary = summaryObj.toString();

                    String evidence = json.optJSONArray("evidence") != null ? json.getJSONArray("evidence").toString()
                            : "[]";

                    // 3. Cập nhật SQL Server
                    applicationRepository.updateAiResult(jobId, app.getUserId(), matchScore, summary, legitScore,
                            evidence, cvEmbeddingStr);

                    successCount++;
                    System.out.println("✅ Hoàn tất Agent Loop cho User " + app.getUserId());
                    Thread.sleep(1500); // Giảm từ 6s xuống 1.5s để quét cực nhanh

                } catch (Exception e) {
                    try {
                        java.nio.file.Files.write(java.nio.file.Paths.get("D:\\DA_KHOALUAN\\backend\\ai_error.log"),
                                ("Lỗi User " + app.getUserId() + ": " + e.getMessage() + "\n").getBytes(),
                                java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
                    } catch (Exception ex) {
                    }
                    System.out.println("❌ Lỗi quét CV User " + app.getUserId() + ": " + e.getMessage());

                    if (e.getMessage() != null && e.getMessage().contains("429")) {
                        // Trả 200 OK với cờ warning để frontend hiển thị thông báo thay vì crash
                        if (employerId != null) {
                            saveLog(employerId, "AUTONOMOUS AGENT",
                                    "Hoàn tất quét " + successCount + " CV (dừng do rate limit) - tin ID: " + jobId);
                        }
                        return ResponseEntity.ok(Map.of(
                                "message", "AI Agent đã hoàn tất vòng lặp!",
                                "jobId", jobId,
                                "scannedCount", successCount,
                                "warning", "Đã quét được " + successCount
                                        + " CV. Google Gemini tạm thời giới hạn tốc độ (429). Vui lòng đợi ~1 phút rồi quét lại để tiếp tục."));
                    }
                }
            }

            if (employerId != null) {
                saveLog(employerId, "AUTONOMOUS AGENT",
                        "Hoàn tất quét và tự động hóa cho " + successCount + " CV của tin ID: " + jobId);
            }

            return ResponseEntity.ok(
                    Map.of("message", "AI Agent đã hoàn tất vòng lặp!", "jobId", jobId, "scannedCount", successCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi AI: " + e.getMessage());
        }
    }


    // ========================================================
    // API 1: TỐI ƯU HÓA TIN TUYỂN DỤNG (JD AI) - FLASH
    // ========================================================
    @PostMapping("/optimize-jd")
    public ResponseEntity<?> optimizeJd(@RequestBody Map<String, Object> payload) {
        try {
            String draftDescription = payload.get("description") != null ? payload.get("description").toString() : "";
            String draftRequirements = payload.get("requirements") != null ? payload.get("requirements").toString() : "";

            if (draftDescription.isBlank() && draftRequirements.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập bản nháp JD!"));
            }

            String jsonResult = springAiService.optimizeJd(draftDescription, draftRequirements);
            return ResponseEntity.ok(new JSONObject(jsonResult).toMap());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tối ưu JD: " + e.getMessage()));
        }
    }

    // ========================================================
    // API 2: KHỞI TẠO BẢNG TIÊU CHÍ (CRITERIA MATRIX) - FLASH
    // ========================================================
    @PostMapping("/generate-criteria")
    public ResponseEntity<?> generateCriteriaMatrix(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new Exception("Không tìm thấy Job"));
            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new Exception("Không tìm thấy đơn ứng tuyển"));

            String jobDescription = job.getJobDescription() != null ? job.getJobDescription() : "";
            String cvSummary = app.getAiSummary() != null ? app.getAiSummary() : "";

            String jsonArrayResult = springAiService.generateCriteriaMatrix(cvSummary, jobDescription);
            
            // Cập nhật Database với ma trận tiêu chí ban đầu (chưa chấm)
            applicationRepository.updateCriteriaMatrix(jobId, userId, jsonArrayResult);

            return ResponseEntity.ok(new JSONArray(jsonArrayResult).toList());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi sinh tiêu chí: " + e.getMessage()));
        }
    }
    
    // ========================================================
    // API 3: CẬP NHẬT ĐIỂM TIÊU CHÍ TỪ FE VÀO DB
    // ========================================================
    @PostMapping("/update-criteria")
    public ResponseEntity<?> updateCriteriaMatrix(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String matrixJson = payload.get("matrix") != null ? payload.get("matrix").toString() : "[]";

            applicationRepository.updateCriteriaMatrix(jobId, userId, matrixJson);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật bảng tiêu chí"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi cập nhật tiêu chí: " + e.getMessage()));
        }
    }

    // ========================================================
    // API 4: ĐỀ XUẤT LƯƠNG & JD BONUS (PRO)
    // ========================================================
    @PostMapping({"/propose-salary-bonus", "/offer-suggestion"})
    public ResponseEntity<?> proposeSalaryAndBonus(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new Exception("Không tìm thấy Job"));
            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new Exception("Không tìm thấy đơn ứng tuyển"));

            String criteriaMatrix = app.getCriteriaMatrix() != null ? app.getCriteriaMatrix() : "[]";
            String candidateInfo = app.getAiSummary() != null ? app.getAiSummary() : "";
            
            String jobTitle = job.getTitle() != null ? job.getTitle() : "";
            String jobDesc = job.getJobDescription() != null ? job.getJobDescription() : "";
            String jobSalary = job.getSalary() != null ? job.getSalary() : "Thỏa thuận";

            String expectedSalaryInfo = "";
            if (app.getExpectedSalary() != null) {
                expectedSalaryInfo = app.getExpectedSalary() + " VNĐ (" + (app.getSalaryType() != null ? app.getSalaryType() : "Gross") + ")";
            }

            String result = springAiService.proposeSalaryAndBonus(jobTitle, jobDesc, jobSalary, candidateInfo, criteriaMatrix, expectedSalaryInfo);

            // Lưu gợi ý Offer
            applicationRepository.updateOfferSuggestion(jobId, userId, result);

            return ResponseEntity.ok(new JSONObject(result).toMap());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi đề xuất lương thưởng: " + e.getMessage()));
        }
    }

    // ========================================================
    @GetMapping("/detail/{jobId}/{userId}")
    public ResponseEntity<?> getAiDetail(@PathVariable Integer jobId, @PathVariable Integer userId) {
        try {
            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new Exception("Không tìm thấy đơn ứng tuyển"));

            Map<String, Object> result = new HashMap<>();
            result.put("matchScore", app.getMatchScore() != null ? app.getMatchScore() : 0);
            result.put("legitScore", app.getLegitScore() != null ? app.getLegitScore() : 0);

            // Parse AI Summary
            try {
                result.put("summary", new JSONObject(app.getAiSummary()).toMap());
            } catch (Exception e) {
                result.put("summary", null);
            }

            // Parse Evidence
            try {
                JSONArray evArr = new JSONArray(app.getAiEvidence());
                List<Map<String, Object>> evList = new ArrayList<>();
                for (int i = 0; i < evArr.length(); i++) {
                    evList.add(evArr.getJSONObject(i).toMap());
                }
                result.put("evidence", evList);
            } catch (Exception e) {
                result.put("evidence", List.of());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "Kích thước tệp tin quá lớn! Vui lòng upload video/hình ảnh/audio dưới 200MB."));
    }
}