package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.repository.UserRepository;
import com.khoaluan.backend.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository; // Inject Repository để ghi log thủ công

    // 1. Đăng ký
    @PostMapping("/register")
    @LogActivity(actionType = "ĐĂNG KÝ", description = "Người dùng mới đã đăng ký tài khoản trên hệ thống")
    public String register(@RequestBody User user) {
        if (user.getStatus() == null) {
            user.setStatus("ACTIVE");
        }
        userRepository.save(user);
        return "Đăng ký thành công!";
    }

    // 2. Đăng nhập
    @PostMapping("/login")
    // KHÔNG DÙNG @LogActivity Ở ĐÂY NỮA
    public Map<String, Object> login(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");

        // Tìm user theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // 🛑 BƯỚC CHẶN 1: Kiểm tra xem tài khoản có bị khoá không
        if ("LOCKED".equals(user.getStatus()) || "Bị khóa".equals(user.getStatus())) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa bởi Quản trị viên!");
        }

        // 🛑 BƯỚC CHẶN 2: Kiểm tra mật khẩu
        if (user.getPasswordHash().equals(password)) {
            
            // ========================================================
            // BƯỚC 3: GHI NHẬT KÝ BẰNG TAY (ĐÃ FIX LỖI ENTITY)
            // ========================================================
            try {
                ActivityLog log = new ActivityLog();
                log.setUserId(user.getUserId());
                String actionType = "admin".equals(user.getRole()) ? "ĐĂNG NHẬP" : "ĐĂNG NHẬP";
                String desc = "admin".equals(user.getRole())
                    ? "Admin \"" + user.getFullName() + "\" đã đăng nhập vào hệ thống quản trị."
                    : "Người dùng \"" + user.getFullName() + "\" đã đăng nhập thành công.";
                log.setActionType(actionType);
                log.setDescription(desc);
                log.setCreatedAt(LocalDateTime.now());
                activityLogRepository.save(log);
                System.out.println("✅ ĐÃ LƯU LOG ĐĂNG NHẬP CHO USER ID: " + user.getUserId());
            } catch (Exception e) {
                System.err.println("❌ LỖI KHÔNG THỂ LƯU LOG ĐĂNG NHẬP:");
                e.printStackTrace();
            }

            // Trả về dữ liệu cho React nếu đăng nhập thành công
            return Map.of(
                "message", "Đăng nhập thành công",
                "userId", user.getUserId(),
                "role", user.getRole(),
                "fullName", user.getFullName(),
                "status", user.getStatus() != null ? user.getStatus() : "ACTIVE" 
            );
        } else {
            throw new RuntimeException("Sai mật khẩu!");
        }
    }
}