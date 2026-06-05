package com.khoaluan.backend.dto;

import lombok.Data;

@Data
public class MatchedJobDto {
    private Integer id; // Đổi sang Integer để khớp với jobId trong entity Job.java của bạn
    private String title;
    private String company;
    private int matchPercent;
    private String aiExplanation;
    private String salary;
}