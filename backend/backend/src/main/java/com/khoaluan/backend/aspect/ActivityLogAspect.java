package com.khoaluan.backend.aspect;

import com.khoaluan.backend.annotation.LogActivity;
import com.khoaluan.backend.entity.ActivityLog;
import com.khoaluan.backend.repository.ActivityLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
public class ActivityLogAspect {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    // Tiêm Request vào để lấy thông tin người dùng đang gọi API
    @Autowired
    private HttpServletRequest request;

    @AfterReturning("@annotation(com.khoaluan.backend.annotation.LogActivity)")
    public void logAfterMethod(JoinPoint joinPoint) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            LogActivity annotation = method.getAnnotation(LogActivity.class);

            Integer userId = getUserIdFromRequest(joinPoint);

            if (userId != null) {
                ActivityLog log = new ActivityLog(userId, annotation.actionType(), annotation.description());
                activityLogRepository.save(log);
            } else {
                System.out.println("Cảnh báo Aspect: Không tìm thấy User ID để ghi log cho hành động " + annotation.actionType());
            }
        } catch (Exception e) {
            System.err.println("Lỗi Aspect ghi log: " + e.getMessage());
        }
    }

    private Integer getUserIdFromRequest(JoinPoint joinPoint) {
        // CÁCH 1: Lấy từ Header (Ví dụ bạn truyền thẳng user_id lên từ Frontend cho lẹ - dễ làm nhất cho đồ án)
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            return Integer.parseInt(userIdHeader);
        }

        // CÁCH 2: Lấy từ Request Attribute (Nếu Interceptor/Filter của bạn đã giải mã Token và nhét vào đây)
        Object userIdAttr = request.getAttribute("userId");
        if (userIdAttr != null) {
            return Integer.parseInt(userIdAttr.toString());
        }

        // CÁCH 3: Cứu cánh cuối cùng (Giống logic cũ của bạn, nhưng an toàn hơn chút)
        // Tìm biến nào có tên là "userId" hoặc "adminId" trong tham số hàm
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < parameterNames.length; i++) {
            if ((parameterNames[i].equalsIgnoreCase("userId") || parameterNames[i].equalsIgnoreCase("adminId")) 
                && args[i] instanceof Integer) {
                return (Integer) args[i];
            }
        }

        return null; // Bó tay, không tìm thấy ID
    }
}