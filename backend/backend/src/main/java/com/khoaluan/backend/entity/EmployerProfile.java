package com.khoaluan.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "employer_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class EmployerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer profileId;

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    private String companyName;
    private String taxCode;
    private String companySize;
    private String website;
    private String address;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    private String companyLogo;
    private String businessLicenseFile;

    private String verificationStatus = "UNVERIFIED";

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}