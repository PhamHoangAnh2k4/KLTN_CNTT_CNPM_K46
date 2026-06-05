package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.CandidateCv;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateCvRepository extends JpaRepository<CandidateCv, Long> {
    List<CandidateCv> findByUser_UserIdOrderByUploadedAtDesc(Integer userId);
}