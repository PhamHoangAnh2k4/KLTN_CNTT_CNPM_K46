import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, User, Mail, Lock, Building2, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios'; // 1. Import axios

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'candidate';
  const [role, setRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole && (urlRole === 'candidate' || urlRole === 'employer')) {
      setRole(urlRole);
    }
  }, [searchParams]);

  // 2. LOGIC ĐĂNG KÝ GỬI LÊN BACKEND
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Ánh xạ role từ giao diện sang Role của CSDL SQL Server
    const dbRole = role === 'candidate' ? 'ung_vien' : 'ntd';

    try {
      await axios.post('http://localhost:8081/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        passwordHash: formData.password, // Tên biến khớp với Entity Backend
        role: dbRole
      });

      alert(`Đăng ký thành công tài khoản ${role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}!`);
      navigate('/login'); // Đăng ký xong cho sang trang Login

    } catch (error) {
      alert("Lỗi đăng ký: " + (error.response?.data || "Email đã tồn tại hoặc server lỗi!"));
    }
  };

  return (
    // ... GIỮ NGUYÊN TOÀN BỘ PHẦN RETURN (JSX/CSS) CỦA BẠN ...
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-blue-100 selection:text-blue-600">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl shadow-blue-900/5 rounded-[2.5rem] overflow-hidden relative z-10"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center items-center gap-3 mb-4">
              <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg shadow-slate-200"><Rocket className="text-white" size={28} /></div>
              <span className="font-black text-3xl text-slate-900 tracking-tighter italic">JOB.AI</span>
            </motion.div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Cùng AI xây dựng tương lai của bạn</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/50 backdrop-blur-sm">
            <button type="button" onClick={() => setRole('candidate')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${role === 'candidate' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}><User size={16} /> Ứng viên</button>
            <button type="button" onClick={() => setRole('employer')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${role === 'employer' ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}><Building2 size={16} /> Tuyển dụng</button>
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${role === 'candidate' ? 'translate-x-0' : 'translate-x-[calc(100%+6px)]'}`}></div>
          </motion.div>

          <form onSubmit={handleRegister} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Họ và Tên</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input type="text" required className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="Nguyễn Văn A" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Địa chỉ Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input type="email" required className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="name@company.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input type="password" required className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner" placeholder="••••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} type="submit" className="group w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95">
              <Sparkles size={18} className="text-blue-200 group-hover:text-white transition-colors" />
              ĐĂNG KÝ MIỄN PHÍ
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">Đã có tài khoản? <Link to="/login" className="text-slate-900 font-black hover:text-blue-600 hover:underline transition-all">Đăng nhập ngay</Link></p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;