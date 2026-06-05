export const currentUser = {
  name: "Nguyễn Văn A",
  title: "Software Engineer",
  appliedCount: 1,
  avatarText: "A",
  // Bổ sung rawCvText: Lưu trữ văn bản OCR quét được từ CV của user này
  rawCvText: "NGUYEN VAN A\nSoftware Engineer\nKỹ năng: ReactJS, Javascript, REST API\nKinh nghiệm: 2 năm làm việc tại công ty ABC..."
};

export const suggestedJobs = [
  {
    id: 1,
    company: "Công ty từ JobAI",
    status: "Vừa đăng",
    matchScore: 84,
    logoText: "A",
    location: "Hà Nội",
    type: "Toàn thời gian",
    salary: "Thỏa thuận",
    description: "Chúng tôi đang tìm kiếm ứng viên tài năng cho vị trí Software Engineer. Môi trường làm việc năng động, có cơ hội thăng tiến.",
    // Bổ sung requiredSkills: Nhờ mảng này so sánh với rawCvText ở trên, AI mới chấm ra được 84 điểm
    requiredSkills: ["ReactJS", "Javascript", "REST API", "TailwindCSS"],
    isApplied: true
  }
];