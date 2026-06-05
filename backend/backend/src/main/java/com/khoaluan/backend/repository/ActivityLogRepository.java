package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    // Lấy log theo user
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Integer userId);

    // Lấy toàn bộ log theo thời gian mới nhất
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    // Lấy log của tất cả admin (role = 'admin')
    @Query("SELECT a FROM ActivityLog a JOIN User u ON a.userId = u.userId WHERE u.role = 'admin' ORDER BY a.createdAt DESC")
    List<ActivityLog> findAllAdminLogs();

    // Lấy log của 1 admin cụ thể
    @Query("SELECT a FROM ActivityLog a JOIN User u ON a.userId = u.userId WHERE u.role = 'admin' AND a.userId = :userId ORDER BY a.createdAt DESC")
    List<ActivityLog> findAdminLogsByUserId(@Param("userId") Integer userId);
}