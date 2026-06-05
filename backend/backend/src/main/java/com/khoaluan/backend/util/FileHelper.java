package com.khoaluan.backend.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class FileHelper {

    public static String sanitizeFilename(String filename) {
        if (filename == null) return "file";
        
        // 1. Phân tách và loại bỏ dấu tiếng Việt (ví dụ: tải xuống -> tai xuong)
        String normalized = Normalizer.normalize(filename, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String result = pattern.matcher(normalized).replaceAll("");
        
        // Thay chữ đ, Đ tiếng Việt đặc trưng
        result = result.replace("đ", "d").replace("Đ", "D");
        
        // 2. Chỉ giữ lại chữ cái không dấu, số, dấu chấm, gạch ngang và gạch dưới
        result = result.replaceAll("[^a-zA-Z0-9._-]", "_");
        
        // 3. Rút gọn nhiều dấu gạch dưới liên tục thành 1
        result = result.replaceAll("_+", "_");
        
        return result;
    }
}
