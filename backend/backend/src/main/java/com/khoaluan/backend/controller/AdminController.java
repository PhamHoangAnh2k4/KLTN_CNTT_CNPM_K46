package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity;
import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.entity.CandidateProfile;
import com.khoaluan.backend.entity.EmployerProfile;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.entity.Report;
import com.khoaluan.backend.entity.CompanyReview;
import com.khoaluan.backend.entity.Notification;
import com.khoaluan.backend.repository.NotificationRepository;
import com.khoaluan.backend.repository.ReportRepository;
import com.khoaluan.backend.repository.CompanyReviewRepository;
import com.khoaluan.backend.repository.ActivityLogRepository;
import com.khoaluan.backend.repository.CandidateProfileRepository;
import com.khoaluan.backend.repository.EmployerProfileRepository;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate; // THÊM IMPORT NÀY
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private EmployerProfileRepository employerProfileRepository;

    @Autowired
    private CandidateProfileRepository candidateProfileRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private CompanyReviewRepository companyReviewRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private void sendNotification(Integer userId, String title, String message, String type) {
        if (userId == null)
            return;
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setCreatedAt(java.time.LocalDateTime.now());
        notif.setIsRead(false);
        notificationRepository.save(notif);

        // Phát tín hiệu nếu hệ thống đang dùng /topic/notifications để báo có thông báo
        // mới
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/notifications", "UPDATED");
        }
    }

    // 1. TIÊM CÔNG CỤ PHÁT SÓNG WEBSOCKET
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ==========================================
    // 1. LẤY FULL DANH SÁCH USER
    // ==========================================
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> userList = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getUserId());
            map.put("name", u.getFullName());
            map.put("email", u.getEmail());

            String roleName = "Ứng viên";
            String avatar = null;
            String phone = "Chưa cập nhật";
            String businessLicenseUrl = null;
            String verificationStatus = "UNVERIFIED";

            if ("ntd".equals(u.getRole())) {
                roleName = "Nhà tuyển dụng";
                Optional<EmployerProfile> emp = employerProfileRepository.findByUserId(u.getUserId());
                if (emp.isPresent()) {
                    if (emp.get().getCompanyLogo() != null) {
                        avatar = "http://localhost:8081" + emp.get().getCompanyLogo();
                    }
                    businessLicenseUrl = emp.get().getBusinessLicenseFile();
                    verificationStatus = emp.get().getVerificationStatus() != null ? emp.get().getVerificationStatus()
                            : "UNVERIFIED";
                }
            } else if ("admin".equals(u.getRole())) {
                roleName = "Quản trị viên";
            } else {
                Optional<CandidateProfile> cand = candidateProfileRepository.findByUser_UserId(u.getUserId());
                if (cand.isPresent()) {
                    if (cand.get().getAvatar() != null)
                        avatar = "http://localhost:8081" + cand.get().getAvatar();
                    if (cand.get().getPhoneNumber() != null)
                        phone = cand.get().getPhoneNumber();
                }
            }

            map.put("role", roleName);
            map.put("avatar", avatar);
            map.put("phone", phone);
            map.put("businessLicenseUrl", businessLicenseUrl);
            map.put("verificationStatus", verificationStatus);
            map.put("status", u.getStatus() != null ? u.getStatus() : "Hoạt động");

            userList.add(map);
        }
        return ResponseEntity.ok(userList);
    }

    // ==========================================
    // 2. LẤY FULL DANH SÁCH VIỆC LÀM
    // ==========================================
    @GetMapping("/jobs")
    public ResponseEntity<?> getAllJobs() {
        List<Map<String, Object>> jobList = new ArrayList<>();
        for (Job j : jobRepository.findAll()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", j.getJobId());
            map.put("title", j.getTitle());
            map.put("salary", j.getSalary());
            map.put("location", j.getWorkLocation());
            map.put("type", j.getJobType());
            map.put("status", j.getStatus() != null ? j.getStatus() : "Chờ duyệt");
            map.put("bannerUrl", j.getBannerUrl());
            map.put("description", j.getJobDescription());
            map.put("requirements", j.getSkills());
            map.put("otherRequirements", j.getOtherRequirements());

            if (j.getDocumentName() != null && !j.getDocumentName().isEmpty()) {
                map.put("attachments", Arrays.asList(
                        Map.of("name", j.getDocumentName(), "url", "http://localhost:8081" + j.getDocumentUrl())));
            } else {
                map.put("attachments", new ArrayList<>());
            }

            String companyName = "Chưa cập nhật";
            Optional<EmployerProfile> profile = employerProfileRepository.findByUserId(j.getEmployerId());
            if (profile.isPresent() && profile.get().getCompanyName() != null) {
                companyName = profile.get().getCompanyName();
            }
            map.put("company", companyName);
            jobList.add(map);
        }
        return ResponseEntity.ok(jobList);
    }

    // ==========================================
    // 3. Cập nhật Trạng thái Việc Làm (Real-time)
    // ==========================================
    @PutMapping("/jobs/{id}/status")
    public ResponseEntity<?> updateJobStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        String adminIdStr = body.get("adminId");
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isPresent()) {
            Job job = jobOpt.get();
            job.setStatus(newStatus);
            jobRepository.save(job);
            messagingTemplate.convertAndSend("/topic/jobs", "UPDATED");

            // Ghi log chi tiết
            try {
                Integer adminId = (adminIdStr != null) ? Integer.parseInt(adminIdStr) : null;
                if (adminId != null) {
                    String action = "Duyệt".equals(newStatus) ? "kiểm duyệt" : "từ chối";
                    String desc = "Admin đã " + action + " tin tuyển dụng \"" + job.getTitle() + "\".";
                    activityLogRepository.save(new ActivityLog(adminId, "KIỂM DUYỆT TIN TUYỂN DỤNG", desc));
                }
            } catch (Exception ignored) {
            }

            return ResponseEntity.ok(Map.of("message", "Cập nhật thành công!"));
        }
        return ResponseEntity.badRequest().body("Không tìm thấy công việc");
    }

    // ==========================================
    // 4. Khóa / Mở khóa User (Real-time)
    // ==========================================
    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        String adminIdStr = body.get("adminId");
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus(newStatus);
            userRepository.save(user);
            messagingTemplate.convertAndSend("/topic/users", "UPDATED");

            // Ghi log chi tiết
            try {
                Integer adminId = (adminIdStr != null) ? Integer.parseInt(adminIdStr) : null;
                if (adminId != null) {
                    String roleLabel = "ntd".equals(user.getRole()) ? "Nhà tuyển dụng" : "Ứng viên";
                    boolean isLock = "LOCKED".equals(newStatus) || "Bị khóa".equals(newStatus);
                    String action = isLock ? "khóa" : "mở khóa";
                    String desc = "Admin đã " + action + " tài khoản " + roleLabel + " \"" + user.getFullName() + "\".";
                    String actionType = isLock ? "KHÓA TÀI KHOẢN" : "MỞ KHÓA TÀI KHOẢN";
                    activityLogRepository.save(new ActivityLog(adminId, actionType, desc));
                }
            } catch (Exception ignored) {
            }

            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái tài khoản thành " + newStatus));
        }
        return ResponseEntity.badRequest().body("Không tìm thấy người dùng!");
    }

    // ==========================================
    // 5. XÁC THỰC GPKD (Real-time)
    // ==========================================
    @PutMapping("/users/{id}/verify-license")
    public ResponseEntity<?> verifyEmployerLicense(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String adminIdStr = body.get("adminId");
        Optional<EmployerProfile> empOpt = employerProfileRepository.findByUserId(id);
        if (empOpt.isPresent()) {
            EmployerProfile emp = empOpt.get();
            emp.setVerificationStatus(status);
            employerProfileRepository.save(emp);
            messagingTemplate.convertAndSend("/topic/users", "UPDATED");

            // Ghi log chi tiết
            try {
                Integer adminId = (adminIdStr != null) ? Integer.parseInt(adminIdStr) : null;
                if (adminId != null) {
                    String companyName = emp.getCompanyName() != null ? emp.getCompanyName() : "ID " + id;
                    boolean approved = "VERIFIED".equals(status) || "APPROVED".equals(status);
                    String desc = "Admin đã " + (approved ? "phê duyệt" : "từ chối") +
                            " Giấy phép kinh doanh của Nhà tuyển dụng \"" + companyName + "\".";
                    activityLogRepository.save(new ActivityLog(adminId, "XÉT DUYỆT GPKD", desc));
                }
            } catch (Exception ignored) {
            }

            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái xác thực GPKD!"));
        }
        return ResponseEntity.badRequest().body("Không tìm thấy hồ sơ nhà tuyển dụng!");
    }

    // ==========================================
    // 6. NHẮC NHỞ CẬP NHẬT GPKD
    // ==========================================
    @LogActivity(actionType = "NHẮC NHỞ TÀI KHOẢN", description = "Admin đã gửi yêu cầu nhắc nhở cập nhật Giấy phép kinh doanh.")
    @PostMapping("/users/{id}/remind-license")
    public ResponseEntity<?> remindLicense(@PathVariable Integer id) {
        return ResponseEntity.ok(Map.of("message", "Đã gửi thông báo nhắc nhở cập nhật GPKD đến Nhà tuyển dụng!"));
    }

    // ==========================================
    // 7. LẤY LỊCH SỬ HOẠT ĐỘNG
    // ==========================================
    @GetMapping("/users/{id}/activities")
    public ResponseEntity<?> getUserActivities(@PathVariable Integer id) {
        List<ActivityLog> logs = activityLogRepository.findByUserIdOrderByCreatedAtDesc(id);
        return ResponseEntity.ok(logs);
    }

    // ==========================================
    // 8. LẤY DANH SÁCH BÁO CÁO
    // ==========================================
    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        return ResponseEntity.ok(reportRepository.findAllByOrderByIdDesc());
    }

    // ==========================================
    // 9. ADMIN XỬ LÝ BÁO CÁO (Real-time)
    // ==========================================
    @PutMapping("/reports/{id}/process")
    public ResponseEntity<?> processReport(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String action = payload.get("action");
            String adminIdStr = payload.get("adminId");
            Integer adminId = (adminIdStr != null) ? Integer.parseInt(adminIdStr) : null;

            Optional<Report> reportOpt = reportRepository.findById(id);
            if (reportOpt.isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy báo cáo!"));

            Report report = reportOpt.get();
            String targetType = report.getTargetType();
            String targetName = report.getTargetName() != null ? report.getTargetName() : "nội dung";

            if ("DISMISS".equals(action)) {
                report.setStatus("Từ chối");
                // Log: Từ chối báo cáo
                if (adminId != null) {
                    String typeLabel = getTargetTypeLabel(targetType);
                    String desc = "Admin đã từ chối báo cáo " + typeLabel + " \"" + targetName + "\" (không vi phạm).";
                    activityLogRepository.save(new ActivityLog(adminId, "TỪ CHỐI BÁO CÁO", desc));
                }
            } else if ("TAKEDOWN".equals(action)) {
                report.setStatus("Đã giải quyết");
                Long targetId = Long.parseLong(report.getTargetId());

                if ("EMPLOYER_REVIEW".equals(targetType)) {
                    companyReviewRepository.findById(targetId).ifPresent(review -> {
                        sendNotification(review.getUserId(), "Đánh giá bị gỡ bỏ",
                                "Đánh giá của bạn về công ty \"" + review.getCompanyName()
                                        + "\" đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.",
                                "warning");
                        companyReviewRepository.deleteById(targetId);
                    });
                    if (adminId != null) {
                        String desc = "Admin đã gỡ bỏ đánh giá về công ty \"" + targetName
                                + "\" do vi phạm tiêu chuẩn cộng đồng.";
                        activityLogRepository.save(new ActivityLog(adminId, "GỠ BỎ ĐÁNH GIÁ", desc));
                    }
                } else if ("CANDIDATE_POST".equals(targetType)) {
                    jobRepository.findById(targetId.intValue()).ifPresent(j -> {
                        j.setStatus("Từ chối");
                        jobRepository.save(j);
                        sendNotification(j.getEmployerId(), "Bài đăng bị gỡ bỏ",
                                "Bài đăng \"" + j.getTitle()
                                        + "\" của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.",
                                "warning");
                    });
                    if (adminId != null) {
                        String desc = "Admin đã gỡ bỏ bài đăng tìm việc \"" + targetName
                                + "\" do vi phạm tiêu chuẩn cộng đồng.";
                        activityLogRepository.save(new ActivityLog(adminId, "GỠ BỎ BÀI ĐĂNG", desc));
                    }
                } else if ("JOB".equals(targetType)) {
                    jobRepository.findById(targetId.intValue()).ifPresent(j -> {
                        j.setStatus("Từ chối");
                        jobRepository.save(j);
                        sendNotification(j.getEmployerId(), "Tin tuyển dụng bị gỡ bỏ",
                                "Tin tuyển dụng \"" + j.getTitle()
                                        + "\" của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng.",
                                "warning");
                    });
                    if (adminId != null) {
                        String desc = "Admin đã gỡ bỏ tin tuyển dụng \"" + targetName
                                + "\" do vi phạm tiêu chuẩn cộng đồng.";
                        activityLogRepository.save(new ActivityLog(adminId, "GỠ BỎ TIN TUYỂN DỤNG", desc));
                    }
                } else if ("EMPLOYER".equals(targetType)) {
                    userRepository.findById(targetId.intValue()).ifPresent(u -> {
                        u.setStatus("LOCKED");
                        userRepository.save(u);
                        sendNotification(u.getUserId(), "Tài khoản bị khóa",
                                "Tài khoản của bạn đã bị khóa do vi phạm quy định.", "warning");
                        if (adminId != null) {
                            String desc = "Admin đã khóa tài khoản Nhà tuyển dụng \"" + u.getFullName()
                                    + "\" do vi phạm quy định.";
                            activityLogRepository.save(new ActivityLog(adminId, "KHÓA TÀI KHOẢN", desc));
                        }
                    });
                }

                if (report.getReporterId() != null) {
                    sendNotification(report.getReporterId(), "Báo cáo đã được xử lý",
                            "Báo cáo vi phạm của bạn về \"" + targetName
                                    + "\" đã được Ban quản trị xử lý thành công. Cảm ơn bạn đã đóng góp!",
                            "success");
                }
            }
            reportRepository.save(report);
            messagingTemplate.convertAndSend("/topic/reports", "UPDATED");

            return ResponseEntity.ok(Map.of("message", "Thực hiện thành công!"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi server: " + e.getMessage()));
        }
    }

    // Helper: Map targetType -> Nhãn tiếng Việt
    private String getTargetTypeLabel(String type) {
        if (type == null)
            return "nội dung";
        return switch (type) {
            case "JOB" -> "tin tuyển dụng";
            case "CANDIDATE_POST" -> "bài đăng tìm việc";
            case "EMPLOYER_REVIEW" -> "đánh giá công ty";
            case "EMPLOYER" -> "tài khoản Nhà tuyển dụng";
            default -> "nội dung";
        };
    }

    // ==========================================
    // 10. LẤY CHI TIẾT ĐỐI TƯỢNG BỊ BÁO CÁO
    // ==========================================
    @GetMapping("/reports/target-details")
    public ResponseEntity<?> getTargetDetails(@RequestParam String targetType, @RequestParam String targetId) {
        try {
            Long id = Long.parseLong(targetId);
            Map<String, Object> result = new HashMap<>();
            result.put("type", targetType);

            if ("EMPLOYER_REVIEW".equals(targetType)) {
                companyReviewRepository.findById(id).ifPresent(r -> {
                    result.put("rating", r.getRating());
                    result.put("reviewContent", r.getContent());
                    result.put("reviewDate", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "Chưa rõ");
                    result.put("mediaUrl", r.getMediaUrl());
                    result.put("mediaType", r.getMediaType());
                    userRepository.findById(r.getUserId()).ifPresent(u -> result.put("ownerName", u.getFullName()));
                });
            } else if ("EMPLOYER".equals(targetType)) {
                employerProfileRepository.findByUserId(id.intValue()).ifPresent(emp -> {
                    result.put("taxCode", emp.getTaxCode());
                    result.put("address", emp.getAddress());
                    result.put("description", emp.getDescription());
                    result.put("licenseName", emp.getBusinessLicenseFile());
                    result.put("companyName", emp.getCompanyName());
                    result.put("website", emp.getWebsite());
                });
            } else if ("CANDIDATE_POST".equals(targetType) || "JOB".equals(targetType)) {
                jobRepository.findById(id.intValue()).ifPresent(j -> {
                    result.put("postContent", j.getJobDescription());
                    result.put("skills", j.getSkills());
                    result.put("experience", j.getOtherRequirements());
                    result.put("cvFile", j.getDocumentUrl());
                    result.put("title", j.getTitle());
                    result.put("bannerUrl", j.getBannerUrl());

                    Integer ownerId = j.getEmployerId();
                    if (ownerId != null) {
                        userRepository.findById(ownerId).ifPresent(u -> {
                            result.put("ownerName", u.getFullName());
                            result.put("email", u.getEmail());
                            candidateProfileRepository.findByUser_UserId(ownerId)
                                    .ifPresent(p -> result.put("phone", p.getPhoneNumber()));
                        });
                    }
                });
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi lấy dữ liệu: " + e.getMessage()));
        }
    }
}