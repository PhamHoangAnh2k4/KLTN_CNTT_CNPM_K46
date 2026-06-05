package com.khoaluan.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReviewResponse {
    private Long id;
    private Integer userId;
    private UserDto user;
    private String company;
    private Integer rating;
    private String content;
    private String media;
    private String mediaType;
    private String time;
    private Integer likes;
    private List<CommentDto> comments;

    @Data
    public static class UserDto {
        private String name;
        private String avatar;
        private String title;
    }

    @Data
    public static class CommentDto {
        private Long id;
        private String user;
        private String avatar;
        private String content;
    }
}