import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- COMPONENTS & LAYOUTS ---
import Navbar from '../components/common/Navbar';
import CandidateLayout from '../layouts/CandidateLayout';

// --- PAGES: CHUNG ---
import IntroPage from '../pages/IntroPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import NotificationsPage from '../components/shared/NotificationsPage';

// --- PAGES: ỨNG VIÊN ---
import HomeFeed from '../pages/candidate/HomeFeed';
import UploadCVPage from '../pages/candidate/UploadCVPage';
import CandidateProfile from '../pages/candidate/CandidateProfile';
import CvViewersPage from '../pages/candidate/CvViewersPage';
import OptimizeCVPage from '../pages/candidate/OptimizeCVPage';

// --- PAGES: NHÀ TUYỂN DỤNG ---
import EmployerHome from '../pages/employer/EmployerHome';
import CreateJobPage from '../pages/employer/CreateJobPage';
import JobDetailPage from '../pages/employer/JobDetailPage';
import EmployerProfile from '../pages/employer/EmployerProfile';
import CandidateMatching from '../pages/employer/CandidateMatching';

// 🚀 IMPORT GUARD CHO NHÀ TUYỂN DỤNG
import EmployerGuard from '../pages/employer/EmployerGuard';

// 🚀 IMPORT TRANG ADMIN
import AdminDashboard from '../pages/admin/AdminDashboard';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* 1. Trang Intro */}
        <Route path="/" element={<IntroPage />} />

        {/* 2. Hệ thống Xác thực */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 3. Phân hệ Ứng viên */}
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<HomeFeed />} />
          <Route path="upload-cv" element={<UploadCVPage />} />
          <Route path="ai-optimize" element={<OptimizeCVPage />} />
          <Route path="notifications" element={<NotificationsPage role="candidate" />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="cv-status" element={<CvViewersPage />} />
        </Route>

        {/* 4. Phân hệ Nhà tuyển dụng (ĐÃ BỌC EMPLOYER GUARD) */}
        <Route path="/employer">
          {/* 4.1. Trang chủ */}
          <Route index element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <EmployerHome />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.2. Tạo tin tuyển dụng */}
          <Route path="create-job" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <CreateJobPage />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.3. CHI TIẾT CÔNG VIỆC */}
          <Route path="jobs/:id" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <JobDetailPage />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.4. QUẢN LÝ ỨNG VIÊN */}
          <Route path="jobs/:id/candidates" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <CandidateMatching />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.5. AI MATCHING CHUNG */}
          <Route path="candidates" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="w-full">
                  <CandidateMatching />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.6. THÔNG BÁO (Ngoại lệ - Vẫn bọc Guard nhưng Guard sẽ cho qua) */}
          <Route path="notifications" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="w-full">
                  <NotificationsPage role="employer" />
                </div>
              </div>
            </EmployerGuard>
          } />

          {/* 4.7. PROFILE (Ngoại lệ - Nơi để cập nhật GPKD) */}
          <Route path="profile" element={
            <EmployerGuard>
              <div className="min-h-screen bg-slate-50">
                <Navbar role="employer" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <EmployerProfile />
                </div>
              </div>
            </EmployerGuard>
          } />
        </Route>

        {/* 5. Phân hệ Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;