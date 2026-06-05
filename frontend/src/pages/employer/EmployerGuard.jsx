import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ShieldAlert, FileText, Loader2, LogOut, AlertTriangle, ArrowRight } from 'lucide-react';

const EmployerGuard = ({ children }) => {
  const [isVerified, setIsVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Ừu tiên sessionStorage (riêng tab), fallback về lastLogin_ key trong localStorage
  const userAccount = JSON.parse(
    sessionStorage.getItem('userAccount') ||
    localStorage.getItem('lastLogin_userAccount') ||
    '{}'
  );
  const userId = userAccount.userId;

  useEffect(() => {
    // Nếu không có dữ liệu session trong tab này thì điến login
    if (!userAccount || !userAccount.role) {
      navigate('/login');
      return;
    }

    // Nếu tab này không phải NTD, redirect về trang của role đó
    // (chỉ redirect nếu role SAI, không ảnh hưởng các tab khác)
    if (userAccount.role !== 'ntd') {
      if (userAccount.role === 'ung_vien') navigate('/candidate');
      else if (userAccount.role === 'admin') navigate('/admin');
      else navigate('/login');
      return;
    }

    const checkVerification = async () => {
      try {
        // Gọi API lấy profile NTD để check trạng thái
        const response = await axios.get(`http://localhost:8081/api/employer-profiles/${userId}`);
        const status = response.data?.verificationStatus;
        // Kiểm tra xem đã duyệt chưa
        setIsVerified(status === 'VERIFIED' || status === 'APPROVED');
      } catch (error) {
        console.error("Lỗi kiểm tra xác thực GPKD:", error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();
  }, [userId, userAccount.role]);

  // 1. GIAO DIỆN KHI ĐANG LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="text-blue-600 mb-4" size={48} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="font-bold text-slate-500 tracking-wide"
        >
          Đang tải dữ liệu doanh nghiệp...
        </motion.p>
      </div>
    );
  }

  // 2. CÁC TRANG NGOẠI LỆ (Được phép vào dù chưa duyệt GPKD)
  const allowedPaths = ['/employer/profile', '/employer/notifications'];
  const isAllowed = allowedPaths.some(path => location.pathname.includes(path));

  // 3. GIAO DIỆN CHẶN NẾU CHƯA XÁC THỰC (Đẹp & Chuyên nghiệp)
  if (userAccount.role === 'ntd' && !isVerified && !isAllowed) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Background Decor */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-300/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-300/20 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-xl p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-amber-900/5 max-w-lg w-full text-center border border-white relative z-10"
        >
          {/* Icon Header */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-50"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-amber-200/50">
              <ShieldAlert size={40} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-full border-4 border-white">
              <AlertTriangle size={16} strokeWidth={3} />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Cần xác thực tài khoản</h2>

          <div className="bg-amber-50/80 border border-amber-200/60 p-5 rounded-2xl mb-8 text-left">
            <p className="text-amber-900 font-medium leading-relaxed text-sm">
              Để bảo vệ ứng viên và đảm bảo uy tín nền tảng, hệ thống yêu cầu Nhà tuyển dụng phải cung cấp <strong className="font-black">Giấy phép kinh doanh (GPKD)</strong> và chờ Admin phê duyệt.
            </p>
            <p className="text-amber-700 font-medium text-xs mt-3 pt-3 border-t border-amber-200/50 flex items-center gap-2">
              <AlertTriangle size={14} /> Bạn hiện không thể đăng tin và xem ứng viên.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/employer/profile')}
              className="group w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 uppercase tracking-widest text-sm"
            >
              <FileText size={18} className="group-hover:scale-110 transition-transform" />
              Cập nhật GPKD ngay
              <ArrowRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            <button
              onClick={() => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); }}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 4. NẾU ĐÃ DUYỆT (HOẶC VÀO TRANG HỢP LỆ) -> Render nội dung bên trong
  return <>{children}</>;
};

export default EmployerGuard;