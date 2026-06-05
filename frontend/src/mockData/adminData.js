export const initialUsers = [
    { id: 'USR-001', role: 'Ứng viên', name: 'Nguyễn Văn A', email: 'vana@gmail.com', phone: '0901234567', status: 'Hoạt động', avatar: 'https://i.pravatar.cc/150?u=1', history: [{ time: '10:30 - 20/10/2023', action: 'Tải lên CV (UIUX_Designer_CV.pdf)' }, { time: '14:15 - 21/10/2023', action: 'Ứng tuyển vị trí: Senior Designer tại VNG Group' }] },
    { id: 'USR-002', role: 'Nhà tuyển dụng', name: 'Trần Thị B', company: 'FPT Software', email: 'hr@fpt.com', phone: '0987654321', status: 'Hoạt động', avatar: 'https://i.pravatar.cc/150?u=2', history: [{ time: '09:15 - 23/10/2023', action: 'Đăng tin tuyển dụng mới: ReactJS Developer' }] },
    { id: 'USR-003', role: 'Ứng viên', name: 'Lê Văn C', email: 'vanc@gmail.com', phone: '0912345678', status: 'Bị khóa', avatar: 'https://i.pravatar.cc/150?u=3', history: [{ time: '16:20 - 18/10/2023', action: 'Gửi tin nhắn spam tới nhiều nhà tuyển dụng' }, { time: '08:00 - 19/10/2023', action: 'Bị Admin khóa tài khoản (Lý do: Spam)' }] },
    { id: 'USR-004', role: 'Nhà tuyển dụng', name: 'Phạm Minh D', company: 'VNG Group', email: 'tuyendung@vng.com.vn', phone: '0933334444', status: 'Hoạt động', avatar: 'https://i.pravatar.cc/150?u=4', history: [{ time: '09:00 - 25/10/2023', action: 'Cập nhật giấy phép kinh doanh' }] }
  ];
    
  export const mockInitialJobs = [
    { id: 'JOB-001', title: 'Senior Frontend Developer', company: 'VNG Group', type: 'Toàn thời gian', location: 'Hồ Chí Minh', salary: '30 - 45 triệu', status: 'Chờ duyệt', postedDate: '25/10/2023', applications: 0, description: 'Phát triển các tính năng Frontend cho dự án Zalo...', requirements: '- Ít nhất 3 năm kinh nghiệm ReactJS\n- Hiểu biết sâu về State Management', experience: '3 - 5 năm', attachments: [{ name: 'JD_Frontend.pdf', size: 1024000 }] },
    { id: 'JOB-002', title: 'UI/UX Designer', company: 'FPT Software', type: 'Toàn thời gian', location: 'Hà Nội', salary: '20 - 30 triệu', status: 'Đã duyệt', postedDate: '24/10/2023', applications: 12, description: 'Thiết kế giao diện cho các sản phẩm Outsource của công ty.', requirements: '- Thành thạo Figma\n- Có portfolio đính kèm', experience: '1 - 3 năm', attachments: [] }
  ];
    
  export const initialReports = [
    { id: 'RPT-001', type: 'Tuyển dụng lừa đảo', reporter: 'Nguyễn Văn A', target: 'Công ty Đa Cấp XYZ', date: '26/10/2023', status: 'Chờ xử lý', description: 'Yêu cầu đóng phí 500k trước khi nhận việc.', evidence: 'Tin nhắn Zalo yêu cầu chuyển khoản.' },
    { id: 'RPT-002', type: 'Spam/Quấy rối', reporter: 'FPT Software', target: 'Ứng viên Lê Văn C', date: '25/10/2023', status: 'Đã giải quyết', description: 'Gửi liên tục 20 tin nhắn chửi bới nhân sự.', evidence: 'Lịch sử chat trên hệ thống.' }
  ];
    
  export const chartData = [
    { name: '01/10', newUsers: 120, newJobs: 45, applicants: 320 },
    { name: '02/10', newUsers: 85, newJobs: 30, applicants: 250 },
    { name: '03/10', newUsers: 150, newJobs: 60, applicants: 410 },
    { name: '04/10', newUsers: 90, newJobs: 25, applicants: 190 },
    { name: '05/10', newUsers: 210, newJobs: 80, applicants: 500 },
    { name: '06/10', newUsers: 180, newJobs: 55, applicants: 460 },
    { name: '07/10', newUsers: 250, newJobs: 90, applicants: 620 },
  ];
    
  export const systemChartData = [
    { name: '10:00', cpu: 45, ram: 60 },
    { name: '10:05', cpu: 55, ram: 65 },
    { name: '10:10', cpu: 40, ram: 62 },
    { name: '10:15', cpu: 65, ram: 70 },
    { name: '10:20', cpu: 50, ram: 68 },
    { name: '10:25', cpu: 75, ram: 75 },
    { name: '10:30', cpu: 60, ram: 72 },
  ];
    
  export const topPaidJobs = [
    { title: 'Trưởng phòng IT', company: 'Techcombank', salary: '40 - 60 triệu' },
    { title: 'Senior AI Engineer', company: 'VinBigData', salary: '50 - 80 triệu' },
    { title: 'Giám đốc Marketing', company: 'Shopee', salary: '60 - 100 triệu' },
    { title: 'Giám đốc Nhân sự', company: 'Masan Group', salary: '70 - 120 triệu' },
  ];