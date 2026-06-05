package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role; // 'admin', 'ung_vien', 'ntd'

    private LocalDateTime createdAt = LocalDateTime.now();

    // Thêm vào class User trong package com.khoaluan.backend.entity
    @Column(name = "status")
    private String status = "Hoạt động"; // Mặc định là Hoạt động
}