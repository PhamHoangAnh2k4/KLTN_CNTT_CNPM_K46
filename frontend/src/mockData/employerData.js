import { Briefcase, Users, BrainCircuit } from 'lucide-react';

// 1. Dữ liệu cho các Card thống kê ở Dashboard
export const mockStats = [
  { title: 'Tin đang tuyển', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+2 tuần này' },
  { title: 'Tổng ứng viên', value: '348', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+45 tuần này' },
  { title: 'AI Đề xuất (Match > 80%)', value: '86', icon: BrainCircuit, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: 'Tỷ lệ chốt cao' },
];

// 2. Dữ liệu cho danh sách Tin tuyển dụng (Đã bổ sung requiredSkills và jobDescription)
export const mockJobs = [
  { 
    id: 1, 
    title: 'Senior Frontend Engineer (ReactJS)', 
    location: 'Tòa nhà Landmark 81, TP. HCM', 
    type: 'Toàn thời gian', 
    salary: '30 - 50 Triệu',
    experience: '3 - 5 năm',
    applicants: 45, 
    status: 'Active', 
    posted: '2 ngày trước',
    requiredSkills: ['ReactJS', 'TypeScript', 'Tailwind', 'REST API'], 
    jobDescription: 'Tham gia phát triển hệ thống lõi JobAI. Yêu cầu ứng viên có khả năng tối ưu hóa UI/UX, am hiểu về Clean Code.'
  },
  { 
    id: 2, 
    title: 'Chuyên viên Marketing AI Platform', 
    location: 'Hà Nội', 
    type: 'Toàn thời gian', 
    salary: '10 - 20 Triệu',
    experience: '1 - 2 năm',
    applicants: 120, 
    status: 'Active', 
    posted: '5 ngày trước',
    requiredSkills: ['Digital Marketing', 'SEO', 'Content Creation'], 
    jobDescription: 'Lên kế hoạch nội dung, chạy quảng cáo và tối ưu hóa SEO cho nền tảng tuyển dụng AI.'
  }
];

// 3. Dữ liệu ứng viên (Đã bổ sung rawCvText để giả lập dữ liệu từ OCR)
export const mockCandidates = [
  { 
    id: 101, 
    name: 'Nguyễn Trường Giang', 
    role: 'Senior Frontend Engineer', 
    matchScore: 95, 
    experience: '5 năm', 
    status: 'Chờ phỏng vấn',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    rawCvText: "NGUYEN TRUONG GIANG\nSenior Frontend Engineer\nSĐT: 0909xxx\nEmail: giang@email.com\nKinh nghiệm 5 năm làm ReactJS tại Cty ABC...",
    skills: ['ReactJS', 'NodeJS', 'TypeScript', 'Tailwind'],
    education: {
      school: 'Đại học Bách Khoa TP.HCM',
      major: 'Chuyên ngành Khoa học Máy tính',
      gpa: '3.6/4.0'
    },
    workHistory: [
      {
        role: 'Senior Frontend Engineer',
        company: 'Công ty Cổ phần Công nghệ ABC',
        duration: '2022 - Hiện tại',
        description: 'Phát triển hệ thống JobAI.'
      }
    ]
  },
  { 
    id: 102, 
    name: 'Trần Thị Thu Hà', 
    role: 'Chuyên viên Marketing', 
    matchScore: 88, 
    experience: '4 năm', 
    status: 'Mới ứng tuyển',
    location: 'Hà Nội, Việt Nam',
    rawCvText: "TRAN THI THU HA\nChuyên viên Marketing\nThành thạo SEO, Content và lên chiến dịch truyền thông đa phương tiện...",
    skills: ['Digital Marketing', 'SEO', 'Content'],
    education: {
      school: 'Đại học Kinh tế Quốc dân',
      major: 'Marketing',
      gpa: '3.8/4.0'
    },
    workHistory: [] 
  }
];