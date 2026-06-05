package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity; // Import Annotation
import com.khoaluan.backend.entity.Notification;
import com.khoaluan.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // --- 1. LẤY DANH SÁCH THÔNG BÁO ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserNotifications(@PathVariable Integer userId) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(notifs);
    }

    // --- 2. THÊM THÔNG BÁO ---
    @PostMapping("/add")
    // Thông thường việc tạo thông báo hệ thống tự làm nên có thể không cần log hành động người dùng ở đây
    public ResponseEntity<?> addNotification(@RequestBody Notification notif) {
        try {
            notif.setCreatedAt(LocalDateTime.now());
            notif.setIsRead(false);
            Notification saved = notificationRepository.save(notif);
            messagingTemplate.convertAndSend("/topic/notifications", "UPDATED");
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi lưu thông báo: " + e.getMessage());
        }
    }

    // --- 3. ĐÁNH DẤU ĐÃ ĐỌC ---
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
            messagingTemplate.convertAndSend("/topic/notifications", "UPDATED");
        });
        return ResponseEntity.ok("Success");
    }

    // --- 4. ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC ---
    @PutMapping("/user/{userId}/read-all")
    @LogActivity(actionType = "THÔNG BÁO", description = "Người dùng đã đánh dấu đọc tất cả thông báo")
    public ResponseEntity<?> markAllAsRead(@PathVariable Integer userId) {
        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notifs.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifs);
        messagingTemplate.convertAndSend("/topic/notifications", "UPDATED");
        return ResponseEntity.ok("Success");
    }

    // --- 5. XOÁ THÔNG BÁO ---
    @DeleteMapping("/{id}")
    @LogActivity(actionType = "XÓA THÔNG BÁO", description = "Người dùng đã xóa một thông báo khỏi hệ thống")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer id) {
        try {
            notificationRepository.deleteById(id);
            messagingTemplate.convertAndSend("/topic/notifications", "UPDATED");
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}