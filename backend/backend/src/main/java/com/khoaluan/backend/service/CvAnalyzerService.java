package com.khoaluan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.khoaluan.backend.dto.AiMatchingResponse;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.EmployerProfile;
import com.khoaluan.backend.repository.EmployerProfileRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class CvAnalyzerService {

    private final ObjectMapper objectMapper;
    private final ChatClient flashClient;
    private final SpringAiService springAiService;
    private final QdrantService qdrantService;
    private final EmployerProfileRepository employerProfileRepository;

    public CvAnalyzerService(ObjectMapper objectMapper, 
                             @Qualifier("flashChatClient") ChatClient flashClient,
                             SpringAiService springAiService,
                             QdrantService qdrantService,
                             EmployerProfileRepository employerProfileRepository) {
        this.objectMapper = objectMapper;
        this.flashClient = flashClient;
        this.springAiService = springAiService;
        this.qdrantService = qdrantService;
        this.employerProfileRepository = employerProfileRepository;
    }

    public AiMatchingResponse analyzeAndMatchCv(MultipartFile file, List<Job> activeJobs) throws Exception {
        byte[] fileBytes = file.getBytes();
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = file.getOriginalFilename().toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        }
        
        // 1. Trích xuất text CV bằng Gemini
        String cvText = springAiService.extractTextFromCvPdf(fileBytes, contentType, file.getOriginalFilename());
        
        // 2. Trích xuất keywords (kỹ năng) từ CV dùng Gemini
        List<String> keywords = new ArrayList<>();
        try {
            String extractPrompt = "Bạn là chuyên gia nhân sự. Hãy phân tích nội dung CV sau và trích xuất ra danh sách từ 3 đến 5 kỹ năng chuyên môn cốt lõi của ứng viên dưới dạng JSON array: [\"Kỹ năng 1\", \"Kỹ năng 2\", ...]. Tuyệt đối không trả về gì khác ngoài JSON array.\n\nCV:\n" + cvText;
            String keywordsJson = flashClient.prompt().user(extractPrompt).call().content().replace("```json", "").replace("```", "").trim();
            if (keywordsJson.startsWith("[") && keywordsJson.endsWith("]")) {
                keywords = objectMapper.readValue(keywordsJson, List.class);
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi trích xuất keywords: " + e.getMessage());
            keywords = List.of("Phân tích CV", "Công nghệ");
        }

        // 3. Tạo embedding thực của CV
        List<Float> cvEmbedding = springAiService.getEmbeddingList(cvText);

        // 4. Tìm kiếm các job phù hợp nhất từ Qdrant
        List<io.qdrant.client.grpc.Points.ScoredPoint> scoredJobs = new ArrayList<>();
        try {
            scoredJobs = qdrantService.searchSimilarJobs(cvEmbedding, 15);
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi tìm kiếm Qdrant: " + e.getMessage());
        }

        // Map danh sách activeJobs theo ID để tra cứu nhanh thông tin chi tiết
        Map<Long, Job> jobMap = new HashMap<>();
        for (Job job : activeJobs) {
            jobMap.put(Long.valueOf(job.getJobId()), job);
        }

        List<AiMatchingResponse.MatchedJob> matchedJobs = new ArrayList<>();
        
        // Duyệt qua kết quả tìm kiếm của Qdrant
        for (io.qdrant.client.grpc.Points.ScoredPoint sp : scoredJobs) {
            Long jobId = sp.getId().getNum();
            Job job = jobMap.get(jobId);
            if (job != null) {
                int matchPercent = (int) Math.round(Math.max(0, sp.getScore()) * 100);
                
                // Tạo giải thích ngắn gọn dựa trên kỹ năng của job và CV
                String aiExplanation = "Độ tương hợp vector đạt " + matchPercent + "% dựa trên từ khóa kỹ năng và mô tả công việc.";
                
                String companyName = employerProfileRepository.findByUserId(job.getEmployerId())
                        .map(EmployerProfile::getCompanyName)
                        .orElse("Công ty tuyển dụng");

                AiMatchingResponse.MatchedJob mj = new AiMatchingResponse.MatchedJob();
                mj.setId(jobId);
                mj.setTitle(job.getTitle());
                mj.setCompany(companyName);
                mj.setMatchPercent(matchPercent);
                mj.setAiExplanation(aiExplanation);
                mj.setSalary(job.getSalary() != null ? job.getSalary() : "Thỏa thuận");
                
                matchedJobs.add(mj);
            }
        }

        // Fallback: nếu Qdrant không trả về kết quả nào (ví dụ chưa lưu vector Job), sử dụng đối chiếu logic cũ hoặc map toàn bộ activeJobs với điểm 0
        if (matchedJobs.isEmpty()) {
            for (Job job : activeJobs) {
                String companyName = employerProfileRepository.findByUserId(job.getEmployerId())
                        .map(EmployerProfile::getCompanyName)
                        .orElse("Công ty tuyển dụng");

                AiMatchingResponse.MatchedJob mj = new AiMatchingResponse.MatchedJob();
                mj.setId(Long.valueOf(job.getJobId()));
                mj.setTitle(job.getTitle());
                mj.setCompany(companyName);
                mj.setMatchPercent(0);
                mj.setAiExplanation("Chưa cập nhật vector chỉ mục trong Qdrant.");
                mj.setSalary(job.getSalary() != null ? job.getSalary() : "Thỏa thuận");
                matchedJobs.add(mj);
            }
        }

        // Sắp xếp giảm dần theo điểm số
        matchedJobs.sort((a, b) -> Integer.compare(b.getMatchPercent(), a.getMatchPercent()));

        AiMatchingResponse response = new AiMatchingResponse();
        response.setAiKeywords(keywords);
        response.setMatchedJobs(matchedJobs);
        return response;
    }
}