package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer jobId;

    private Integer employerId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String skills;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String jobDescription;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String otherRequirements;

    private String salary;
    private String jobType;
    private String experience;

    @Column(length = 500)
    private String workLocation;

    private String status = "Đang hiển thị";

    @Column(name = "banner_url", columnDefinition = "NVARCHAR(MAX)")
    private String bannerUrl;

    @Column(name = "document_url", columnDefinition = "NVARCHAR(MAX)")
    private String documentUrl;

    @Column(name = "document_name", length = 255)
    private String documentName;

    private LocalDateTime createdAt = LocalDateTime.now();

    // --- ĐÃ THÊM: 2 TRƯỜNG ĐỂ LƯU SỐ LƯỢT XEM VÀ ỨNG TUYỂN ---
    @Column(name = "view_count", columnDefinition = "INT DEFAULT 0")
    private Integer viewCount = 0;

    @Column(name = "apply_count", columnDefinition = "INT DEFAULT 0")
    private Integer applyCount = 0;

}