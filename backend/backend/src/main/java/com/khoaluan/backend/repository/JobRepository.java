package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Integer> {
    
    // Tìm danh sách tin tuyển dụng dựa theo ID của nhà tuyển dụng
    List<Job> findByEmployerId(Integer employerId);

    /**
     * Tăng/Giảm lượt ứng tuyển trực tiếp trong DB.
     * Sử dụng CASE WHEN để đảm bảo applyCount không bao giờ bị âm (< 0).
     */
    @Modifying
    @Transactional
    @Query("UPDATE Job j SET j.applyCount = CASE " +
           "WHEN (:amount > 0) THEN (j.applyCount + :amount) " + // Nếu cộng thêm thì cứ cộng
           "WHEN (:amount < 0 AND j.applyCount > 0) THEN (j.applyCount + :amount) " + // Nếu trừ đi thì chỉ trừ khi đang > 0
           "ELSE 0 END " + // Các trường hợp còn lại (đang bằng 0 mà đòi trừ) thì giữ nguyên là 0
           "WHERE j.jobId = :id")
    void updateApplyCount(@Param("id") Integer id, @Param("amount") Integer amount);

    /**
     * Tăng lượt xem trực tiếp trong DB
     */
    @Modifying
    @Transactional
    @Query("UPDATE Job j SET j.viewCount = COALESCE(j.viewCount, 0) + 1 WHERE j.jobId = :id")
    void incrementViewCount(@Param("id") Integer id);
}