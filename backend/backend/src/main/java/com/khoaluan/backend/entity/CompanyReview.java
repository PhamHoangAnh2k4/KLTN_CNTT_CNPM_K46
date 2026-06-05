package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "company_reviews")
public class CompanyReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Integer userId;

    // Phải có cột này để SQL Server không báo lỗi thiếu cột company_id
    @Column(name = "company_id")
    private Integer companyId;   

    @Column(name = "company_name", columnDefinition = "NVARCHAR(255)")
    private String companyName;

    private Integer rating;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    // SỬ DỤNG NVARCHAR(MAX) ĐỂ LƯU ẢNH BASE64 TRONG SQL SERVER
    @Column(name = "media_url", columnDefinition = "NVARCHAR(MAX)")
    private String mediaUrl;
    
    @Column(name = "media_type")
    private String mediaType; // "image" hoặc "video"

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}