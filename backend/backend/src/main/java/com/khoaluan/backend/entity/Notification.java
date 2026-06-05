package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    // THÊM DÒNG NÀY ĐỂ FIX LỖI FONT CHỮ TIẾNG VIỆT CHO TITLE
    @Column(columnDefinition = "NVARCHAR(255)")
    private String title;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String message;
    
    private String type; // passed, rejected, interviewing, system, warning, action
    
    private Boolean isRead = false;
    
    @Column(name = "link") 
    private String link;

    private LocalDateTime createdAt = LocalDateTime.now();

    // --- GETTER / SETTER ---
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}