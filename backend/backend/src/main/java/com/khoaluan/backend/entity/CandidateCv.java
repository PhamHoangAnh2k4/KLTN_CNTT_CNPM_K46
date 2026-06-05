package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data // Nếu bạn có dùng Lombok, nếu không hãy tạo tự động Getter/Setter
@Table(name = "candidate_cvs")
public class CandidateCv {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với User
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String originalName; // Tên gốc của file (VD: CV_Frontend.pdf)
    private String cvFile;       // Đường dẫn lưu file (VD: /uploads/cvs/cv_1_171000.pdf)
    private String fileType;     // Loại file (application/pdf, image/png...)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}