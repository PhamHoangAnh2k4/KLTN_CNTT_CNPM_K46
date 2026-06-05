package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Integer> {

        // Tìm tất cả ứng viên nộp vào 1 công việc
        List<JobApplication> findByJobId(Integer jobId);

        // Tìm đúng 1 đơn nộp của 1 user vào 1 job (Dùng cho Modal chi tiết)
        Optional<JobApplication> findByJobIdAndUserId(Integer jobId, Integer userId);

        // Tìm tất cả đơn nộp của 1 user
        List<JobApplication> findByUserId(Integer userId);

        // =========================================================================
        // CẬP NHẬT KẾT QUẢ AI VÀO DATABASE (Match Score + Legit Score + Evidence)
        // =========================================================================
        @Modifying
        @Transactional
        @Query(value = "UPDATE job_applications SET match_score = :score, ai_summary = :summary, legit_score = :legitScore, ai_evidence = :evidence, cv_embedding = :embedding WHERE job_id = :jobId AND user_id = :userId", nativeQuery = true)
        void updateAiResult(@Param("jobId") Integer jobId,
                        @Param("userId") Integer userId,
                        @Param("score") Integer score,
                        @Param("summary") String summary,
                        @Param("legitScore") Integer legitScore,
                        @Param("evidence") String evidence,
                        @Param("embedding") String embedding);

        // =========================================================================
        // LƯU KẾT QUẢ PHỎNG VẤN VÀO DATABASE
        // =========================================================================
        @Modifying
        @Transactional
        @Query(value = "UPDATE job_applications SET interview_feedback = :feedback WHERE job_id = :jobId AND user_id = :userId", nativeQuery = true)
        void updateInterviewFeedback(@Param("jobId") Integer jobId,
                        @Param("userId") Integer userId,
                        @Param("feedback") String feedback);

        // =========================================================================
        // LƯU GỢI Ý OFFER VÀO DATABASE
        // =========================================================================
        @Modifying
        @Transactional
        @Query(value = "UPDATE job_applications SET offer_suggestion = :offer WHERE job_id = :jobId AND user_id = :userId", nativeQuery = true)
        void updateOfferSuggestion(@Param("jobId") Integer jobId,
                        @Param("userId") Integer userId,
                        @Param("offer") String offer);

        @Modifying
        @Transactional
        @Query(value = "UPDATE job_applications SET criteria_matrix = :matrix WHERE job_id = :jobId AND user_id = :userId", nativeQuery = true)
        void updateCriteriaMatrix(@Param("jobId") Integer jobId,
                        @Param("userId") Integer userId,
                        @Param("matrix") String matrix);
}