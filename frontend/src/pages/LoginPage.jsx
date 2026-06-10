import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Mail, Lock, ArrowRight, ShieldAlert, Sparkles, Ban } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // MỚI: State để hiển thị lỗi và trạng thái khóa ngay trên UI
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLocked(false);
    
    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        email: email,
        password: password
      });

      const { role, fullName, userId, status } = response.data;

      // 🛑 KIỂM TRA KHÓA TỪ BACKEND (Dự phòng nếu Backend trả về 200 nhưng status là Bị khóa)
      if (status === 'Bị khóa' || status === 'LOCKED') {
        setIsLocked(true);
        setErrorMsg('Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ bộ phận hỗ trợ!');
        return; // Dừng lại, KHÔNG lưu localStorage và KHÔNG chuyển trang
      }

      // 🛡️ Bước QUAN TRọNG: Chỉ xóa sessionStorage của tab hiện tại, KHÔNG xóa localStorage (dùng chung)
      sessionStorage.clear();

      // ✅ Lưu vào sessionStorage (riêng từng tab - ĐỘC LẬP)
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userName', fullName);
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('userAccount', JSON.stringify({ userId, role, fullName }));

      // ✅ Lưu vào localStorage chỉ để làm backup cho tab mới mở (không clear để không ảnh hưởng tab khác)
      localStorage.setItem('lastLogin_isLoggedIn', 'true');
      localStorage.setItem('lastLogin_userRole', role);
      localStorage.setItem('lastLogin_userName', fullName);
      localStorage.setItem('lastLogin_userId', userId);
      localStorage.setItem('lastLogin_userAccount', JSON.stringify({ userId, role, fullName }));

      
      // Điều hướng dựa trên Role
      if (role === 'admin') navigate('/admin');
      else if (role === 'ntd') navigate('/employer');
      else navigate('/candidate');

    } catch (error) {
      console.error("Login Error:", error);
      // Lấy câu lỗi từ Backend (hoặc dùng text mặc định)
      const message = error.response?.data?.message || error.response?.data || 'Tài khoản hoặc mật khẩu không chính xác!';
      
      // MỚI: Nhận diện lỗi Khóa tài khoản từ câu báo lỗi của Backend
      if (typeof message === 'string' && message.toLowerCase().includes('khóa')) {
        setIsLocked(true);
        setErrorMsg(message);
      } else {
        setIsLocked(false);
        setErrorMsg(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-blue-100 selection:text-blue-600">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-300/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] overflow-hidden relative z-10"
      >
        <div className="p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }} 
              className="flex justify-center items-center gap-3 mb-6"
            >
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
                <Rocket className="text-white" size={28} />
              </div>
              <span className="font-black text-4xl text-slate-900 tracking-tighter italic">JOB.AI</span>
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mừng bạn quay lại!</h2>
            <p className="text-slate-500 mt-2 font-medium">Đăng nhập để tiếp tục hành trình sự nghiệp</p>
          </div>

          {/* HIỂN THỊ THÔNG BÁO LỖI HOẶC KHÓA TÀI KHOẢN (Animation) */}
          <div className="min-h-[70px]">
            <AnimatePresence mode="wait">
              {errorMsg ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className={`mb-6 border-2 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm ${
                    isLocked ? 'bg-rose-50/80 border-rose-200' : 'bg-red-50/80 border-red-200'
                  }`}
                >
                  {isLocked ? <Ban size={20} className="text-rose-600 shrink-0 mt-0.5" /> : <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />}
                  <div className="text-sm">
                    <p className={`font-black uppercase tracking-widest text-[10px] mb-1 ${isLocked ? 'text-rose-900' : 'text-red-900'}`}>
                      {isLocked ? 'TÀI KHOẢN BỊ ĐÌNH CHỈ' : 'LỖI ĐĂNG NHẬP'}
                    </p>
                    <p className={`${isLocked ? 'text-rose-800' : 'text-red-800'} font-medium italic leading-relaxed`}>
                      {errorMsg}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="mb-8 bg-amber-50/80 border-2 border-amber-100 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm"
                >
                  <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-black text-amber-900 uppercase tracking-widest text-[10px] mb-1">Tài khoản Hệ Thống</p>
                    <p className="text-amber-800 font-medium italic">Vui lòng sử dụng tài khoản đã đăng ký trên SQL Server.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Địa chỉ Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="email" required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" 
                  placeholder="name@company.com" 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                <Link to="#" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="password" required 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" 
                  placeholder="••••••••" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} 
              type="submit" 
              className="group w-full py-4 mt-4 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles size={18} className="text-blue-300 group-hover:text-white transition-colors" />
              ĐĂNG NHẬP NGAY
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </form>

          {/* Footer Link */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} 
            className="mt-10 pt-8 border-t border-slate-100 text-center"
          >
            <p className="text-slate-500 font-medium text-sm">
              Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-black hover:underline transition-all">Đăng ký ngay</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;