package com.khoaluan.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.ai.model.Media;
import org.springframework.http.MediaType;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.ArrayList;

@Service
public class SpringAiService {

    private final ChatClient flashClient;
    private final ChatClient proClient;

    public SpringAiService(@Qualifier("flashChatClient") ChatClient flashClient,
                           @Qualifier("proChatClient") ChatClient proClient) {
        this.flashClient = flashClient;
        this.proClient = proClient;
    }

    // =========================================================================
    // FEATURE 1: JD AI OPTIMIZATION (Flash)
    // =========================================================================
    public String optimizeJd(String draftDescription, String draftRequirements) {
        String promptText = "Bạn là chuyên gia tuyển dụng cấp cao. Hãy tối ưu hóa văn bản nháp sau thành Mô tả công việc và Yêu cầu ứng viên chuyên nghiệp, loại bỏ câu chữ lủng củng.\n\n"
                + "--- Bản nháp Mô tả công việc ---\n" + draftDescription + "\n\n"
                + "--- Bản nháp Yêu cầu ứng viên ---\n" + draftRequirements + "\n\n"
                + "Trả về CHỈ JSON định dạng:\n"
                + "{\n"
                + "  \"description\": \"(Mô tả công việc đã tối ưu, dùng gạch đầu dòng)\",\n"
                + "  \"requirements\": \"(Yêu cầu ứng viên đã tối ưu, dùng gạch đầu dòng)\"\n"
                + "}";

        return flashClient.prompt()
                .user(promptText)
                .call()
                .content().replace("```json", "").replace("```", "").trim();
    }

    // =========================================================================
    // FEATURE 2: CRITERIA MATRIX GENERATION (Flash)
    // =========================================================================
    public String generateCriteriaMatrix(String cvSummary, String jobDescription) {
        String promptText = "Dựa trên CV và Job Description sau, hãy sinh ra danh sách từ 3-5 tiêu chí đánh giá cốt lõi nhất để chấm điểm ứng viên này.\n\n"
                + "--- Job Description ---\n" + jobDescription + "\n\n"
                + "--- CV Summary ---\n" + cvSummary + "\n\n"
                + "Trả về CHỈ JSON mảng các tiêu chí:\n"
                + "[\n"
                + "  { \"name\": \"Tên tiêu chí 1\", \"score\": 0, \"weight\": 3 },\n"
                + "  { \"name\": \"Tên tiêu chí 2\", \"score\": 0, \"weight\": 4 }\n"
                + "]";

        return flashClient.prompt()
                .user(promptText)
                .call()
                .content().replace("```json", "").replace("```", "").trim();
    }

    // =========================================================================
    // FEATURE 3: AI AGENT PROPOSE SALARY & BONUS (Pro)
    // =========================================================================
    public String proposeSalaryAndBonus(String jobTitle, String jobDescription, String jobSalary, 
                                         String candidateInfo, String criteriaMatrix, String expectedSalaryInfo) {
        String promptText = "Bạn là AI Agent đề xuất chế độ đãi ngộ & offer tuyển dụng chuyên nghiệp.\n"
                + "Nhiệm vụ của bạn là dựa vào:\n"
                + "1. Thông tin Job (Vị trí, Mô tả chi tiết & Khoảng lương ngân sách của công ty)\n"
                + "2. Thông tin CV ứng viên (Tóm tắt hồ sơ)\n"
                + "3. Mức lương kỳ vọng ứng viên tự đề xuất (nếu có)\n"
                + "4. Bảng điểm đánh giá chi tiết của Hội đồng phỏng vấn (Criteria Matrix - các tiêu chí đã có điểm số cụ thể)\n\n"
                + "Hãy đề xuất:\n"
                + "- Level phù hợp nhất (Intern, Fresher, Junior, Middle, Senior, Principal, Lead...)\n"
                + "- Mức lương đề xuất (phải nằm trong khoảng ngân sách của công ty ở thông tin Job, được điều chỉnh linh hoạt dựa trên điểm số đánh giá tiêu chí của ứng viên và xem xét mức kỳ vọng của ứng viên)\n"
                + "- Loại hợp đồng (Thử việc 2 tháng, Chính thức, Cộng tác viên, Part-time...)\n"
                + "- Chế độ thưởng/Thưởng KPI/Đào tạo/Phúc lợi chi tiết\n"
                + "- Lập luận chi tiết (Reasoning) tại sao đề xuất đãi ngộ này (đánh giá điểm mạnh/yếu dựa theo bảng điểm phỏng vấn và khả năng đáp ứng mức lương kỳ vọng).\n\n"
                + "--- THÔNG TIN CÔNG VIỆC ---\n"
                + "Vị trí: " + jobTitle + "\n"
                + "Mô tả: " + jobDescription + "\n"
                + "Ngân sách lương công ty: " + jobSalary + "\n\n"
                + "--- THÔNG TIN ỨNG VIÊN ---\n" + candidateInfo + "\n\n"
                + "Mức lương ứng viên kỳ vọng: " + (expectedSalaryInfo != null && !expectedSalaryInfo.isEmpty() ? expectedSalaryInfo : "Chưa cập nhật") + "\n\n"
                + "--- BẢNG ĐÁNH GIÁ TIÊU CHÍ (CRITERIA MATRIX) ---\n" + criteriaMatrix + "\n\n"
                + "Trả về CHỈ một chuỗi JSON hợp lệ theo định dạng chính xác sau (Không có Markdown ```json):\n"
                + "{\n"
                + "  \"suggestedLevel\": \"(Cấp bậc đề xuất)\",\n"
                + "  \"suggestedSalary\": \"(Mức lương đề xuất cụ thể kèm VNĐ)\",\n"
                + "  \"contractType\": \"Loại hợp đồng: (loại HĐ)\",\n"
                + "  \"bonus\": \"Thưởng & Phúc lợi: (chế độ thưởng, phúc lợi)\",\n"
                + "  \"reasoning\": \"(Lập luận giải thích chi tiết)\"\n"
                + "}";

        return proClient.prompt()
                .user(promptText)
                .call()
                .content().replace("```json", "").replace("```", "").trim();
    }

