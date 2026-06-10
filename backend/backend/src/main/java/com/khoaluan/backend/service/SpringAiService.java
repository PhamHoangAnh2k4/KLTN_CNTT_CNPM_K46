package com.khoaluan.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.ai.model.Media;
import org.springframework.http.MediaType;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

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
    private final OpenAiEmbeddingModel embeddingModel;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SpringAiService(@Qualifier("flashChatClient") ChatClient flashClient,
                           @Qualifier("proChatClient") ChatClient proClient,
                           OpenAiEmbeddingModel embeddingModel) {
        this.flashClient = flashClient;
        this.proClient = proClient;
        this.embeddingModel = embeddingModel;
    }

    // =========================================================================
    // FEATURE 1: JD AI OPTIMIZATION (Flash)
    // =========================================================================
    public String optimizeJd(String jobTitle, String draftDescription, String draftRequirements) {
        String promptText = "Bạn là chuyên gia tuyển dụng cấp cao (Senior Recruiter/HR Specialist).\n"
                + "Nhiệm vụ của bạn là tối ưu hóa bản nháp Mô tả công việc (JD) và Yêu cầu ứng viên cho vị trí: \"" + jobTitle + "\".\n\n"
                + "--- YÊU CẦU QUAN TRỌNG ---\n"
                + "1. Bản JD tối ưu phải tuyệt đối dựa trên tên công việc \"" + jobTitle + "\".\n"
                + "2. Nếu nội dung nháp do người dùng nhập quá ngắn, sơ sài hoặc vô nghĩa (ví dụ: \"ád\", \"abc\", \"test\"...), bạn phải tự động bổ sung và sinh ra nội dung Mô tả công việc và Yêu cầu ứng viên chuẩn mực, chuyên nghiệp và đầy đủ cho vị trí \"" + jobTitle + "\" này.\n"
                + "3. Định dạng đầu ra của cả 2 trường \"description\" và \"requirements\" bắt buộc phải được trình bày rõ ràng dưới dạng danh sách gạch đầu dòng (sử dụng dấu gạch đầu dòng '-'), mỗi ý bắt đầu ở một dòng mới bằng ký tự xuống dòng '\\n', tuyệt đối KHÔNG phân tách hoặc nối các ý gạch đầu dòng bằng dấu phẩy ',' hay viết thành đoạn văn dài lê thê.\n"
                + "4. Mỗi phần tối ưu cần ngắn gọn, đi thẳng vào vấn đề, đúng định dạng chuyên nghiệp của tin tuyển dụng.\n\n"
                + "--- Bản nháp Mô tả công việc hiện tại ---\n" + draftDescription + "\n\n"
                + "--- Bản nháp Yêu cầu ứng viên hiện tại ---\n" + draftRequirements + "\n\n"
                + "Trả về duy nhất JSON định dạng sau (không chứa ký tự markdown hay văn bản ngoài JSON):\n"
                + "{\n"
                + "  \"description\": \"(Mô tả công việc đã tối ưu, dùng gạch đầu dòng - )\",\n"
                + "  \"requirements\": \"(Yêu cầu ứng viên đã tối ưu, dùng gạch đầu dòng - )\"\n"
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
    public String extractTextUsingPdfBox(byte[] fileBytes) {
        try (org.apache.pdfbox.pdmodel.PDDocument document = org.apache.pdfbox.Loader.loadPDF(fileBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            return stripper.getText(document);
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi trích xuất PDF bằng PDFBox: " + e.getMessage());
            return null;
        }
    }

    public String extractTextFromCvPdf(byte[] fileBytes, String contentType, String originalFilename) throws Exception {
        if ("application/pdf".equalsIgnoreCase(contentType) || (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf"))) {
            String pdfText = extractTextUsingPdfBox(fileBytes);
            if (pdfText != null && !pdfText.trim().isEmpty()) {
                return pdfText;
            }
        }

        final String finalContentType = contentType != null ? contentType : "image/jpeg";
        return flashClient.prompt()
                .user(u -> u.text("Hãy trích xuất toàn bộ nội dung văn bản của CV này một cách đầy đủ và trung thực nhất.")
                        .media(new Media(MediaType.valueOf(finalContentType), fileBytes)))
                .call().content();
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

        return extractTextFromCvPdf(fileBytes, contentType, fileUrl);
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

        String prompt = "Bạn là một Chuyên gia Nhân sự. Hãy phân tích tài liệu/CV của ứng viên cho vị trí ứng tuyển mục tiêu là: '" + targetRole + "'. \n"
                + "NHIỆM VỤ QUAN TRỌNG NHẤT: Trước tiên hãy xác định xem tài liệu được tải lên có thực sự là một Bản tóm tắt lý lịch/CV/Resume hợp lệ của một cá nhân hay không.\n"
                + "- Một CV/Resume hợp lệ PHẢI chứa thông tin giới thiệu cá nhân, kỹ năng, kinh nghiệm làm việc hoặc học vấn.\n"
                + "- Các tài liệu dạng đề thi, câu hỏi trắc nghiệm, checklist bài học, tài liệu lập trình, giáo trình, bài báo, danh sách câu hỏi ôn tập (như Front-End Essentials Checklist...) TUYỆT ĐỐI KHÔNG phải là CV ứng viên.\n\n"
                + "Hãy trả về một chuỗi JSON hợp lệ theo định dạng chính xác sau (Không có Markdown ```json):\n"
                + "{\n"
                + "  \"is_valid_cv\": (true nếu là CV/Resume hợp lệ, false nếu là tài liệu dạng khác),\n"
                + "  \"invalid_reason\": \"(Điền lý do cụ thể tại sao tài liệu này không phải là CV, ví dụ: 'Tài liệu là một danh sách câu hỏi ôn tập / checklist Front-End, không phải CV giới thiệu bản thân của ứng viên.')\",\n"
                + "  \"target_role_match\": {\"is_relevant\": (true/false), \"message\": \"(Đánh giá độ phù hợp của CV với vị trí mục tiêu)\"},\n"
                + "  \"pre_evaluation_score\": (Điểm đánh giá từ 0 đến 100. Nếu is_valid_cv = false, điểm BẮT BUỘC phải là 0),\n"
                + "  \"optimization_details\": [{\"section\": \"(Tên phần cần sửa đổi)\", \"status\": \"(Lỗi/Cần cải thiện/Tốt)\", \"advice\": \"(Lời khuyên chi tiết)\"}],\n"
                + "  \"recommended_tools\": [{\"tool_name\": \"(Tên công cụ khuyến nghị)\", \"reason\": \"(Lý do sử dụng)\"}]\n"
                + "}\n\n"
                + (isPdf ? "\n--- NỘI DUNG TÀI LIỆU ---\n" + finalCvText + "\n" : "");

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
                + "     \"education\": {\"school\": \"Tên trường\", \"major\": \"Chuyên ngành\", \"gpa\": \"GPA nếu có\"},\n"
                + "     \"workHistory\": [\n"
                + "        { \"role\": \"Chức danh/Vị trí\", \"company\": \"Tên công ty\", \"duration\": \"Thời gian (ví dụ: 10/2022 - Hiện tại)\", \"description\": \"Mô tả ngắn gọn công việc và thành tựu\" }\n"
                + "     ]\n"
                + "  },\n"
                + "  \"evidence\": [\n"
                + "     {\"type\": \"match|mismatch|risk\", \"detail\": \"(Chi tiết bằng chứng/lý do cụ thể giải thích tại sao điểm số cao hoặc thấp. Phải nêu rõ lý do bị thấp nếu điểm thấp)\"}\n"
                + "  ]\n"
                + "}";

        return flashClient.prompt().user(prompt).call().content().replace("```json", "").replace("```", "").trim();
    }
    
    public List<Float> getEmbeddingList(String text) {
        try {
            if (text == null || text.trim().isEmpty()) {
                List<Float> list = new ArrayList<>();
                for (int i = 0; i < 768; i++) list.add(0.0f);
                return list;
            }

            String requestBody = "{"
                    + "\"content\": {"
                    + "  \"parts\": ["
                    + "    { \"text\": " + objectMapper.writeValueAsString(text) + " }"
                    + "  ]"
                    + "},"
                    + "\"outputDimensionality\": 768"
                    + "}";

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=" + geminiApiKey;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode valuesNode = root.path("embedding").path("values");
                if (valuesNode.isArray()) {
                    List<Float> floatEmbed = new ArrayList<>(valuesNode.size());
                    for (JsonNode val : valuesNode) {
                        floatEmbed.add((float) val.asDouble());
                    }
                    return floatEmbed;
                }
            } else {
                System.err.println("⚠️ Lỗi HTTP khi gọi API Gemini Embedding: " + response.statusCode() + " - " + response.body());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi sinh embedding thực tế: " + e.getMessage());
        }

        List<Float> list = new ArrayList<>();
        for (int i = 0; i < 768; i++) list.add(0.0f);
        return list;
    }
    
    public double calculateCosineSimilarity(String vectorAStr, String vectorBStr) {
        try {
            if (vectorAStr == null || vectorBStr == null || vectorAStr.isEmpty() || vectorBStr.isEmpty()) {
                return 0.0;
            }
            String cleanA = vectorAStr.replace("[", "").replace("]", "").trim();
            String cleanB = vectorBStr.replace("[", "").replace("]", "").trim();
            
            if (cleanA.isEmpty() || cleanB.isEmpty()) {
                return 0.0;
            }

            String[] partsA = cleanA.split(",");
            String[] partsB = cleanB.split(",");

            int minLength = Math.min(partsA.length, partsB.length);
            if (minLength == 0) return 0.0;

            double dotProduct = 0.0;
            double normA = 0.0;
            double normB = 0.0;

            for (int i = 0; i < minLength; i++) {
                double valA = Double.parseDouble(partsA[i].trim());
                double valB = Double.parseDouble(partsB[i].trim());
                dotProduct += valA * valB;
                normA += valA * valA;
                normB += valB * valB;
            }

            if (normA == 0.0 || normB == 0.0) {
                return 0.0;
            }

            return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi tính Cosine Similarity: " + e.getMessage());
            return 0.0;
        }
    }

    public String refineText(String originalText) {
        String promptText = "Bạn là một trợ lý tuyển dụng chuyên nghiệp. Hãy sửa lỗi chính tả, lỗi logic và tối ưu hóa cách diễn đạt cho nhận xét/thư tuyển dụng dưới đây để trở nên lịch sự, chuyên nghiệp, súc tích và mạch lạc hơn.\n\n"
                + "--- NỘI DUNG GỐC ---\n"
                + originalText + "\n\n"
                + "Trả về CHỈ một chuỗi JSON hợp lệ theo định dạng chính xác sau (Không có Markdown ```json):\n"
                + "{\n"
                + "  \"refinedText\": \"(Nội dung đã được tối ưu hóa hoàn chỉnh, giữ nguyên ý nghĩa chính)\",\n"
                + "  \"improvements\": [\n"
                + "     \"Sửa lỗi chính tả (nếu có)\",\n"
                + "     \"Cải thiện cách diễn đạt lịch thiệp hơn\",\n"
                + "     \"Mạch lạc và rõ ràng hơn\"\n"
                + "  ]\n"
                + "}";

        try {
            return flashClient.prompt()
                    .user(promptText)
                    .call()
                    .content().replace("```json", "").replace("```", "").trim();
        } catch (Exception e) {
            System.err.println("Gemini API error during refineText: " + e.getMessage());
            String escapedText = originalText != null 
                ? originalText.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "")
                : "";
            return "{\n"
                    + "  \"refinedText\": \"" + escapedText + "\",\n"
                    + "  \"improvements\": [\n"
                    + "     \"Không thể kết nối với AI để đề xuất cải tiến lúc này: " + (e.getMessage() != null ? e.getMessage().replace("\"", "'").replace("\n", " ") : "Lỗi không xác định") + "\",\n"
                    + "     \"Vui lòng kiểm tra lại API Key hoặc hạn ngạch tài khoản của bạn.\"\n"
                    + "  ]\n"
                    + "}";
        }
    }
}
