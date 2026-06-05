// src/layouts/EmployerLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar'; // Đảm bảo đường dẫn import Navbar đúng

const EmployerLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 🚀 QUAN TRỌNG NHẤT LÀ CHỖ NÀY: Truyền role="employer" vào Navbar */}
      <Navbar role="employer" />

      {/* Phần nội dung chính của các trang (EmployerHome, CreateJobPage...) sẽ được render ở đây */}
      <main className="max-w-7xl mx-auto px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployerLayout;