package com.khoaluan.backend.controller;

import com.khoaluan.backend.annotation.LogActivity; // Import Annotation
import com.khoaluan.backend.dto.ReviewResponse;
import com.khoaluan.backend.entity.CandidateProfile;
import com.khoaluan.backend.entity.CompanyReview;
import com.khoaluan.backend.entity.ReviewComment;
import com.khoaluan.backend.entity.User;
import com.khoaluan.backend.repository.CandidateProfileRepository;
import com.khoaluan.backend.repository.CompanyReviewRepository;
import com.khoaluan.backend.repository.ReviewCommentRepository;
import com.khoaluan.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import com.khoaluan.backend.util.FileHelper;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class CompanyReviewController {

    @Autowired
    private CompanyReviewRepository reviewRepository;

    @Autowired
    private ReviewCommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateProfileRepository profileRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final String BACKEND_URL = "http://localhost:8081";

    @GetMapping("/all")
    public ResponseEntity<?> getAllReviews() {
        List<CompanyReview> reviews = reviewRepository.findAllByOrderByCreatedAtDesc();

        List<ReviewResponse> responseList = reviews.stream().map(review -> {
            ReviewResponse dto = new ReviewResponse();
            dto.setId(review.getId());
            dto.setUserId(review.getUserId());
            dto.setCompany(review.getCompanyName());
            dto.setRating(review.getRating());
            dto.setContent(review.getContent());
            if (review.getMediaUrl() != null && review.getMediaUrl().startsWith("/uploads")) {
                dto.setMedia(BACKEND_URL + review.getMediaUrl());
            } else {
                dto.setMedia(review.getMediaUrl());
            }
            dto.setMediaType(review.getMediaType());
            dto.setLikes(review.getLikesCount() != null ? review.getLikesCount() : 0);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            dto.setTime(review.getCreatedAt() != null ? review.getCreatedAt().format(formatter) : "Vừa xong");

            // --- LẤY THUỘC TÍNH TỪ USER VÀ PROFILE ---
            User user = userRepository.findById(review.getUserId()).orElse(null);
            CandidateProfile profile = profileRepository.findByUser_UserId(review.getUserId()).orElse(null);
            
            ReviewResponse.UserDto userDto = new ReviewResponse.UserDto();
            if (user != null) {
                userDto.setName(user.getFullName());
                // Lấy Avatar và Title từ Profile
                if (profile != null) {
                    userDto.setAvatar(profile.getAvatar() != null ? BACKEND_URL + profile.getAvatar() : null);
                    userDto.setTitle(profile.getJobTitle() != null ? profile.getJobTitle() : "Ứng viên");
                }
            }
            dto.setUser(userDto);

            // --- LẤY THÔNG TIN NGƯỜI COMMENT ---
            List<ReviewComment> comments = commentRepository.findByReviewIdOrderByCreatedAtAsc(review.getId());
            dto.setComments(comments.stream().map(c -> {
                User cUser = userRepository.findById(c.getUserId()).orElse(null);
                CandidateProfile cProfile = profileRepository.findByUser_UserId(c.getUserId()).orElse(null);
                
                ReviewResponse.CommentDto cDto = new ReviewResponse.CommentDto();
                cDto.setId(c.getId());
                cDto.setContent(c.getContent());
                if (cUser != null) {
                    cDto.setUser(cUser.getFullName());
                    if (cProfile != null) {
                        cDto.setAvatar(cProfile.getAvatar() != null ? BACKEND_URL + cProfile.getAvatar() : null);
                    }
                }
                return cDto;
            }).collect(Collectors.toList()));

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/upload-media")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            String reviewMediaDir = "D:/DA_KHOALUAN/backend/uploads/reviews";
            File dir = new File(reviewMediaDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String sanitizedName = FileHelper.sanitizeFilename(originalName);
            String fileName = "review_" + System.currentTimeMillis() + "_" + sanitizedName;
            File destFile = new File(dir, fileName);
            file.transferTo(destFile);

            String fileUrl = "/uploads/reviews/" + fileName;
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi upload media: " + e.getMessage()));
        }
    }

    @PostMapping("/add")
    @LogActivity(actionType = "REVIEW CÔNG TY", description = "Người dùng đã đăng một bài đánh giá công ty mới")
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> request) {
        try {
            CompanyReview review = new CompanyReview();
            review.setUserId(Integer.parseInt(request.get("userId").toString()));
            review.setCompanyName(request.get("companyName").toString());
            review.setRating(Integer.parseInt(request.get("rating").toString()));
            review.setContent(request.get("content").toString());
            review.setMediaUrl(request.get("mediaUrl") != null ? request.get("mediaUrl").toString() : null);
            review.setMediaType(request.get("mediaType") != null ? request.get("mediaType").toString() : null);
            review.setLikesCount(0);
            review.setCreatedAt(LocalDateTime.now());
            
            reviewRepository.save(review);
            messagingTemplate.convertAndSend("/topic/reviews", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Đăng bài thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/comment/add")
    @LogActivity(actionType = "BÌNH LUẬN", description = "Người dùng đã để lại bình luận trong một bài đánh giá")
    public ResponseEntity<?> addComment(@RequestBody Map<String, Object> request) {
        try {
            ReviewComment comment = new ReviewComment();
            comment.setReviewId(Long.parseLong(request.get("reviewId").toString()));
            comment.setUserId(Integer.parseInt(request.get("userId").toString()));
            comment.setContent(request.get("content").toString());
            comment.setCreatedAt(LocalDateTime.now());
            commentRepository.save(comment);
            messagingTemplate.convertAndSend("/topic/reviews", "UPDATED");
            return ResponseEntity.ok(Map.of("message", "Bình luận thành công!"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    @LogActivity(actionType = "XÓA REVIEW", description = "Người dùng đã xóa bài đánh giá công ty")
    public ResponseEntity<?> deleteReview(@PathVariable Long id, @RequestParam("userId") Integer userId) {
        try {
            CompanyReview review = reviewRepository.findById(id).orElse(null);
            if (review == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy bài viết!"));
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không hợp lệ!"));
            }

            // Chỉ cho phép admin hoặc chủ bài viết xóa
            if (!"admin".equalsIgnoreCase(user.getRole()) && !review.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền xóa bài viết này!"));
            }

            // Xóa file media nếu có và nó nằm trong uploads
            if (review.getMediaUrl() != null && review.getMediaUrl().startsWith("/uploads/")) {
                try {
                    String path = review.getMediaUrl().replace("/uploads/", "D:/DA_KHOALUAN/backend/uploads/");
                    File mediaFile = new File(path);
                    if (mediaFile.exists()) {
                        mediaFile.delete();
                        System.out.println("📁 Đã xóa file media liên quan: " + mediaFile.getAbsolutePath());
                    }
                } catch (Exception e) {
                    System.err.println("Lỗi xóa file media: " + e.getMessage());
                }
            }

            // Xóa comment liên quan
            commentRepository.deleteByReviewId(id);

            // Xóa review
            reviewRepository.delete(review);

            // Gửi tín hiệu WebSocket để reload feed
            messagingTemplate.convertAndSend("/topic/reviews", "UPDATED");

            return ResponseEntity.ok(Map.of("message", "Xóa bài đánh giá thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi xóa bài viết: " + e.getMessage()));
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity.badRequest().body(Map.of("error", "Kích thước tệp tin quá lớn! Vui lòng upload video/hình ảnh dưới 200MB."));
    }
}