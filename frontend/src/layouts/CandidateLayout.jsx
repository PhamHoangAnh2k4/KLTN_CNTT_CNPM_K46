import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar'; // Đường dẫn import có thể khác tuỳ sếp set up

const CandidateLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userAccount = JSON.parse(
      sessionStorage.getItem('userAccount') ||
      localStorage.getItem('lastLogin_userAccount') ||
      '{}'
    );
    if (!userAccount || !userAccount.role) {
      navigate('/login');
      return;
    }
    if (userAccount.role !== 'ung_vien') {
      if (userAccount.role === 'ntd') navigate('/employer');
      else if (userAccount.role === 'admin') navigate('/admin');
      else navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 🚀 CHỈ CẦN THÊM role="candidate" VÀO ĐÂY LÀ CHUẨN BÀI */}
      <Navbar role="candidate" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet /> {/* Nơi render các trang con của Ứng viên */}
      </main>
    </div>
  );
};

export default CandidateLayout;