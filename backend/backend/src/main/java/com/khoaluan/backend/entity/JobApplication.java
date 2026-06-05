package com.khoaluan.backend.entity;

import jakarta.persistence.*; // Nếu bạn dùng Spring Boot 2 thì đổi thành javax.persistence.*
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
@Data // Lombok sẽ tự động tạo getMatchScore(), getAiSummary()...
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "application_id")
    private Integer applicationId;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "job_id")
    private Integer jobId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "cv_file_url")
    private String cvFileUrl;

    @Column(name = "reject_reason", columnDefinition = "NVARCHAR(MAX)")
    private String rejectReason;

    @Column(name = "status")
    private String status;

    // === CỘT CHO TÍNH NĂNG AI ===
    @Column(name = "match_score")
    private Integer matchScore;

    @Column(name = "ai_summary", columnDefinition = "NVARCHAR(MAX)")
    private String aiSummary;

    // === CỘT MỚI: LEGIT SCORE + AI EVIDENCE ===
    @Column(name = "legit_score")
    private Integer legitScore;

    @Column(name = "ai_evidence", columnDefinition = "NVARCHAR(MAX)")
    private String aiEvidence;

    // === CỘT MỚI: MOCK VECTOR DB (CHROMA DB) ===
    @Column(name = "cv_embedding", columnDefinition = "NVARCHAR(MAX)")
    private String cvEmbedding;

    // === CỘT MỚI: KẾT QUẢ PHỎNG VẤN AI (JSON) ===
    @Column(name = "interview_feedback", columnDefinition = "NVARCHAR(MAX)")
    private String interviewFeedback;

    // === CỘT MỚI: GỢI Ý OFFER AI (JSON) ===
    @Column(name = "offer_suggestion", columnDefinition = "NVARCHAR(MAX)")
    private String offerSuggestion;

    // === CỘT MỚI: BẢNG TIÊU CHÍ (JSON) ===
    @Column(name = "criteria_matrix", columnDefinition = "NVARCHAR(MAX)")
    private String criteriaMatrix;

    // === CỘT MỚI: MỨC LƯƠNG KỲ VỌNG ===
    @Column(name = "expected_salary")
    private Integer expectedSalary; // Lưu số tiền (Ví dụ: 15000000)

    @Column(name = "salary_type")
    private String salaryType; // "Gross" hoặc "Net"

    // === CỘT MỚI: ĐẶT LỊCH PHỎNG VẤN 2 CHIỀU ===
    @Column(name = "interview_preference")
    private String interviewPreference; // "online" hoặc "offline"

    @Column(name = "interview_preference_override")
    private Boolean interviewPreferenceOverride = false;
}