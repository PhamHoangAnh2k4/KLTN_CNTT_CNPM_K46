package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "http://localhost:3000")
public class EmailController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/send-result")
    @LogActivity(actionType = "GỬI EMAIL", description = "Đã gửi thông báo kết quả ứng tuyển cho ứng viên")
    public ResponseEntity<?> sendCandidateResult(@RequestBody Map<String, String> payload) {
        try {
            // 1. Kiểm tra các trường bắt buộc chung
            String candidateEmail = payload.get("candidateEmail");
            String candidateName = payload.get("candidateName");
            String type = payload.get("type"); // 'interview' hoặc 'reject'

            if (candidateEmail == null || candidateName == null || type == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Thiếu thông tin bắt buộc: email, name hoặc type"));
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(candidateEmail);

            String htmlContent = "";

            // 2. Xử lý logic theo từng loại thư
            if ("interview".equals(type)) {
                String datetime = payload.getOrDefault("datetime", "Chưa xác định");
                String locationOrLink = payload.getOrDefault("locationOrLink", "Sẽ thông báo sau");
                boolean isOnline = locationOrLink.toLowerCase().startsWith("http") || locationOrLink.toLowerCase().contains("meet") || locationOrLink.toLowerCase().contains("zoom");

                helper.setSubject("JOBAI ATS - THƯ MỜI THAM GIA PHỎNG VẤN CHUYÊN MÔN");
                htmlContent = "<div style='font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.8; max-width: 650px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);'>"
                        + "<div style='text-align: center; margin-bottom: 30px;'>"
                        + "  <h1 style='color: #2563eb; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;'>JobAI ATS System</h1>"
                        + "  <p style='color: #64748b; font-size: 14px; margin: 5px 0 0 0;'>Hệ thống Tuyển dụng thông minh & Tự động</p>"
                        + "</div>"
                        + "<hr style='border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 30px;' />"
                        + "<p>Kính gửi bạn <strong>" + candidateName + "</strong>,</p>"
                        + "<p>Lời đầu tiên, Ban Nhân sự và Hội đồng Tuyển dụng của <strong>JobAI</strong> xin gửi lời chào trân trọng nhất và chân thành cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vào vị trí công việc của chúng tôi.</p>"
                        + "<p>Sau khi tiến hành xem xét và đánh giá hồ sơ ứng tuyển (CV) của bạn, chúng tôi nhận thấy nền tảng kỹ năng chuyên môn cũng như các kinh nghiệm thực tế của bạn rất tiềm năng và phù hợp với tiêu chí tuyển dụng. Do đó, chúng tôi trân trọng kính mời bạn tham dự buổi phỏng vấn chuyên môn để cùng trao đổi chi tiết hơn.</p>"
                        + "<p>Dưới đây là thông tin chi tiết về lịch hẹn phỏng vấn đã được thiết lập:</p>"
                        + "<div style='background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 24px; margin: 25px 0;'>"
                        + "  <table style='width: 100%; border-collapse: collapse;'>"
                        + "    <tr>"
                        + "      <td style='width: 120px; font-weight: bold; color: #475569; padding: 6px 0; vertical-align: top;'>⏰ Thời gian:</td>"
                        + "      <td style='color: #0f172a; padding: 6px 0; font-weight: 600;'>" + datetime + "</td>"
                        + "    </tr>"
                        + "    <tr>"
                        + "      <td style='font-weight: bold; color: #475569; padding: 6px 0; vertical-align: top;'>🎯 Hình thức:</td>"
                        + "      <td style='color: #0f172a; padding: 6px 0; font-weight: 600;'>" + (isOnline ? "Phỏng vấn Trực tuyến (Online Interview)" : "Phỏng vấn Trực tiếp (Offline Interview)") + "</td>"
                        + "    </tr>"
                        + "    <tr>"
                        + "      <td style='font-weight: bold; color: #475569; padding: 6px 0; vertical-align: top;'>" + (isOnline ? "🔗 Link họp:" : "📍 Địa điểm:") + "</td>"
                        + "      <td style='color: #2563eb; padding: 6px 0; font-weight: 600;'>"
                        + "        " + (isOnline ? "<a href='" + locationOrLink + "' style='color: #2563eb; text-decoration: underline;'>" + locationOrLink + "</a>" : locationOrLink)
                        + "      </td>"
                        + "    </tr>"
                        + "  </table>"
                        + "</div>";

                if (isOnline) {
                    htmlContent += "<div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 25px; color: #1e40af; font-size: 13px;'>"
                            + "  <strong>💡 Hướng dẫn phỏng vấn Online:</strong>"
                            + "  <ul style='margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;'>"
                            + "    <li>Vui lòng truy cập đường link phỏng vấn trước từ 5 đến 10 phút để kiểm tra kết nối mạng, micro và camera của bạn.</li>"
                            + "    <li>Chọn không gian yên tĩnh, đủ ánh sáng để buổi họp diễn ra suôn sẻ nhất.</li>"
                            + "    <li>Chuẩn bị sẵn các tài liệu liên quan hoặc Portfolio cá nhân nếu cần chia sẻ màn hình.</li>"
                            + "  </ul>"
                            + "</div>";
                } else {
                    htmlContent += "<div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 25px; color: #166534; font-size: 13px;'>"
                            + "  <strong>🏢 Hướng dẫn khi phỏng vấn Trực tiếp:</strong>"
                            + "  <ul style='margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;'>"
                            + "    <li>Vui lòng có mặt tại địa điểm trước giờ hẹn phỏng vấn từ 10 - 15 phút để làm thủ tục check-in tại quầy lễ tân.</li>"
                            + "    <li>Mang theo bản CV in sẵn (nếu có) hoặc các tài liệu Portfolio chứng minh năng lực.</li>"
                            + "    <li>Trường hợp cần chuẩn bị slide trình chiếu, vui lòng thông báo trước để bộ phận IT hỗ trợ chuẩn bị thiết bị.</li>"
                            + "  </ul>"
                            + "</div>";
                }

                htmlContent += "<p>Bạn vui lòng phản hồi lại email này để xác nhận sự tham gia của mình. Nếu có bất kỳ thay đổi nào về thời gian hoặc hình thức, hãy thông báo sớm nhất để chúng tôi hỗ trợ kịp thời.</p>"
                        + "<p>Chúng tôi rất mong chờ được gặp và trao đổi trực tiếp cùng bạn trong buổi phỏng vấn sắp tới.</p>"
                        + "<p>Chúc bạn chuẩn bị thật tốt và gặt hái kết quả như kỳ vọng!</p>"
                        + "<p style='margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 13px; color: #64748b;'>"
                        + "  Trân trọng,<br />"
                        + "  <strong>Ban Tuyển Dụng JobAI</strong><br />"
                        + "  Hotline: 028.1234.5678 | Email: hr@jobai.vn"
                        + "</p>"
                        + "</div>";
            } else if ("reject".equals(type)) {
                String rejectReason = payload.getOrDefault("rejectReason",
                        "Hồ sơ chưa phù hợp với yêu cầu hiện tại của vị trí.");

                helper.setSubject("JOBAI - THÔNG BÁO KẾT QUẢ ỨNG TUYỂN");
                htmlContent = "<div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;'>"
                        +
                        "<h2 style='color: #2563eb; text-align: center;'>JobAI.</h2>" +
                        "<p>Chào bạn <strong>" + candidateName + "</strong>,</p>" +
                        "<p>Cảm ơn bạn đã ứng tuyển vào JobAI.</p>" +
                        "<p>Rất tiếc, chúng tôi nhận thấy các tiêu chí của bạn chưa hoàn toàn phù hợp lúc này. Lý do:</p>"
                        +
                        "<div style='background: #fff1f2; padding: 15px; border-left: 4px solid #e11d48; border-radius: 5px; margin: 20px 0; color: #be123c; font-style: italic;'>"
                        +
                        "\"" + rejectReason + "\"" +
                        "</div>" +
                        "<p>Chúc bạn thành công trên con đường sự nghiệp!</p>" +
                        "<p style='font-size: 12px; color: #64748b;'>Ban Tuyển Dụng JobAI</p></div>";
            } else if ("offer".equals(type)) {
                String startDate = payload.getOrDefault("startDate", "Sẽ thông báo sau");
                String workAddress = payload.getOrDefault("workAddress", "Sẽ thông báo sau");
                String salary = payload.getOrDefault("salary", "Theo thỏa thuận");
                String level = payload.getOrDefault("level", "Nhân viên");

                helper.setSubject("JOBAI - THƯ CHÚC MỪNG TRÚNG TUYỂN & MỜI NHẬN VIỆC");
                htmlContent = "<div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px;'>"
                        +
                        "<h2 style='color: #059669; text-align: center;'>JobAI.</h2>" +
                        "<p>Chào bạn <strong>" + candidateName + "</strong>,</p>" +
                        "<p>Chúng tôi rất vui mừng thông báo bạn đã <strong>TRÚNG TUYỂN</strong> sau vòng phỏng vấn vừa qua.</p>"
                        +
                        "<p>Dưới đây là chi tiết về Offer (Thư mời nhận việc) của bạn:</p>" +
                        "<div style='background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; border-radius: 5px; margin: 20px 0;'>"
                        +
                        "<p style='margin: 5px 0;'><strong>🏢 Vị trí / Cấp bậc:</strong> " + level + "</p>" +
                        "<p style='margin: 5px 0;'><strong>💰 Mức lương đề xuất:</strong> " + salary + "</p>" +
                        "<p style='margin: 5px 0;'><strong>⏰ Ngày bắt đầu làm việc:</strong> " + startDate + "</p>" +
                        "<p style='margin: 5px 0;'><strong>📍 Địa điểm làm việc:</strong> " + workAddress + "</p>" +
                        "</div>" +
                        "<p>Bạn vui lòng xem xét và phản hồi lại email này để xác nhận nhận việc. Chúng tôi có đính kèm theo thư này một bản <strong>Mẫu Hợp Đồng Lao Động</strong> để bạn tham khảo trước.</p>" +
                        "<p style='font-size: 12px; color: #64748b;'>Phòng Nhân Sự JobAI</p></div>";
                
                // Đính kèm bản mẫu Hợp đồng lao động (Dữ liệu dummy)
                helper.addAttachment("Hop_dong_lao_dong_mau.pdf", new org.springframework.core.io.ByteArrayResource(
                    "%PDF-1.4\n1 0 obj\n<<\n/Title (Hop Dong Mau)\n/Creator (JobAI)\n>>\nendobj\n".getBytes()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Loại email (type) không hợp lệ"));
            }

            // Chèn custom note (nếu có)
            String customNote = payload.getOrDefault("customNote", "");
            if (!customNote.isEmpty()) {
                htmlContent += "<div style='margin-top: 15px; padding: 10px; border-left: 3px solid #f59e0b; background: #fffbeb; color: #b45309; font-style: italic;'><strong>Ghi chú từ NTD:</strong> " + customNote + "</div>";
            }

            helper.setText(htmlContent, true);
            mailSender.send(message);

            return ResponseEntity.ok(Map.of("message", "Đã gửi email thành công!"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
}