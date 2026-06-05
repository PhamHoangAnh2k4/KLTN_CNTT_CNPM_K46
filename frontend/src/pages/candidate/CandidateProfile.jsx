'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Mail, Phone, Briefcase, Save, Upload, 
  Camera, X, CheckCircle2, Image as ImageIcon, Loader2,
  Sparkles, ShieldCheck, Zap, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// COMPONENT REUSABLE: Input chuẩn Luxury với hiệu ứng Float nội bộ (không cắt viền)
const PremiumFloatingInput = ({ icon: Icon, label, name, value, onChange, type = "text", readOnly = false }) => (
  <div className="relative group">
    <input 
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      readOnly={readOnly}
      placeholder=" " 
      className={`peer w-full pl-12 pr-4 pt-6 pb-2 bg-white border border-slate-100 rounded-2xl outline-none transition-all text-slate-800 font-bold text-sm shadow-sm
        ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50/50' : 'focus:border-blue-500 focus:shadow-[0_10px_20px_-5px_rgba(0,0,0,0.03)] group-hover:border-slate-200'}`} 
    />
    <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400 peer-focus:text-blue-600 transition-colors z-10">
      <Icon size={16} />
    </div>
    <span className="absolute left-12 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none transition-all duration-300
      peer-[&:not(:placeholder-shown)]:top-3 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-blue-600 peer-[&:not(:placeholder-shown)]:uppercase peer-[&:not(:placeholder-shown)]:tracking-wider
      peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-blue-600 peer-focus:uppercase peer-focus:tracking-wider"
    >
      {label}
    </span>
  </div>
);

