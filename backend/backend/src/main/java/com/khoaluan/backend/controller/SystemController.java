package com.khoaluan.backend.controller;

import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.ActivityLogRepository;
import com.khoaluan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sun.management.OperatingSystemMXBean;
import java.lang.management.ManagementFactory;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/system")
@CrossOrigin(origins = "http://localhost:3000")
public class SystemController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    // Tạo sẵn 1 list để lưu lịch sử 5-7 mốc thời gian gần nhất cho biểu đồ
    private List<Map<String, Object>> chartData = new ArrayList<>();

    // ==========================================
    // 1. API: CPU/RAM Real-time
    // ==========================================
    @GetMapping("/metrics")
    public List<Map<String, Object>> getSystemMetrics() {
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);
        double cpuLoad = osBean.getCpuLoad() * 100;
        if (cpuLoad < 0) cpuLoad = 0;

        long totalRam = osBean.getTotalMemorySize();
        long freeRam = osBean.getFreeMemorySize();
        long usedRam = totalRam - freeRam;
        double ramUsage = ((double) usedRam / totalRam) * 100;

        String currentTime = new SimpleDateFormat("HH:mm:ss").format(new Date());
        Map<String, Object> currentMetric = new HashMap<>();
        currentMetric.put("name", currentTime);
        currentMetric.put("cpu", Math.round(cpuLoad));
        currentMetric.put("ram", Math.round(ramUsage));

        chartData.add(currentMetric);
        if (chartData.size() > 7) chartData.remove(0);

        return chartData;
    }

    // ==========================================
    // 2. API: Lấy toàn bộ nhật ký hoạt động của Admin
    // ==========================================
    @GetMapping("/logs")
    public ResponseEntity<?> getAdminLogs(
            @RequestParam(required = false) Integer adminId) {
        try {
            List<ActivityLog> logs;
            if (adminId != null) {
                logs = activityLogRepository.findAdminLogsByUserId(adminId);
            } else {
                logs = activityLogRepository.findAllAdminLogs();
            }

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");

            List<Map<String, Object>> result = logs.stream().map(log -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", log.getId());
                map.put("adminId", log.getUserId());
                map.put("actionType", log.getActionType());
                map.put("description", log.getDescription());
                map.put("time", log.getCreatedAt() != null ? log.getCreatedAt().format(fmt) : "N/A");
                map.put("rawTime", log.getCreatedAt());

                // Lấy tên Admin
                userRepository.findById(log.getUserId()).ifPresent(u -> {
                    map.put("adminName", u.getFullName());
                    map.put("adminEmail", u.getEmail());
                });

                // Map iconType và color dựa vào actionType
                String iconType = mapActionToIcon(log.getActionType());
                String color = mapActionToColor(log.getActionType());
                map.put("iconType", iconType);
                map.put("color", color);

                // action (bi-lingual) - dùng cho Frontend multilang
                Map<String, String> action = new HashMap<>();
                action.put("vi", log.getDescription());
                action.put("en", log.getDescription());
                map.put("action", action);

                // Device mặc định (tạm thời)
                map.put("device", "Windows - Chrome");

                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 3. API: Lấy danh sách tất cả Admin để filter
    // ==========================================
    @GetMapping("/admins")
    public ResponseEntity<?> getAdminList() {
        try {
            List<User> admins = userRepository.findAll().stream()
                .filter(u -> "admin".equals(u.getRole()))
                .collect(Collectors.toList());

            List<Map<String, Object>> result = admins.stream().map(u -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", u.getUserId());
                map.put("name", u.getFullName());
                map.put("email", u.getEmail());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 4. API: Ghi log Đăng xuất (gọi từ Frontend khi admin logout)
    // ==========================================
    @PostMapping("/logout-log")
    public ResponseEntity<?> logAdminLogout(@RequestBody Map<String, Integer> body) {
        try {
            Integer userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body("Thiếu userId");

            // Lấy tên admin từ DB
            String adminName = userRepository.findById(userId)
                .map(u -> u.getFullName())
                .orElse("Admin");

            ActivityLog log = new ActivityLog();
            log.setUserId(userId);
            log.setActionType("ĐĂNG XUẤT");
            log.setDescription("Admin \"" + adminName + "\" đã đăng xuất khỏi hệ thống quản trị.");
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);

            return ResponseEntity.ok(Map.of("message", "Ghi log đăng xuất thành công"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ==========================================
    // 5. API: Config hệ thống (giữ nguyên từ trước)
    // ==========================================
    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of("maintenanceMode", false, "defaultLang", "vi"));
    }

    @PutMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("message", "Đã lưu cấu hình!"));
    }

    // =================================================
    // HELPER: Map ActionType -> Icon và Color
    // =================================================
    private String mapActionToIcon(String actionType) {
        if (actionType == null) return "HISTORY";
        return switch (actionType.toUpperCase()) {
            case "ĐĂNG NHẬP", "LOGIN" -> "LOGIN";
            case "ĐĂNG XUẤT", "LOGOUT" -> "LOGOUT";
            case "XỬ TÝ BÁO CÁO", "REPORT" -> "REPORT";
            case "CẬP NHẬT TÀI KHOẢN", "KHÓA TÀI KHOẢN" -> "BAN";
            case "XCẬP NHẬT HỒ SƠ", "ĐĂNG TIN" -> "APPROVE";
            case "CÀI ĐẶT", "SETTINGS" -> "SETTINGS";
            default -> "HISTORY";
        };
    }

    private String mapActionToColor(String actionType) {
        if (actionType == null) return "text-slate-600 bg-slate-50 border-slate-200";
        return switch (actionType.toUpperCase()) {
            case "ĐĂNG NHẬP", "LOGIN" -> "text-blue-600 bg-blue-50 border-blue-200";
            case "ĐĂNG XUẤT", "LOGOUT" -> "text-slate-600 bg-slate-50 border-slate-200";
            case "XỬ TÝ BÁO CÁO", "REPORT" -> "text-amber-600 bg-amber-50 border-amber-200";
            case "CẬP NHẬT TÀI KHOẢN" -> "text-purple-600 bg-purple-50 border-purple-200";
            case "KHÓA TÀI KHOẢN" -> "text-rose-600 bg-rose-50 border-rose-200";
            default -> "text-emerald-600 bg-emerald-50 border-emerald-200";
        };
    }
}