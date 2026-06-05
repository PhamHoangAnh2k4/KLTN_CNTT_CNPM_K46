package com.khoaluan.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CandidateDto {
    private Integer id; // userId
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String cvUrl;
    private String status;
    private String rejectReason;
    private Integer matchScore; // Điểm AI Match
    private String aiSummary; // Chuỗi JSON chứa skills, edu, workHistory

    // === TRƯỜNG MỚI CHO AI NÂNG CAO ===
    private Integer legitScore; // Điểm trung thực (0-100)
    private String aiEvidence; // JSON mảng các bằng chứng AI đưa ra

    private String interviewFeedback; // JSON kết quả phỏng vấn AI
    private String offerSuggestion;   // JSON gợi ý đãi ngộ AI
    private String criteriaMatrix;     // JSON bảng tiêu chí đánh giá
    private String interviewPreference; // online / offline - lựa chọn của ứng viên
}