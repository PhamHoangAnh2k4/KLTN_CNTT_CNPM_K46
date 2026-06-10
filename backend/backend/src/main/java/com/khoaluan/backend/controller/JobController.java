package com.khoaluan.backend.controller;

import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.Notification;
import com.khoaluan.backend.repository.ActivityLogRepository;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.repository.NotificationRepository;
import com.khoaluan.backend.util.FileHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.khoaluan.backend.service.SpringAiService;
import com.khoaluan.backend.service.QdrantService;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "http://localhost:3000")
public class JobController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SpringAiService springAiService;

    @Autowired
    private QdrantService qdrantService;

    private final String URL_UPLOAD_DIR = "uploads";
    private final String PHYSICAL_UPLOAD_DIR = "D:/DA_KHOALUAN/backend/uploads";

    // ========================================================
    // --- HÀM GHI NHẬT KÝ (LOG) THỦ CÔNG ---
    // ========================================================
    private void saveManualLog(Integer userId, String action, String desc) {
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
            System.err.println("Lỗi ghi log thủ công: " + e.getMessage());
        }
    }

    // --- HÀM HỖ TRỢ (HELPERS) ---
    private String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty())
            return null;

        String contentType = file.getContentType();
        String subDir = "others";
        if (contentType != null) {
            if (contentType.startsWith("image"))
                subDir = "images";
            else if (contentType.startsWith("video"))
                subDir = "videos";
            else if (contentType.contains("pdf") || contentType.contains("word")
                    || contentType.contains("officedocument"))
                subDir = "docs";
        }

        Path uploadPath = Paths.get(PHYSICAL_UPLOAD_DIR, subDir);
        if (!Files.exists(uploadPath))
            Files.createDirectories(uploadPath);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String sanitizedName = FileHelper.sanitizeFilename(originalName);
        String fileName = UUID.randomUUID().toString() + "_" + sanitizedName;
        Path filePath = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/" + subDir + "/" + fileName;
    }

    private void deletePhysicalFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty())
            return;
        try {
            String relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
            relativePath = relativePath.replace("uploads/", "");
            Path path = Paths.get(PHYSICAL_UPLOAD_DIR, relativePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Lỗi xóa file vật lý: " + e.getMessage());
        }
    }

    // --- API ENDPOINTS ---

    @GetMapping
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    @GetMapping("/{id}")
    public Job getJobById(@PathVariable Integer id) {
        return jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy ID: " + id));
    }

    @GetMapping("/employer/{employerId}")
    public List<Job> getJobsByEmployerId(@PathVariable Integer employerId) {
        return jobRepository.findByEmployerId(employerId);
    }

    private void indexJobInQdrant(Job job) {
        if (job == null) return;
        try {
            String jobDescription = job.getJobDescription();
            if (jobDescription != null && !jobDescription.trim().isEmpty()) {
                List<Float> jdEmbeddingList = springAiService.getEmbeddingList(jobDescription);
                if (jdEmbeddingList != null && !jdEmbeddingList.isEmpty()) {
                    Map<String, String> jobMeta = new HashMap<>();
                    jobMeta.put("title", job.getTitle() != null ? job.getTitle() : "");
                    jobMeta.put("description", jobDescription);
                    qdrantService.upsertJobVector(Long.valueOf(job.getJobId()), jdEmbeddingList, jobMeta);
                    System.out.println("✅ [Qdrant] Tự động đồng bộ index vector cho Job ID: " + job.getJobId());
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi đồng bộ index vector Job lên Qdrant: " + e.getMessage());
        }
    }

    // 1. ĐĂNG TIN
    @PostMapping
    public Job createJob(
            @ModelAttribute Job job,
            @RequestParam(value = "newMediaFiles", required = false) MultipartFile[] newMediaFiles,
            @RequestParam(value = "documentFile", required = false) MultipartFile documentFile) throws IOException {

        if (newMediaFiles != null && newMediaFiles.length > 0) {
            List<String> urls = new ArrayList<>();
            for (MultipartFile file : newMediaFiles) {
                String savedPath = saveFile(file);
                if (savedPath != null)
                    urls.add(savedPath);
            }
            job.setBannerUrl(String.join(",", urls));
        }

        if (documentFile != null && !documentFile.isEmpty()) {
            job.setDocumentUrl(saveFile(documentFile));
            job.setDocumentName(documentFile.getOriginalFilename());
        }

        if (job.getStatus() == null) {
            job.setStatus("Chờ duyệt");
        }
        if (job.getCreatedAt() == null)
            job.setCreatedAt(java.time.LocalDateTime.now());

        if (job.getViewCount() == null)
            job.setViewCount(0);
        if (job.getApplyCount() == null)
            job.setApplyCount(0);

        Job savedJob = jobRepository.save(job);

        if ("Đang hiển thị".equalsIgnoreCase(savedJob.getStatus())) {
            indexJobInQdrant(savedJob);
        }

        saveManualLog(savedJob.getEmployerId(), "ĐĂNG TIN MỚI",
                "Nhà tuyển dụng đã đăng một tin tuyển dụng mới: " + savedJob.getTitle());

        messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
        return savedJob;
    }

    // 2. CẬP NHẬT TIN
    @PutMapping("/{id}")
    public Job updateJob(
            @PathVariable Integer id,
            @ModelAttribute Job jobDetails,
            @RequestParam(value = "remainingMedia", required = false) String remainingMedia,
            @RequestParam(value = "newMediaFiles", required = false) MultipartFile[] newMediaFiles,
            @RequestParam(value = "documentFile", required = false) MultipartFile documentFile) throws IOException {
        Job existingJob = jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));

        List<String> finalUrls = new ArrayList<>();

        if (remainingMedia != null && !remainingMedia.isEmpty()) {
            finalUrls.addAll(Arrays.asList(remainingMedia.split(",")));
        }

        if (existingJob.getBannerUrl() != null && !existingJob.getBannerUrl().isEmpty()) {
            String[] currentUrls = existingJob.getBannerUrl().split(",");
            for (String url : currentUrls) {
                if (!finalUrls.contains(url)) {
                    deletePhysicalFile(url);
                }
            }
        }

        if (newMediaFiles != null && newMediaFiles.length > 0) {
            for (MultipartFile file : newMediaFiles) {
                String savedPath = saveFile(file);
                if (savedPath != null)
                    finalUrls.add(savedPath);
            }
        }

        existingJob.setBannerUrl(finalUrls.isEmpty() ? null : String.join(",", finalUrls));

        if (documentFile != null && !documentFile.isEmpty()) {
            if (existingJob.getDocumentUrl() != null) {
                deletePhysicalFile(existingJob.getDocumentUrl());
            }
            existingJob.setDocumentUrl(saveFile(documentFile));
            existingJob.setDocumentName(documentFile.getOriginalFilename());
        }

        existingJob.setTitle(jobDetails.getTitle());
        existingJob.setSkills(jobDetails.getSkills());
        existingJob.setJobDescription(jobDetails.getJobDescription());
        existingJob.setOtherRequirements(jobDetails.getOtherRequirements());
        existingJob.setSalary(jobDetails.getSalary());
        existingJob.setJobType(jobDetails.getJobType());
        existingJob.setExperience(jobDetails.getExperience());
        existingJob.setWorkLocation(jobDetails.getWorkLocation());

        // ==============================================================
        // BƯỚC CHẶN BẢO MẬT: BẤT KỲ KHI NÀO SỬA TIN CŨNG PHẢI DUYỆT LẠI
        // ==============================================================
        existingJob.setStatus("Chờ duyệt");

        Job savedJob = jobRepository.save(existingJob);

        if ("Đang hiển thị".equalsIgnoreCase(savedJob.getStatus())) {
            indexJobInQdrant(savedJob);
        }

        saveManualLog(savedJob.getEmployerId(), "CẬP NHẬT TIN",
                "Nhà tuyển dụng đã chỉnh sửa thông tin việc làm: " + savedJob.getTitle());

        messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
        return savedJob;
    }

    // 3. XÓA TIN
    @DeleteMapping("/{id}")
    public Map<String, String> deleteJob(@PathVariable Integer id) {
        Job job = jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));

        Integer empId = job.getEmployerId();
        String jobTitle = job.getTitle();

        if (job.getBannerUrl() != null && !job.getBannerUrl().isEmpty()) {
            for (String url : job.getBannerUrl().split(",")) {
                deletePhysicalFile(url);
            }
        }

        if (job.getDocumentUrl() != null) {
            deletePhysicalFile(job.getDocumentUrl());
        }

        jobRepository.delete(job);

        saveManualLog(empId, "XÓA TIN", "Nhà tuyển dụng đã xóa tin tuyển dụng: " + jobTitle);

        messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
        return Map.of("message", "Xóa thành công tin tuyển dụng và dữ liệu đính kèm");
    }

    // ========================================================
    // --- API KIỂM DUYỆT VIỆC LÀM (DÀNH CHO ADMIN) ---
    // ========================================================
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateJobStatus(@PathVariable Integer id, @RequestBody Map<String, String> payload) {
        try {
            String newStatus = payload.get("status");
            Job job = jobRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tin tuyển dụng"));

            Notification notif = new Notification();
            notif.setUserId(job.getEmployerId());
            notif.setCreatedAt(LocalDateTime.now());
            notif.setIsRead(false);
            notif.setType("SYSTEM");

            if ("Đang hiển thị".equals(newStatus)) {
                job.setStatus(newStatus);
                Job savedJob = jobRepository.save(job);
                indexJobInQdrant(savedJob);

                notif.setTitle("🎉 Tin tuyển dụng đã được duyệt!");
                notif.setMessage("Bài đăng '" + job.getTitle() + "' của bạn đã được kiểm duyệt và đang hiển thị.");
                notif.setLink("/employer/jobs");
                notificationRepository.save(notif);

                saveManualLog(1, "KIỂM DUYỆT", "Admin đã PHÊ DUYỆT tin tuyển dụng: " + job.getTitle());
                messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
                return ResponseEntity
                        .ok(Map.of("message", "Đã phê duyệt tin tuyển dụng thành công!", "status", newStatus));
            }

            else if ("Từ chối".equals(newStatus)) {
                notif.setTitle("❌ Tin tuyển dụng bị từ chối");
                notif.setMessage("Bài đăng '" + job.getTitle()
                        + "' của bạn không hợp lệ nên đã bị từ chối và gỡ bỏ. Vui lòng đăng lại tin khác đúng quy định.");
                notif.setLink("/employer/jobs");
                notificationRepository.save(notif);

                saveManualLog(1, "KIỂM DUYỆT", "Admin đã TỪ CHỐI và XÓA tin tuyển dụng: " + job.getTitle());

                if (job.getBannerUrl() != null && !job.getBannerUrl().isEmpty()) {
                    for (String url : job.getBannerUrl().split(",")) {
                        deletePhysicalFile(url);
                    }
                }
                if (job.getDocumentUrl() != null) {
                    deletePhysicalFile(job.getDocumentUrl());
                }

                jobRepository.delete(job);

                messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
                return ResponseEntity
                        .ok(Map.of("message", "Đã từ chối và xóa tin tuyển dụng khỏi hệ thống!", "status", "Đã xóa"));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không hợp lệ"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // --- API CẬP NHẬT LƯỢT XEM VÀ LƯỢT ỨNG TUYỂN ---
    // ========================================================

    @PutMapping("/{id}/increment-view")
    public ResponseEntity<?> incrementView(@PathVariable Integer id) {
        try {
            jobRepository.incrementViewCount(id);
            messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Đã tăng lượt xem"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> toggleApplyJob(@PathVariable Integer id, @RequestBody Map<String, Boolean> payload) {
        try {
            boolean isApplying = payload.getOrDefault("isApplying", true);
            int amount = isApplying ? 1 : -1;

            System.out.println("Processing apply for Job ID: " + id + ", isApplying: " + isApplying);

            jobRepository.updateApplyCount(id, amount);

            Job updatedJob = jobRepository.findById(id).orElse(null);
            Integer currentCount = (updatedJob != null) ? updatedJob.getApplyCount() : 0;

            messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");
            return ResponseEntity.ok(Map.of(
                    "message", isApplying ? "Ứng tuyển thành công" : "Đã hủy ứng tuyển",
                    "applyCount", currentCount));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}