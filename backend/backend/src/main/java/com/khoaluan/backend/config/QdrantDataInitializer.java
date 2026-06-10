package com.khoaluan.backend.config;

import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.service.QdrantService;
import com.khoaluan.backend.service.SpringAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class QdrantDataInitializer implements CommandLineRunner {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private SpringAiService springAiService;

    @Autowired
    private QdrantService qdrantService;

    @Override
    public void run(String... args) {
        System.out.println("🔄 [Qdrant Sync] Bắt đầu đồng bộ danh sách Job sang Qdrant...");
        try {
            List<Job> activeJobs = jobRepository.findAll().stream()
                    .filter(j -> "Đang hiển thị".equalsIgnoreCase(j.getStatus()))
                    .collect(Collectors.toList());

            if (activeJobs.isEmpty()) {
                System.out.println("ℹ️ [Qdrant Sync] Không có Job nào ở trạng thái 'Đang hiển thị'.");
                return;
            }

            for (Job job : activeJobs) {
                try {
                    String jobDescription = job.getJobDescription();
                    if (jobDescription != null && !jobDescription.trim().isEmpty()) {
                        List<Float> jdEmbeddingList = springAiService.getEmbeddingList(jobDescription);
                        if (jdEmbeddingList != null && !jdEmbeddingList.isEmpty()) {
                            Map<String, String> jobMeta = new HashMap<>();
                            jobMeta.put("title", job.getTitle() != null ? job.getTitle() : "");
                            jobMeta.put("description", jobDescription);
                            qdrantService.upsertJobVector(Long.valueOf(job.getJobId()), jdEmbeddingList, jobMeta);
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("⚠️ [Qdrant Sync] Lỗi index Job ID " + job.getJobId() + ": " + ex.getMessage());
                }
            }
            System.out.println("✅ [Qdrant Sync] Đồng bộ hoàn tất! Tổng số Job đã lưu: " + activeJobs.size());
        } catch (Exception e) {
            System.err.println("❌ [Qdrant Sync] Lỗi nghiêm trọng khi đồng bộ: " + e.getMessage());
        }
    }
}
