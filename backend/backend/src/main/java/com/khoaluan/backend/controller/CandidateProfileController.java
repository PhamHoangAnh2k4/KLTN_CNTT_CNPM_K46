package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity; // Import Annotation
import com.khoaluan.backend.entity.CandidateProfile;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.CandidateProfileRepository;
import com.khoaluan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/candidate-profiles")
@CrossOrigin(origins = "http://localhost:3000")
public class CandidateProfileController {

    @Autowired
    private CandidateProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    // --- LẤY THÔNG TIN HỒ SƠ ---
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Integer userId) {
        CandidateProfile profile = profileRepository.findByUser_UserId(userId).orElse(null);
        
        Map<String, Object> response = new HashMap<>();
        if (profile != null) {
            response.put("profileId", profile.getProfileId());
            response.put("jobTitle", profile.getJobTitle());
            response.put("phoneNumber", profile.getPhoneNumber());
            response.put("avatar", profile.getAvatar());
            response.put("cvFile", profile.getCvFile());
            response.put("fullName", profile.getUser().getFullName());
            response.put("email", profile.getUser().getEmail());
        }
        return ResponseEntity.ok(response);
    }

    // --- CẬP NHẬT HỒ SƠ & UPLOAD FILE ---
    @PostMapping("/{userId}")
    @LogActivity(actionType = "CẬP NHẬT HỒ SƠ", description = "Ứng viên đã cập nhật thông tin cá nhân và hồ sơ ứng tuyển")
    public ResponseEntity<?> updateProfile(
            @PathVariable Integer userId, // Aspect sẽ lấy được ID từ đây
            @RequestParam(value = "avatarFile", required = false) MultipartFile avatarFile,
            @RequestParam(value = "cvFile", required = false) MultipartFile cvFile,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "jobTitle", required = false) String jobTitle,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber) {
    
        try {
            // 1. Kiểm tra User
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    
            if (!"ung_vien".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body("Từ chối: Không phải là ứng viên");
            }
            
            // Cập nhật tên bên bảng User (Nếu có thay đổi)
            if (fullName != null && !fullName.trim().isEmpty()) {
                user.setFullName(fullName.trim());
                userRepository.save(user); // Lưu lại vào DB
            }
    
            // 2. Tìm hoặc tạo mới Profile
            CandidateProfile profile = profileRepository.findByUser_UserId(userId)
                    .orElse(new CandidateProfile());
    
            profile.setUser(user);
            if (jobTitle != null) profile.setJobTitle(jobTitle);
            if (phoneNumber != null) profile.setPhoneNumber(phoneNumber);
            profile.setUpdatedAt(LocalDateTime.now());
    
            // --- THƯ MỤC LƯU TRỮ ---
            String urlDir = "uploads/profiles/";
            String physicalDir = "D:/DA_KHOALUAN/backend/uploads/profiles/";
            Path dirPath = Paths.get(physicalDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }
    
            // 3. Xử lý CV (PDF)
            if (cvFile != null && !cvFile.isEmpty()) {
                String cvName = "cv_" + userId + "_" + System.currentTimeMillis() + ".pdf";
                Path cvPath = dirPath.resolve(cvName);
                Files.copy(cvFile.getInputStream(), cvPath, StandardCopyOption.REPLACE_EXISTING);
                profile.setCvFile("/" + urlDir + cvName);
            }
    
            // 4. Xử lý Avatar (JPG/PNG)
            if (avatarFile != null && !avatarFile.isEmpty()) {
                String avatarName = "avatar_" + userId + "_" + System.currentTimeMillis() + ".jpg";
                Path avatarPath = dirPath.resolve(avatarName);
                Files.copy(avatarFile.getInputStream(), avatarPath, StandardCopyOption.REPLACE_EXISTING);
                profile.setAvatar("/" + urlDir + avatarName);
            }
    
            // 5. LƯU VÀO DATABASE
            profileRepository.saveAndFlush(profile);
            return ResponseEntity.ok("Cập nhật thành công!");
    
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.badRequest().body("Lỗi hệ thống: " + e.getMessage());
        }
    }
}