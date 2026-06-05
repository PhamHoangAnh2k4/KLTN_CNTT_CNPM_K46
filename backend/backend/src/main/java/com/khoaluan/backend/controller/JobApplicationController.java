package com.khoaluan.backend.controller;

import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.repository.ActivityLogRepository;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.JobApplication;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.entity.CandidateProfile;
import com.khoaluan.backend.repository.JobApplicationRepository;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.repository.UserRepository;
import com.khoaluan.backend.repository.CandidateProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.khoaluan.backend.annotation.LogActivity;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:3000")
public class JobApplicationController {

    @Autowired
    private JobApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateProfileRepository profileRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository; // Bổ sung Repository ghi log

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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

    // ========================================================
    // TÍNH NĂNG 1: ỨNG VIÊN BẤM NÚT ỨNG TUYỂN / HỦY ỨNG TUYỂN
    // ========================================================
    @PostMapping("/toggle")
    // ĐÃ XÓA @LogActivity
    public ResponseEntity<?> toggleApply(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String cvUrl = payload.get("cvUrl") != null ? payload.get("cvUrl").toString() : null;

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Không tìm thấy Job"));

            // ==============================================================
            // 👇 BƯỚC CHẶN BẢO MẬT: CHỈ CHO PHÉP ỨNG TUYỂN TIN "ĐANG HIỂN THỊ"
            // ==============================================================
            if (!"Đang hiển thị".equals(job.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Tin tuyển dụng này chưa được duyệt hoặc đã bị khóa, không thể ứng tuyển!"));
            }
            // ==============================================================

            Optional<JobApplication> existingApp = applicationRepository.findByJobIdAndUserId(jobId, userId);

            if (existingApp.isPresent()) {
                applicationRepository.delete(existingApp.get());
                job.setApplyCount(Math.max(0, job.getApplyCount() - 1));
                jobRepository.save(job);

                // GHI LOG CHO ỨNG VIÊN (HỦY)
                saveManualLog(userId, "HỦY ỨNG TUYỂN", "Đã hủy ứng tuyển công việc: " + job.getTitle());

                messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
                return ResponseEntity.ok(Map.of(
                        "isApplied", false,
                        "message", "Đã hủy ứng tuyển",
                        "applyCount", job.getApplyCount()));
            } else {
                JobApplication newApp = new JobApplication();
                newApp.setJobId(jobId);
                newApp.setUserId(userId);
                newApp.setCvFileUrl(cvUrl);
                newApp.setStatus("pending"); // Đặt trạng thái ban đầu
                
                if (payload.get("expectedSalary") != null) {
                    try {
                        newApp.setExpectedSalary(Integer.parseInt(payload.get("expectedSalary").toString()));
                    } catch (Exception ignored) {}
                }
                if (payload.get("salaryType") != null) {
                    newApp.setSalaryType(payload.get("salaryType").toString());
                }
                if (payload.get("interviewPreference") != null) {
                    newApp.setInterviewPreference(payload.get("interviewPreference").toString());
                }

                applicationRepository.save(newApp);

                job.setApplyCount(job.getApplyCount() + 1);
                jobRepository.save(job);

                // GHI LOG CHO ỨNG VIÊN (NỘP)
                saveManualLog(userId, "ỨNG TUYỂN", "Đã nộp hồ sơ ứng tuyển công việc: " + job.getTitle());

                messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
                return ResponseEntity.ok(Map.of(
                        "isApplied", true,
                        "message", "Ứng tuyển thành công",
                        "applyCount", job.getApplyCount()));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // TÍNH NĂNG 2: NHÀ TUYỂN DỤNG XEM DANH SÁCH ỨNG VIÊN
    // ========================================================
    @GetMapping("/job/{jobId}/candidates")
    public ResponseEntity<?> getCandidatesByJob(@PathVariable Integer jobId) {
        try {
            List<JobApplication> apps = applicationRepository.findByJobId(jobId);
            List<Map<String, Object>> result = new ArrayList<>();

            for (JobApplication app : apps) {
                User user = userRepository.findById(app.getUserId()).orElse(null);
                CandidateProfile profile = profileRepository.findByUser_UserId(app.getUserId()).orElse(null);

                if (user != null) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getUserId());
                    map.put("fullName", user.getFullName());
                    map.put("email", user.getEmail());
                    map.put("role", user.getRole());
                    map.put("appliedAt", app.getAppliedAt());
                    map.put("phone", profile != null ? profile.getPhoneNumber() : "N/A");
                    map.put("avatar", profile != null ? profile.getAvatar() : null);

                    map.put("status", app.getStatus() != null ? app.getStatus() : "pending");
                    map.put("rejectReason", app.getRejectReason());
                    map.put("matchScore", app.getMatchScore() != null ? app.getMatchScore() : 0);
                    map.put("legitScore", app.getLegitScore() != null ? app.getLegitScore() : 0);
                    map.put("aiSummary", app.getAiSummary());
                    map.put("aiEvidence", app.getAiEvidence());
                    map.put("expectedSalary", app.getExpectedSalary());
                    map.put("salaryType", app.getSalaryType());
                    map.put("interviewPreference", app.getInterviewPreference());
                    map.put("interviewPreferenceOverride", app.getInterviewPreferenceOverride());

                    String finalCv = (app.getCvFileUrl() != null && !app.getCvFileUrl().isEmpty())
                            ? app.getCvFileUrl()
                            : (profile != null ? profile.getCvFile() : null);
                    map.put("cvUrl", finalCv);

                    result.add(map);
                }
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // TÍNH NĂNG 3: LẤY DANH SÁCH JOB ĐÃ NỘP CỦA 1 USER
    // ========================================================
    @GetMapping("/user/{userId}/applied-jobs")
    public ResponseEntity<?> getAppliedJobsByUser(@PathVariable Integer userId) {
        try {
            List<JobApplication> apps = applicationRepository.findByUserId(userId);

            List<Map<String, Object>> appliedJobs = new ArrayList<>();
            for (JobApplication app : apps) {
                Map<String, Object> map = new HashMap<>();
                map.put("jobId", app.getJobId());
                map.put("status", app.getStatus() != null ? app.getStatus() : "pending");
                map.put("interviewPreference", app.getInterviewPreference());
                map.put("interviewPreferenceOverride", app.getInterviewPreferenceOverride());
                appliedJobs.add(map);
            }
            return ResponseEntity.ok(appliedJobs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // TÍNH NĂNG 4: LƯU TRẠNG THÁI & TRỪ SỐ LƯỢNG ỨNG VIÊN
    // ========================================================
    @PutMapping("/update-status")
    // ĐÃ XÓA @LogActivity
    public ResponseEntity<?> updateCandidateStatus(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String newStatus = payload.get("status").toString().toLowerCase();
            String rejectReason = payload.get("rejectReason") != null ? payload.get("rejectReason").toString() : null;

            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn ứng tuyển"));

            String oldStatus = app.getStatus() != null ? app.getStatus().toLowerCase() : "pending";

            boolean wasActive = oldStatus.equals("pending") || oldStatus.equals("interviewing");
            boolean isFinished = newStatus.equals("passed") || newStatus.equals("rejected");

            if (wasActive && isFinished) {
                Job job = jobRepository.findById(jobId).orElse(null);
                if (job != null && job.getApplyCount() > 0) {
                    job.setApplyCount(job.getApplyCount() - 1);
                    jobRepository.save(job);
                }
            } else if (!wasActive && (newStatus.equals("pending") || newStatus.equals("interviewing"))) {
                Job job = jobRepository.findById(jobId).orElse(null);
                if (job != null) {
                    job.setApplyCount(job.getApplyCount() + 1);
                    jobRepository.save(job);
                }
            }

            app.setStatus(newStatus);
            app.setRejectReason(rejectReason);
            
            if (payload.containsKey("interviewPreference")) {
                app.setInterviewPreference(payload.get("interviewPreference") != null ? payload.get("interviewPreference").toString() : null);
            }
            if (payload.containsKey("interviewPreferenceOverride")) {
                app.setInterviewPreferenceOverride(payload.get("interviewPreferenceOverride") != null ? Boolean.parseBoolean(payload.get("interviewPreferenceOverride").toString()) : false);
            }

            applicationRepository.save(app);

            // ========================================================
            // GHI LOG CHO NHÀ TUYỂN DỤNG KHI DUYỆT / TỪ CHỐI
            // ========================================================
            Job jobForLog = jobRepository.findById(jobId).orElse(null);
            if (jobForLog != null) {
                String translatedStatus = newStatus.equals("passed") ? "Đã duyệt (Pass)"
                        : newStatus.equals("rejected") ? "Từ chối"
                                : newStatus.equals("interviewing") ? "Đang phỏng vấn" : newStatus;

                saveManualLog(
                        jobForLog.getEmployerId(),
                        "XỬ LÝ ỨNG VIÊN",
                        "Đã cập nhật trạng thái hồ sơ của ứng viên thành: " + translatedStatus);
            }

            messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Cập nhật hệ thống thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update-salary")
    public ResponseEntity<?> updateCandidateSalary(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            
            Integer expectedSalary = null;
            if (payload.get("expectedSalary") != null && !payload.get("expectedSalary").toString().trim().isEmpty()) {
                expectedSalary = (int) Math.round(Double.parseDouble(payload.get("expectedSalary").toString()));
            }
            
            String salaryType = payload.get("salaryType") != null ? payload.get("salaryType").toString() : null;

            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn ứng tuyển"));

            app.setExpectedSalary(expectedSalary);
            app.setSalaryType(salaryType);
            applicationRepository.save(app);

            messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Cập nhật mức đề xuất thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update-interview-preference")
    @LogActivity(actionType = "CẬP NHẬT HÌNH THỨC PHỎNG VẤN", description = "Ứng viên đã chọn hình thức phỏng vấn mong muốn")
    public ResponseEntity<?> updateInterviewPreference(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String preference = payload.get("interviewPreference").toString(); // "online" hoặc "offline"

            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn ứng tuyển"));

            app.setInterviewPreference(preference);
            applicationRepository.save(app);

            saveManualLog(userId, "CẬP NHẬT HÌNH THỨC PHỎNG VẤN", "Ứng viên đã chọn hình thức phỏng vấn mong muốn: " + preference);

            messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Cập nhật hình thức phỏng vấn mong muốn thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // TÍNH NĂNG 5: TỪ CHỐI HÀNG LOẠT (BULK REJECT)
    // ========================================================
    @PutMapping("/bulk-reject")
    public ResponseEntity<?> bulkRejectCandidates(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            List<Integer> candidateIds = (List<Integer>) payload.get("candidateIds");

            if (candidateIds == null || candidateIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Danh sách ứng viên trống"));
            }

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new RuntimeException("Không tìm thấy Job"));
            int rejectedCount = 0;

            for (Integer userId : candidateIds) {
                Optional<JobApplication> appOpt = applicationRepository.findByJobIdAndUserId(jobId, userId);
                if (appOpt.isPresent()) {
                    JobApplication app = appOpt.get();
                    String oldStatus = app.getStatus() != null ? app.getStatus().toLowerCase() : "pending";
                    boolean wasActive = oldStatus.equals("pending") || oldStatus.equals("interviewing");

                    if (wasActive) {
                        job.setApplyCount(Math.max(0, job.getApplyCount() - 1));
                    }

                    app.setStatus("rejected");
                    app.setRejectReason("Nhà tuyển dụng đã từ chối hồ sơ này.");
                    applicationRepository.save(app);
                    rejectedCount++;
                }
            }

            jobRepository.save(job);

            // Ghi log Bulk Reject
            saveManualLog(
                    job.getEmployerId(),
                    "TỪ CHỐI HÀNG LOẠT",
                    "Đã từ chối hàng loạt " + rejectedCount + " ứng viên cho công việc: " + job.getTitle());

            messagingTemplate.convertAndSend("/topic/applications", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Đã từ chối " + rejectedCount + " ứng viên thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}