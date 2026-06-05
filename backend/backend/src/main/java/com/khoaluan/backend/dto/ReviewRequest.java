package com.khoaluan.backend.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer userId;
    private String companyName;
    private Integer rating;
    private String content;
    private Long reviewId; // Dùng cho phần gửi bình luận con
}