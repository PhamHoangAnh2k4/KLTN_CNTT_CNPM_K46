package com.khoaluan.backend.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiMatchingResponse {
    private List<String> aiKeywords;
    private List<MatchedJob> matchedJobs;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MatchedJob {
        private Long id;
        private String title;
        private String company;
        private int matchPercent;
        private String aiExplanation;
        private String salary;
    }
}