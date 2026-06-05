import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Sparkles, ArrowUpRight, 
  UserCog, Phone, Mail, User, Library,
  ShieldCheck, Star, Zap, CreditCard, ExternalLink
} from 'lucide-react';

const ProfileCard = () => {
  const [profileData, setProfileData] = useState({});
  const API_BASE_URL = "http://localhost:8081";

  // 🛡️ CHIẾN THUẬT CÔ LẬP TAB: Tuyệt đối tin tưởng sessionStorage của riêng Tab này
  const getActiveUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    
    // Chỉ dùng localStorage làm phương án cuối cùng nếu session hoàn toàn trống
    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
    return localUser ? JSON.parse(localUser) : null;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      const activeUser = getActiveUser();
      
      // Nếu không có user hoặc Role KHÔNG PHẢI ứng viên thì không lấy profile candidate
      if (!activeUser || !activeUser.userId || activeUser.role !== 'ung_vien') {
        if (activeUser) setProfileData(activeUser);
        return;
      }

      try {
        // Gọi API đúng với ID của tab hiện tại
        const response = await axios.get(`${API_BASE_URL}/api/candidate-profiles/${activeUser.userId}`);
        
        // Gộp dữ liệu: Ưu tiên Tên/Email từ Session, còn Ảnh/SĐT từ Database
        setProfileData({
          ...activeUser, 
          ...response.data 
        });
      } catch (error) {
        console.error("Lỗi fetch ProfileCard:", error);
        // Fallback: Nếu API lỗi, ít nhất vẫn hiện đúng cái tên từ lúc Login (trong session)
        setProfileData(activeUser);
      }
    };

    fetchProfileData();
    
    // Lắng nghe sự thay đổi của storage để cập nhật nếu cần (tùy chọn)
    const handleStorageChange = () => fetchProfileData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); 

  const getFullUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
  };

  const avatarUrl = getFullUrl(profileData?.avatar);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="w-80 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-white overflow-hidden sticky top-6 z-10 hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] transition-shadow duration-500"
    >
      {/* 1. BANNER - LUXURY MESH GRADIENT */}
      <div className="relative h-24 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-400 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-400 rounded-full blur-2xl opacity-30"></div>
      </div>

      <div className="px-6 pb-6 relative">
        {/* 2. AVATAR - SQUIRCLE STYLE */}
        <div className="relative -mt-12 mb-3 flex justify-center">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }} 
            className="relative p-1 bg-white rounded-3xl shadow-xl"
          >
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-50 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-3xl font-black text-blue-600">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                profileData?.fullName ? profileData.fullName.charAt(0).toUpperCase() : <User size={32}/>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl border-2 border-white shadow-sm">
              <ShieldCheck size={12} />
            </div>
          </motion.div>
        </div>

        {/* 3. THÔNG TIN CHÍNH */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
            {profileData?.fullName || "Đang tải..."}
          </h2>
          <p className="text-blue-600 text-xs font-bold mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
             {profileData?.jobTitle || "Ứng viên tiềm năng"}
          </p>
        </div>

        {/* 4. THÔNG TIN LIÊN HỆ - GLASSY CARDS */}
        <div className="grid grid-cols-1 gap-2.5 mb-6">
          <div className="bg-slate-50/70 backdrop-blur-sm p-3 rounded-xl border border-slate-100/80 flex items-center gap-3 hover:bg-white hover:shadow-sm hover:border-blue-100 transition-all cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-sm shadow-blue-500/10">
              <Mail size={14} />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
              <p className="text-xs font-bold text-slate-700 truncate">{profileData?.email || "Chưa cập nhật"}</p>
            </div>
          </div>
          
          <div className="bg-slate-50/70 backdrop-blur-sm p-3 rounded-xl border border-slate-100/80 flex items-center gap-3 hover:bg-white hover:shadow-sm hover:border-emerald-100 transition-all cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-500/10">
              <Phone size={14} />
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Số điện thoại</p>
              <p className="text-xs font-bold text-slate-700 truncate">{profileData?.phoneNumber || "Chưa cập nhật"}</p>
            </div>
          </div>
        </div>

        {/* 5. HÀNH ĐỘNG - PREMIUM BUTTONS */}
        <div className="space-y-2.5">
          <Link to="/candidate/ai-optimize" className="block relative group overflow-hidden rounded-xl">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white font-bold text-xs flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-indigo-900/20 transition-all"
            >
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              Tối ưu CV bằng AI
            </motion.div>
            {/* Shimmer Effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </Link>

          <Link to="/candidate/profile" className="block">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-white text-blue-600 border border-blue-100 rounded-xl font-bold text-xs flex justify-center items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
            >
              <UserCog size={14} />
              Cập nhật thông tin
              <ArrowUpRight size={12} className="opacity-50" />
            </motion.div>
          </Link>

          <Link to="/candidate/upload-cv" className="block">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs flex justify-center items-center gap-2 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
            >
              <Library size={14} className="text-blue-500" />
              Kho hồ sơ cá nhân
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;