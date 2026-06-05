package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Integer userId; 

    // ĐÃ THÊM NVARCHAR Ở ĐÂY
    @Column(name = "action_type", columnDefinition = "NVARCHAR(255)")
    private String actionType; 

    @Column(columnDefinition = "NVARCHAR(500)")
    private String description; 

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public ActivityLog() {
        this.createdAt = LocalDateTime.now();
    }

    public ActivityLog(Integer userId, String actionType, String description) {
        this.userId = userId;
        this.actionType = actionType;
        this.description = description;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}