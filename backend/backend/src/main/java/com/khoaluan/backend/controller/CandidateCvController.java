package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity; // Import Annotation
import com.khoaluan.backend.dto.AiMatchingResponse;
import com.khoaluan.backend.entity.CandidateCv;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.CandidateCvRepository;
import com.khoaluan.backend.repository.JobRepository;
import com.khoaluan.backend.repository.UserRepository;
import com.khoaluan.backend.service.CvAnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.khoaluan.backend.util.FileHelper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidate-cvs")
@CrossOrigin(origins = "http://localhost:3000")
public class CandidateCvController {

    @Autowired
    private CandidateCvRepository cvRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CvAnalyzerService cvAnalyzerService; 

    @GetMapping("/{userId}")
    public ResponseEntity<?> getAllCvs(@PathVariable Integer userId) {
        return ResponseEntity.ok(cvRepository.findByUser_UserIdOrderByUploadedAtDesc(userId));
    }

    @PostMapping("/{userId}/upload")
    @LogActivity(actionType = "TẢI CV & PHÂN TÍCH AI", description = "Ứng viên đã tải CV lên để AI phân tích và gợi ý việc làm phù hợp")
    public ResponseEntity<?> uploadCv(@PathVariable Integer userId, @RequestParam("file") MultipartFile file) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 1. Lưu file vật lý
            String urlDir = "uploads/cvs/";
            String physicalDir = "D:/DA_KHOALUAN/backend/uploads/cvs/";
            Files.createDirectories(Paths.get(physicalDir));
            
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "cv.pdf";
            String sanitizedName = FileHelper.sanitizeFilename(originalName);
            String uniqueName = "cv_" + System.currentTimeMillis() + "_" + sanitizedName;
            
            Path filePath = Paths.get(physicalDir).resolve(uniqueName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 2. Lưu Database
            CandidateCv candidateCv = new CandidateCv();
            candidateCv.setUser(user);
            candidateCv.setOriginalName(originalName);
            candidateCv.setCvFile("/" + urlDir + uniqueName);
            candidateCv.setFileType(file.getContentType());
            cvRepository.saveAndFlush(candidateCv);

            // 3. Lấy danh sách Job đang hiển thị để AI đối chiếu
            List<Job> activeJobs = jobRepository.findAll().stream()
                    .filter(j -> "Đang hiển thị".equalsIgnoreCase(j.getStatus()))
                    .collect(Collectors.toList());

            // 4. GỌI AI PHÂN TÍCH VÀ CHẤM ĐIỂM THẬT
            AiMatchingResponse aiResponse = cvAnalyzerService.analyzeAndMatchCv(file, activeJobs);

            // 5. Trả kết quả về Frontend
            Map<String, Object> response = new HashMap<>();
            response.put("aiKeywords", aiResponse.getAiKeywords());
            response.put("matchedJobs", aiResponse.getMatchedJobs());
            response.put("cv", candidateCv);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    @DeleteMapping("/{cvId}")
    @LogActivity(actionType = "XÓA CV", description = "Ứng viên đã xóa một bản CV trong danh sách quản lý")
    public ResponseEntity<?> deleteCv(@PathVariable Long cvId) {
        try {
            cvRepository.findById(cvId).ifPresent(cv -> {
                try {
                    String path = cv.getCvFile().substring(1); 
                    Files.deleteIfExists(Paths.get("D:/DA_KHOALUAN/backend/" + path));
                    cvRepository.delete(cv);
                } catch (Exception ignored) {}
            });
            return ResponseEntity.ok("Đã xóa CV!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}