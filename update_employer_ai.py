import os
import re

filepath = 'd:/DA_KHOALUAN/backend/backend/src/main/java/com/khoaluan/backend/controller/EmployerAiController.java'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find index of "// ========================================================" for API: SINH MÔ TẢ
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "API: SINH MÔ TẢ CÔNG VIỆC" in line:
        start_idx = i - 1  # Get the line before with ===
    if "@GetMapping(\"/detail/{jobId}/{userId}\")" in line:
        # found the end part we want to keep
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    new_code = """
    // ========================================================
    // API 1: TỐI ƯU HÓA TIN TUYỂN DỤNG (JD AI) - FLASH
    // ========================================================
    @PostMapping("/optimize-jd")
    public ResponseEntity<?> optimizeJd(@RequestBody Map<String, Object> payload) {
        try {
            String draftDescription = payload.get("description") != null ? payload.get("description").toString() : "";
            String draftRequirements = payload.get("requirements") != null ? payload.get("requirements").toString() : "";

            if (draftDescription.isBlank() && draftRequirements.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập bản nháp JD!"));
            }

            String jsonResult = springAiService.optimizeJd(draftDescription, draftRequirements);
            return ResponseEntity.ok(new JSONObject(jsonResult).toMap());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tối ưu JD: " + e.getMessage()));
        }
    }

    // ========================================================
    // API 2: KHỞI TẠO BẢNG TIÊU CHÍ (CRITERIA MATRIX) - FLASH
    // ========================================================
    @PostMapping("/generate-criteria")
    public ResponseEntity<?> generateCriteriaMatrix(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());

            Job job = jobRepository.findById(jobId).orElseThrow(() -> new Exception("Không tìm thấy Job"));
            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new Exception("Không tìm thấy đơn ứng tuyển"));

            String jobDescription = job.getJobDescription() != null ? job.getJobDescription() : "";
            String cvSummary = app.getAiSummary() != null ? app.getAiSummary() : "";

            String jsonArrayResult = springAiService.generateCriteriaMatrix(cvSummary, jobDescription);
            
            // Cập nhật Database với ma trận tiêu chí ban đầu (chưa chấm)
            applicationRepository.updateCriteriaMatrix(jobId, userId, jsonArrayResult);

            return ResponseEntity.ok(new JSONArray(jsonArrayResult).toList());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi sinh tiêu chí: " + e.getMessage()));
        }
    }
    
    // ========================================================
    // API 3: CẬP NHẬT ĐIỂM TIÊU CHÍ TỪ FE VÀO DB
    // ========================================================
    @PostMapping("/update-criteria")
    public ResponseEntity<?> updateCriteriaMatrix(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String matrixJson = payload.get("matrix") != null ? payload.get("matrix").toString() : "[]";

            applicationRepository.updateCriteriaMatrix(jobId, userId, matrixJson);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật bảng tiêu chí"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi cập nhật tiêu chí: " + e.getMessage()));
        }
    }

    // ========================================================
    // API 4: ĐỀ XUẤT LƯƠNG & JD BONUS (PRO)
    // ========================================================
    @PostMapping("/propose-salary-bonus")
    public ResponseEntity<?> proposeSalaryAndBonus(@RequestBody Map<String, Object> payload) {
        try {
            Integer jobId = Integer.parseInt(payload.get("jobId").toString());
            Integer userId = Integer.parseInt(payload.get("userId").toString());
            String status = payload.get("status") != null ? payload.get("status").toString() : "PASS";

            JobApplication app = applicationRepository.findByJobIdAndUserId(jobId, userId)
                    .orElseThrow(() -> new Exception("Không tìm thấy đơn ứng tuyển"));

            String criteriaMatrix = app.getCriteriaMatrix() != null ? app.getCriteriaMatrix() : "[]";
            String candidateInfo = app.getAiSummary() != null ? app.getAiSummary() : "";

            String result = springAiService.proposeSalaryAndBonus(candidateInfo, criteriaMatrix, status);

            // Lưu gợi ý Offer
            applicationRepository.updateOfferSuggestion(jobId, userId, result);

            return ResponseEntity.ok(new JSONObject(result).toMap());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi đề xuất lương thưởng: " + e.getMessage()));
        }
    }

"""
    
    new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Updated EmployerAiController.java successfully.")
else:
    print("Could not find the target lines to replace.")

