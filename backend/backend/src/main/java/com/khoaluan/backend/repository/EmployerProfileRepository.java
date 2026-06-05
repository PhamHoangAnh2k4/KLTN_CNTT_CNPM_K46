package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.EmployerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Integer> {
    
    // Giữ nguyên hàm cũ của bạn
    Optional<EmployerProfile> findByUserId(Integer userId);

    // THÊM MỚI: Tìm danh sách công ty theo tên (không phân biệt hoa thường)
    List<EmployerProfile> findByCompanyNameContainingIgnoreCase(String companyName);
}