const CandidateProfile = () => {
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:8081";
  
  // 🛡️ CHIẾN THUẬT ĐỒNG BỘ TAB
  const getSessionUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    return JSON.parse(localStorage.getItem('lastLogin_userAccount') || '{}');
  };

  const userAccount = getSessionUser();
  const userId = userAccount.userId || null; 

  const [formData, setFormData] = useState({
    fullName: userAccount.fullName || '',
    email: userAccount.email || '',
    jobTitle: '',
    phoneNumber: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [cvFileName, setCvFileName] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/candidate-profiles/${userId}`);
        const data = response.data;
        
        if (data) {
          setFormData({
            fullName: data.fullName || userAccount.fullName || '',
            email: data.email || userAccount.email || '',
            jobTitle: data.jobTitle || '',
            phoneNumber: data.phoneNumber || ''
          });
          
          if (data.avatar) {
            const avatarPath = data.avatar.startsWith('http') ? data.avatar : `${API_BASE_URL}${data.avatar}`;
            setAvatarPreview(avatarPath);
          }
          
          if (data.cvFile) {
            setCvFileName(data.cvFile.split('/').pop());
          }
        }
      } catch (error) {
        console.error("Lỗi tải thông tin hồ sơ:", error);
      }
    };
    fetchProfile();
  }, [userId, userAccount.fullName, userAccount.email]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ảnh đại diện không được quá 2MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File CV không được quá 5MB");
        return;
      }
      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Lỗi xác thực người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setIsLoading(true);

    const submitData = new FormData();
    submitData.append('fullName', formData.fullName || '');
    submitData.append('jobTitle', formData.jobTitle || '');
    submitData.append('phoneNumber', formData.phoneNumber || '');
    
    if (avatarFile) submitData.append('avatarFile', avatarFile);
    if (cvFile) submitData.append('cvFile', cvFile);

    try {
      await axios.post(`${API_BASE_URL}/api/candidate-profiles/${userId}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Đã lưu hồ sơ thành công!');
      
      const acc = JSON.parse(localStorage.getItem('userAccount') || sessionStorage.getItem('userAccount') || '{}');
      if (acc.userId) {
        acc.fullName = formData.fullName;
        if (localStorage.getItem('userAccount')) localStorage.setItem('userAccount', JSON.stringify(acc));
        if (sessionStorage.getItem('userAccount')) sessionStorage.setItem('userAccount', JSON.stringify(acc));
        if (localStorage.getItem('userName')) localStorage.setItem('userName', formData.fullName);
        if (sessionStorage.getItem('userName')) sessionStorage.setItem('userName', formData.fullName);
      }
      
      window.dispatchEvent(new Event('authChange'));
      navigate('/candidate'); 
    } catch (error) {
      console.error("Lỗi lưu thông tin:", error);
      alert("Lỗi: " + (error.response?.data || "Không thể kết nối đến máy chủ."));
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 md:px-6 font-sans relative overflow-hidden">
      
      {/* Background Orbs chuyển động */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/10 filter blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-400/10 filter blur-[100px] pointer-events-none"
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto relative z-10"
      >
        {/* Nút quay lại với hiệu ứng hover */}
        <motion.button 
          variants={itemVariants}
          onClick={() => navigate(-1)} 
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors group"
        >
          <X size={16} className="group-hover:rotate-90 transition-transform" /> 
          Quay lại trang chủ
        </motion.button>

        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden relative">
          
          {/* Header Cover - Luxury Mesh Dark Gradient */}
          <div className="h-48 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20 -mr-40 -mt-40"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            {/* Ảnh bìa hover button */}
            <button type="button" className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all opacity-0 group-hover:opacity-100 shadow-lg">
              <ImageIcon size={14} /> Đổi ảnh bìa
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
          </div>
          
          <div className="px-8 md:px-12 pb-12 relative">
            
            {/* Avatar & Action Section */}
            <div className="relative flex flex-col md:flex-row md:justify-between md:items-end gap-6 -mt-16 mb-12">
              
              {/* Avatar Squircle với hiệu ứng Hover */}
              <motion.div variants={itemVariants} className="relative group">
                <div className="relative h-32 w-32 bg-white rounded-3xl p-1 shadow-xl cursor-pointer border-4 border-white overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-4xl font-black text-blue-600">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : <User size={40}/>}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Camera size={24} className="animate-pulse" />
                    <span className="text-[10px] font-bold mt-1">Đổi ảnh</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg border-2 border-white pointer-events-none">
                  <Camera size={14} />
                </div>
              </motion.div>
              
              {/* CV Upload với hiệu ứng Hover Lift */}
              <motion.div variants={itemVariants} className="flex flex-col md:items-end gap-3">
                {cvFileName && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={12} className="text-emerald-500" /> CV: {cvFileName}
                  </span>
                )}
                <label className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20 px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md hover:-translate-y-0.5">
                  <Upload size={14} strokeWidth={2.5} /> 
                  {cvFileName ? 'CẬP NHẬT CV MỚI' : 'TẢI LÊN CV (PDF)'}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </label>
              </motion.div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section Title */}
              <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Thông tin cá nhân</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Cập nhật thông tin cơ bản của bạn</p>
                </div>
              </motion.div>
              
              {/* Grid Inputs với Stagger Animation */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <PremiumFloatingInput icon={User} label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} />
                <PremiumFloatingInput icon={Mail} label="Địa chỉ Email" name="email" value={formData.email} readOnly={true} />
                <PremiumFloatingInput icon={Briefcase} label="Vị trí chuyên môn" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                <PremiumFloatingInput icon={Phone} label="Số điện thoại" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="tel" />
              </motion.div>

              {/* Actions với hiệu ứng bấm */}
              <motion.div variants={itemVariants} className="pt-6 flex flex-col-reverse md:flex-row justify-end gap-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="button" 
                  onClick={() => navigate(-1)} 
                  className="w-full md:w-auto bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 px-8 py-3.5 rounded-xl font-bold text-xs transition-all tracking-wider"
                >
                  HỦY BỎ
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20 px-10 py-3.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 disabled:opacity-70 tracking-wider shadow-md"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.5} />} 
                  {isLoading ? 'ĐANG LƯU...' : 'LƯU HỒ SƠ'}
                </motion.button>
              </motion.div>
              
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CandidateProfile;