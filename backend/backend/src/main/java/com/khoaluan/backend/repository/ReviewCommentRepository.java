package com.khoaluan.backend.repository;

import com.khoaluan.backend.entity.ReviewComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewCommentRepository extends JpaRepository<ReviewComment, Long> {
    List<ReviewComment> findByReviewIdOrderByCreatedAtAsc(Long reviewId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByReviewId(Long reviewId);
}