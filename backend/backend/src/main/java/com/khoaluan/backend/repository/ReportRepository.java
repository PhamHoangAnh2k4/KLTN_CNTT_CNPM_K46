package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(String status);
    List<Report> findAllByOrderByIdDesc(); // Sắp xếp báo cáo mới nhất lên đầu
}