package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Data
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Thông tin người gửi ---
    private Integer reporterId; 
    
    @Column(columnDefinition = "nvarchar(255)") // Fix lỗi font
    private String reporterName; 

    // --- Nội dung báo cáo ---
    @Column(columnDefinition = "nvarchar(255)") // Fix lỗi font
    private String type; // VD: "Nội dung phản cảm", "Lừa đảo"
    
    @Column(columnDefinition = "nvarchar(MAX)") // Fix lỗi font + Lưu nội dung dài
    private String description;

    // --- ĐỐI TƯỢNG BỊ BÁO CÁO (Target) ---
    private String targetType; // "REVIEW", "JOB", "USER"
    private String targetId;   
    
    @Column(columnDefinition = "nvarchar(255)") // Fix lỗi font
    private String targetName; 

    // --- THÔNG TIN CHI TIẾT CỦA BÀI ĐĂNG BỊ BÁO CÁO (Mới bổ sung) ---
    // Lưu lại nội dung và ảnh tại thời điểm báo cáo để Admin xem luôn không cần tìm lại
    
    @Column(columnDefinition = "nvarchar(MAX)") 
    private String reportedPostContent; // Lưu nội dung bài viết bị báo cáo

    @Column(columnDefinition = "nvarchar(MAX)")
    private String reportedPostImage;   // Lưu URL ảnh của bài viết bị báo cáo

    // --- Trạng thái ---
    @Column(columnDefinition = "nvarchar(50)")
    private String status; // "Chờ duyệt", "Đã xử lý"
    
    private String date; 

    @PrePersist
    public void prePersist() {
        if (this.date == null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            this.date = LocalDateTime.now().format(formatter);
        }
        if (this.status == null) {
            this.status = "Chờ duyệt";
        }
    }
}