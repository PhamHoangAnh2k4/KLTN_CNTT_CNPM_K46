package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity;
import com.khoaluan.backend.entity.Report;
import com.khoaluan.backend.entity.CompanyReview;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.repository.ReportRepository;
import com.khoaluan.backend.repository.CompanyReviewRepository;
import com.khoaluan.backend.repository.JobRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    // THÊM: Inject các Repository để lấy dữ liệu bài viết gốc
    @Autowired
    private CompanyReviewRepository companyReviewRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/add")
    @LogActivity(actionType = "GỬI BÁO CÁO", description = "Người dùng đã gửi một báo cáo vi phạm hệ thống")
    public ResponseEntity<?> createReport(@RequestBody Map<String, Object> request) {
        try {
            Report report = new Report();
            report.setReporterId(Integer.parseInt(request.get("userId").toString()));
            report.setReporterName(request.get("userName").toString());
            
            report.setType(request.get("reason").toString());
            report.setDescription(request.get("details") != null ? request.get("details").toString() : "");
            
            // Dữ liệu Đa hình (Polymorphic)
            String targetType = request.get("targetType").toString();
            String targetIdStr = request.get("targetId").toString();
            
            report.setTargetType(targetType);
            report.setTargetId(targetIdStr);
            report.setTargetName(request.get("targetName").toString());

            // =========================================================================
            // BỔ SUNG: LẤY NỘI DUNG VÀ ẢNH GỐC CỦA BÀI VIẾT ĐỂ LƯU KÈM VÀO BÁO CÁO
            // =========================================================================
            try {
                Long targetId = Long.parseLong(targetIdStr);
                
                if ("EMPLOYER_REVIEW".equals(targetType)) {
                    // Nếu là bài Đánh giá công ty -> Lấy từ bảng CompanyReview
                    companyReviewRepository.findById(targetId).ifPresent(review -> {
                        report.setReportedPostContent(review.getContent());
                        report.setReportedPostImage(review.getMediaUrl()); // Lấy link ảnh/video
                    });
                } 
                else if ("CANDIDATE_POST".equals(targetType) || "JOB".equals(targetType)) {
                    // Nếu là Tin tuyển dụng / Bài ứng viên -> Lấy từ bảng Job
                    jobRepository.findById(targetId.intValue()).ifPresent(job -> {
                        report.setReportedPostContent(job.getJobDescription());
                        report.setReportedPostImage(job.getBannerUrl()); // Hoặc getDocumentUrl() tùy logic lưu ảnh của bạn
                    });
                }
            } catch (Exception e) {
                System.out.println("Lỗi khi tự động trích xuất nội dung bài viết gốc: " + e.getMessage());
                // Không throw lỗi ở đây để không làm gián đoạn luồng gửi báo cáo chính
            }
            // =========================================================================

            // Lưu báo cáo vào Database
            reportRepository.save(report);
            
            messagingTemplate.convertAndSend("/topic/reports", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Gửi báo cáo thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi khi gửi báo cáo: " + e.getMessage()));
        }
    }
}