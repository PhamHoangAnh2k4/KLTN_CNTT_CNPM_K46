package com.khoaluan.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.khoaluan.backend.dto.AiMatchingResponse;
import com.khoaluan.backend.entity.Job;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.model.Media;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class CvAnalyzerService {

    private final ObjectMapper objectMapper;
    private final ChatClient flashClient;

    public CvAnalyzerService(ObjectMapper objectMapper, @Qualifier("flashChatClient") ChatClient flashClient) {
        this.objectMapper = objectMapper;
        this.flashClient = flashClient;
    }

    public AiMatchingResponse analyzeAndMatchCv(MultipartFile file, List<Job> activeJobs) throws Exception {
        byte[] fileBytes = file.getBytes();
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = file.getOriginalFilename().toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        }
        final String finalContentType = contentType;

        // Chuyển danh sách Job thành chuỗi JSON gọn nhẹ để gửi cho AI
        List<Map<String, Object>> leanJobs = new ArrayList<>();
        for (Job job : activeJobs) {
            Map<String, Object> j = new HashMap<>();
            j.put("jobId", job.getJobId());
            j.put("title", job.getTitle());
            j.put("skills", job.getSkills());
            j.put("description", job.getJobDescription());
            j.put("salary", job.getSalary());
            leanJobs.add(j);
        }
        String jobsJson = objectMapper.writeValueAsString(leanJobs);

        String prompt = "Bạn là chuyên gia tuyển dụng AI. Hãy phân tích CV (hình ảnh/pdf đính kèm) và đối chiếu với danh sách công việc sau:\n" 
                + jobsJson + "\n\n"
                + "Yêu cầu:\n" 
                + "1. Trích xuất 3-5 kỹ năng thực tế từ CV (điền vào danh sách aiKeywords).\n" 
                + "2. So sánh CV với từng Job, tính % phù hợp (matchPercent) từ 0 đến 100 dựa trên kỹ năng và mô tả công việc.\n" 
                + "3. Trả về CHỈ chuỗi JSON hợp lệ theo định dạng chính xác sau (Không có Markdown ```json):\n"
                + "{\n"
                + "  \"aiKeywords\": [\"Kỹ năng 1\", \"Kỹ năng 2\"],\n"
                + "  \"matchedJobs\": [\n"
                + "    {\n"
                + "      \"id\": 1,\n"
                + "      \"title\": \"Tên Job\",\n"
                + "      \"company\": \"CÔNG TY ĐỐI TÁC\",\n"
                + "      \"matchPercent\": 85,\n"
                + "      \"aiExplanation\": \"Lý do phù hợp\",\n"
                + "      \"salary\": \"Lương\"\n"
                + "    }\n"
                + "  ]\n"
                + "}";

        try {
            String jsonResult = flashClient.prompt()
                    .user(u -> u.text(prompt)
                            .media(new Media(MediaType.valueOf(finalContentType), fileBytes)))
                    .call()
                    .content().replace("```json", "").replace("```", "").trim();

            return objectMapper.readValue(jsonResult, AiMatchingResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi phân tích AI: " + e.getMessage());
        }
    }
}