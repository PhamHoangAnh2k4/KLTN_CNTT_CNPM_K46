package com.khoaluan.backend.util;

import com.khoaluan.backend.entity.EmployerProfile;
import com.khoaluan.backend.entity.CandidateCv;
import com.khoaluan.backend.entity.Job;
import com.khoaluan.backend.repository.EmployerProfileRepository;
import com.khoaluan.backend.repository.CandidateCvRepository;
import com.khoaluan.backend.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

@Component
public class DatabaseFileFixer implements CommandLineRunner {

    @Autowired
    private EmployerProfileRepository employerProfileRepository;

    @Autowired
    private CandidateCvRepository candidateCvRepository;

    @Autowired
    private JobRepository jobRepository;

    private static final String PROFILE_DIR = "D:/DA_KHOALUAN/backend/uploads/profiles";
    private static final String CV_DIR = "D:/DA_KHOALUAN/backend/uploads/cvs";
    private static final String UPLOAD_DIR = "D:/DA_KHOALUAN/backend/uploads";

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== [DATABASE FILE FIXER] STARTING SYSTEM SANITIZATION ======");
        try {
            fixEmployerProfiles();
            fixCandidateCvs();
            fixJobs();
        } catch (Exception e) {
            System.err.println("Error while running file fixer: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("====== [DATABASE FILE FIXER] COMPLETED SYSTEM SANITIZATION ======");
    }

    private void fixEmployerProfiles() {
        for (EmployerProfile profile : employerProfileRepository.findAll()) {
            boolean updated = false;

            // Fix Business License File
            String licensePath = profile.getBusinessLicenseFile();
            System.out.println("[DATABASE FILE FIXER] Profile ID: " + profile.getProfileId() + ", Business License: " + licensePath);
            if (licensePath != null && (licensePath.contains("?") || hasNonAscii(licensePath) || licensePath.contains(" "))) {
                System.out.println("[DATABASE FILE FIXER] Match found for cleanup in business license!");
                String fixedPath = processAndRenameFile(PROFILE_DIR, licensePath, "uploads/profiles");
                if (fixedPath != null) {
                    profile.setBusinessLicenseFile(fixedPath);
                    updated = true;
                }
            }

            // Fix Company Logo
            String logoPath = profile.getCompanyLogo();
            System.out.println("[DATABASE FILE FIXER] Profile ID: " + profile.getProfileId() + ", Company Logo: " + logoPath);
            if (logoPath != null && (logoPath.contains("?") || hasNonAscii(logoPath) || logoPath.contains(" "))) {
                System.out.println("[DATABASE FILE FIXER] Match found for cleanup in company logo!");
                String fixedPath = processAndRenameFile(PROFILE_DIR, logoPath, "uploads/profiles");
                if (fixedPath != null) {
                    profile.setCompanyLogo(fixedPath);
                    updated = true;
                }
            }

            if (updated) {
                employerProfileRepository.save(profile);
            }
        }
    }

    private void fixCandidateCvs() {
        for (CandidateCv cv : candidateCvRepository.findAll()) {
            String cvPath = cv.getCvFile();
            if (cvPath != null && (cvPath.contains("?") || hasNonAscii(cvPath) || cvPath.contains(" "))) {
                String fixedPath = processAndRenameFile(CV_DIR, cvPath, "uploads/cvs");
                if (fixedPath != null) {
                    cv.setCvFile(fixedPath);
                    candidateCvRepository.save(cv);
                }
            }
        }
    }

    private void fixJobs() {
        for (Job job : jobRepository.findAll()) {
            boolean updated = false;

            // Fix Banner Url
            String bannerUrl = job.getBannerUrl();
            if (bannerUrl != null && (bannerUrl.contains("?") || hasNonAscii(bannerUrl) || bannerUrl.contains(" "))) {
                // Có thể chứa danh sách phân tách bằng dấu phẩy
                String[] urls = bannerUrl.split(",");
                String[] fixedUrls = new String[urls.length];
                boolean bannerUpdated = false;
                for (int i = 0; i < urls.length; i++) {
                    String url = urls[i].trim();
                    if (url.contains("?") || hasNonAscii(url) || url.contains(" ")) {
                        String fixed = processAndRenameFile(UPLOAD_DIR + "/images", url, "uploads/images");
                        if (fixed != null) {
                            fixedUrls[i] = fixed;
                            bannerUpdated = true;
                        } else {
                            fixedUrls[i] = url;
                        }
                    } else {
                        fixedUrls[i] = url;
                    }
                }
                if (bannerUpdated) {
                    job.setBannerUrl(String.join(",", fixedUrls));
                    updated = true;
                }
            }

            // Fix Document Url
            String docUrl = job.getDocumentUrl();
            if (docUrl != null && (docUrl.contains("?") || hasNonAscii(docUrl) || docUrl.contains(" "))) {
                String fixedPath = processAndRenameFile(UPLOAD_DIR + "/docs", docUrl, "uploads/docs");
                if (fixedPath != null) {
                    job.setDocumentUrl(fixedPath);
                    updated = true;
                }
            }

            if (updated) {
                jobRepository.save(job);
            }
        }
    }

    private boolean hasNonAscii(String str) {
        if (str == null) return false;
        for (int i = 0; i < str.length(); i++) {
            if (str.charAt(i) > 127) {
                return true;
            }
        }
        return false;
    }

    private String processAndRenameFile(String physicalBaseDir, String dbPath, String urlPrefix) {
        try {
            // Lấy tên file gốc lưu trong db
            String dbFileName = dbPath.substring(dbPath.lastIndexOf('/') + 1);
            
            // Tìm tiền tố (ví dụ UUID hoặc timestamp đầu tiên trước dấu gạch dưới)
            int underscoreIdx = dbFileName.indexOf('_');
            if (underscoreIdx == -1) return null;
            
            String prefix = dbFileName.substring(0, underscoreIdx);
            
            // Quét thư mục vật lý để tìm file có cùng tiền tố
            File dir = new File(physicalBaseDir);
            if (!dir.exists() || !dir.isDirectory()) return null;
            
            File targetPhysicalFile = null;
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.isFile() && f.getName().startsWith(prefix + "_")) {
                        targetPhysicalFile = f;
                        break;
                    }
                }
            }
            
            if (targetPhysicalFile != null) {
                String originalPhysicalName = targetPhysicalFile.getName();
                
                // Trích xuất phần đuôi mở rộng và phần tên gốc để sanitize
                String basePart = originalPhysicalName.substring(underscoreIdx + 1);
                String sanitizedBasePart = FileHelper.sanitizeFilename(basePart);
                
                String newFileName = prefix + "_" + sanitizedBasePart;
                
                if (!originalPhysicalName.equals(newFileName)) {
                    File newPhysicalFile = new File(dir, newFileName);
                    if (targetPhysicalFile.renameTo(newPhysicalFile)) {
                        System.out.println("[DATABASE FILE FIXER] Renamed physical file: " + originalPhysicalName + " -> " + newFileName);
                    } else {
                        System.err.println("[DATABASE FILE FIXER] Failed to rename physical file: " + originalPhysicalName);
                        // Có thể file mới đã tồn tại, vẫn tiếp tục dùng file mới
                    }
                }
                
                String fixedDbPath = "/" + urlPrefix + "/" + newFileName;
                System.out.println("[DATABASE FILE FIXER] Updated DB Path: " + dbPath + " -> " + fixedDbPath);
                return fixedDbPath;
            }
        } catch (Exception e) {
            System.err.println("Error processing file " + dbPath + ": " + e.getMessage());
        }
        return null;
    }
}