    // =========================================================================
    // LEGACY METHODS REWRITTEN FOR COMPATIBILITY (Flash)
    // =========================================================================
    private String extractTextUsingPdfBox(byte[] fileBytes) {
        try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi trích xuất PDF bằng PDFBox: " + e.getMessage());
            return null;
        }
    }

    public String extractTextFromCvPdf(String fileUrl) throws Exception {
        Path path;
        if (fileUrl != null && fileUrl.startsWith("/uploads/")) {
            path = Paths.get("D:/DA_KHOALUAN/backend", fileUrl.substring(1));
        } else {
            String basePath = System.getProperty("user.dir");
            String relativeUrl = (fileUrl != null && fileUrl.startsWith("/")) ? fileUrl.substring(1) : fileUrl;
            path = Paths.get(basePath, relativeUrl);
            if (!Files.exists(path)) {
                path = Paths.get(basePath, "src/main/resources/static", relativeUrl);
            }
        }

        byte[] fileBytes = Files.readAllBytes(path);
        String contentType = Files.probeContentType(path);
        if (contentType == null) {
            contentType = fileUrl.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        }

        if ("application/pdf".equalsIgnoreCase(contentType) || fileUrl.toLowerCase().endsWith(".pdf")) {
            String pdfText = extractTextUsingPdfBox(fileBytes);
            if (pdfText != null && !pdfText.trim().isEmpty()) {
                return pdfText;
            }
        }

        final String finalContentType = contentType;
        return flashClient.prompt()
                .user(u -> u.text("Hãy trích xuất toàn bộ nội dung văn bản của CV này một cách đầy đủ và trung thực nhất.")
                        .media(new Media(MediaType.valueOf(finalContentType), fileBytes)))
                .call().content();
    }
    
    public String optimizeCv(MultipartFile file, String targetRole) throws Exception {
        byte[] fileBytes = file.getBytes();
        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = file.getOriginalFilename().toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";
        }

        String cvText = "";
        boolean isPdf = "application/pdf".equalsIgnoreCase(contentType) || file.getOriginalFilename().toLowerCase().endsWith(".pdf");
        
        if (isPdf) {
            cvText = extractTextUsingPdfBox(fileBytes);
        }

        final String finalCvText = cvText;
        final String finalContentType = contentType;

        String prompt = "Bạn là một Chuyên gia Nhân sự. Hãy phân tích CV của ứng viên cho vị trí ứng tuyển mục tiêu là: '" + targetRole + "'. \n"
                + (isPdf ? "\n--- NỘI DUNG CV ---\n" + finalCvText + "\n" : "")
                + "\nHãy đưa ra phân tích và đánh giá dưới dạng JSON với cấu trúc chính xác sau:\n"
                + "{\n"
                + "  \"target_role_match\": {\"is_relevant\": true, \"message\": \"(Đánh giá độ phù hợp của CV với vị trí mục tiêu)\"},\n"
                + "  \"pre_evaluation_score\": 80,\n"
                + "  \"optimization_details\": [{\"section\": \"(Tên phần trong CV)\", \"status\": \"(Lỗi/Cần cải thiện/Tốt)\", \"advice\": \"(Lời khuyên chi tiết)\"}],\n"
                + "  \"recommended_tools\": [{\"tool_name\": \"(Tên công cụ khuyến nghị)\", \"reason\": \"(Lý do sử dụng)\"}]\n"
                + "}";

        return flashClient.prompt()
                .user(u -> {
                    u.text(prompt);
                    if (!isPdf) {
                        u.media(new Media(MediaType.valueOf(finalContentType), fileBytes));
                    }
                })
                .call().content().replace("```json", "").replace("```", "").trim();
    }

    public String scanAndDecideAutonomous(String cvUrl, String jobDescription, double similarity,
            String jobSalary, String avgTeamSalary, String recruiterPrompt, String cvText) throws Exception {
        
        String prompt = "Bạn là AI Agent tuyển dụng thông minh.\n"
                + "Hãy phân tích nội dung CV của ứng viên so với Mô tả công việc (JD) tuyển dụng.\n\n"
                + "--- HƯỚNG DẪN TÍNH ĐIỂM ---\n"
                + "1. matchScore (Độ phù hợp - từ 0 đến 100):\n"
                + "   - Đánh giá xem kỹ năng, kinh nghiệm, học vấn của ứng viên có đáp ứng yêu cầu của JD không.\n"
                + "   - Nếu CV hoàn toàn không liên quan (ví dụ: tuyển kế toán nhưng CV làm Thiết kế đồ họa/Graphic Designer), matchScore BẮT BUỘC phải dưới 10%.\n"
                + "2. legitScore (Độ tin cậy / Tính thực tế của CV - từ 0 đến 100):\n"
                + "   - Đánh giá mức độ 'thật' của CV. Nếu CV là tài liệu rác (spam, lorem ipsum), giấy tờ không phải CV, hoặc thông tin quá sơ sài vô lý, legitScore BẮT BUỘC phải dưới 20%.\n"
                + "   - Đánh giá sự nhất quán về mặt thời gian (ví dụ: đi học và đi làm có bị trùng lặp vô lý không).\n"
                + "   - Kiểm tra xem CV có dấu hiệu nhồi nhét từ khóa (keyword stuffing) để đánh lừa bộ lọc ATS hay không.\n"
                + "   - LƯU Ý QUAN TRỌNG: Nếu CV hoàn toàn không liên quan đến vị trí (ví dụ: nộp CV IT cho job Kế toán, hoặc nộp sai tài liệu), thì đây bị coi là hành vi spam/ứng tuyển bừa bãi. Khi đó, legitScore TUYỆT ĐỐI không được vượt quá 30%.\n\n"
                + "📄 NỘI DUNG CV:\n" + (cvText != null ? cvText.substring(0, Math.min(cvText.length(), 3000)) : "") + "\n\n"
                + "📋 MÔ TẢ CÔNG VIỆC:\n" + jobDescription + "\n\n"
                + "💡 YÊU CẦU ĐẶC BIỆT CỦA NHÀ TUYỂN DỤNG:\n" + recruiterPrompt + "\n\n"
                + "Trả về CHỈ một chuỗi JSON hợp lệ theo định dạng chính xác sau (Không có Markdown ```json):\n"
                + "{\n"
                + "  \"matchScore\": (Điểm độ phù hợp thực tế, kiểu số nguyên từ 0 đến 100),\n"
                + "  \"legitScore\": (Điểm độ tin cậy/trung thực thực tế, kiểu số nguyên từ 0 đến 100),\n"
                + "  \"recommendation\": \"(hire hoặc reject hoặc consider)\",\n"
                + "  \"summary\": {\n"
                + "     \"skills\": [\"Kỹ năng 1\", \"Kỹ năng 2\"],\n"
                + "     \"education\": {\"school\": \"Tên trường\", \"major\": \"Chuyên ngành\"},\n"
                + "     \"workHistory\": [\"Tóm tắt kinh nghiệm 1\", \"Tóm tắt kinh nghiệm 2\"]\n"
                + "  },\n"
                + "  \"evidence\": [\n"
                + "     {\"type\": \"match|mismatch|risk\", \"detail\": \"(Chi tiết bằng chứng/rủi ro cụ thể phát hiện được)\"}\n"
                + "  ]\n"
                + "}";

        return flashClient.prompt().user(prompt).call().content().replace("```json", "").replace("```", "").trim();
    }
    
    // Fallback Mock cho Embedding vì Spring AI OpenAI dùng text-embedding-ada-002 kích thước 1536, 
    // trong khi hệ thống đang dùng Qdrant 768 chiều.
    public List<Float> getEmbeddingList(String text) {
        // Tạm thời trả về mảng rỗng để không lỗi Qdrant (vì Qdrant expect 768), 
        // hoặc tự sinh mảng 768 phần tử giả
        List<Float> list = new ArrayList<>();
        for (int i = 0; i < 768; i++) list.add(0.0f);
        return list;
    }
    
    public double calculateCosineSimilarity(String vectorAStr, String vectorBStr) {
        return 0.85; // Mock similarity for speed
    }
}
