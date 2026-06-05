package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity; // Import Annotation để ghi log
import com.khoaluan.backend.entity.EmployerProfile;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.EmployerProfileRepository;
import com.khoaluan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.khoaluan.backend.util.FileHelper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employer-profiles")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployerProfileController {

    @Autowired
    private EmployerProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    private final String URL_DIR = "uploads/profiles";
    private final String PHYSICAL_DIR = "D:/DA_KHOALUAN/backend/uploads/profiles";

    // --- HÀM HỖ TRỢ LƯU FILE (GIỮ NGUYÊN) ---
    private String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty())
            return null;
        Path uploadPath = Paths.get(PHYSICAL_DIR);
        if (!Files.exists(uploadPath))
            Files.createDirectories(uploadPath);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String sanitizedName = FileHelper.sanitizeFilename(originalName);
        String fileName = UUID.randomUUID().toString() + "_" + sanitizedName;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/" + URL_DIR + "/" + fileName;
    }

    // ==========================================
    // CHỨC NĂNG: API LẤY ẢNH TỪ BACKEND ĐỂ HIỂN THỊ LÊN FE
    // ==========================================
    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(PHYSICAL_DIR).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==========================================
    // TÌM KIẾM CÔNG TY (AUTOCOMPLETE) - GIỮ NGUYÊN
    // ==========================================
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchCompanies(@RequestParam String query) {
        List<EmployerProfile> profiles = profileRepository.findByCompanyNameContainingIgnoreCase(query);

        List<Map<String, Object>> result = profiles.stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getProfileId());
            map.put("companyName", p.getCompanyName());
            map.put("logo", p.getCompanyLogo());
            map.put("address", p.getAddress());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/by-name")
    public ResponseEntity<?> getProfileByName(@RequestParam String name) {
        List<EmployerProfile> profiles = profileRepository.findByCompanyNameContainingIgnoreCase(name);
        if (!profiles.isEmpty()) {
            EmployerProfile profile = profiles.stream()
                    .filter(p -> p.getCompanyName().equalsIgnoreCase(name))
                    .findFirst()
                    .orElse(profiles.get(0));
            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy thông tin công ty!"));
    }

    // --- LẤY THÔNG TIN PROFILE HIỆN TẠI ---
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Integer userId) {
        Optional<EmployerProfile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isPresent()) {
            return ResponseEntity.ok(profileOpt.get());
        } else {
            return ResponseEntity.ok(new EmployerProfile());
        }
    }

    // --- TẠO HOẶC CẬP NHẬT PROFILE ---
    @PostMapping("/{userId}")
    @Transactional
    @LogActivity(actionType = "CẬP NHẬT HỒ SƠ", description = "Nhà tuyển dụng đã cập nhật thông tin hồ sơ doanh nghiệp")
    public ResponseEntity<?> saveOrUpdateProfile(
            @PathVariable Integer userId, // Vì tham số tên là userId nên Aspect sẽ bắt được ngay
            @RequestParam("companyName") String companyName,
            @RequestParam("taxCode") String taxCode,
            @RequestParam("companySize") String companySize,
            @RequestParam(value = "website", required = false) String website,
            @RequestParam("address") String address,
            @RequestParam("description") String description,
            @RequestParam(value = "logoFile", required = false) MultipartFile logoFile,
            @RequestParam(value = "licenseFile", required = false) MultipartFile licenseFile) {
        try {
            // 1. Cập nhật tên bên bảng User (Đồng bộ)
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy User ID: " + userId));
            user.setFullName(companyName);
            userRepository.save(user);

            // 2. Xử lý lưu Profile
            EmployerProfile profile = profileRepository.findByUserId(userId).orElse(new EmployerProfile());
            profile.setUserId(userId);
            profile.setCompanyName(companyName);
            profile.setTaxCode(taxCode);
            profile.setCompanySize(companySize);
            profile.setWebsite(website);
            profile.setAddress(address);
            profile.setDescription(description);

            // Xử lý lưu File Logo
            if (logoFile != null && !logoFile.isEmpty()) {
                profile.setCompanyLogo(saveFile(logoFile));
            }
            // Xử lý lưu File Giấy phép
            if (licenseFile != null && !licenseFile.isEmpty()) {
                profile.setBusinessLicenseFile(saveFile(licenseFile));
            }

            // Nếu là tạo mới thì trạng thái mặc định là UNVERIFIED
            if (profile.getProfileId() == null) {
                profile.setVerificationStatus("UNVERIFIED");
            }

            EmployerProfile savedProfile = profileRepository.save(profile);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật hồ sơ thành công!",
                    "profile", savedProfile));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}