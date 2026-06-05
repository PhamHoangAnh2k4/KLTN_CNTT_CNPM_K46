'use client';

import React, { useState } from 'react';
import { 
  X, MapPin, DollarSign, Briefcase, GraduationCap, 
  Send, FileText, CheckCircle2, Tags, Image as ImageIcon,
  Map, FileArchive, FileIcon, Download, Users, Sparkles,
  Play, Maximize2, Zap, Clock, Building2, AlertTriangle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Hàm kiểm tra định dạng video
const isVideo = (url) => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/i) || url.includes('/videos/');
};

// Hàm hỗ trợ nhận diện loại file
const getFileIcon = (fileName) => {
  if (!fileName) return <FileIcon size={20} className="text-slate-500" />;
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('.zip') || lowerName.includes('.rar')) return <FileArchive size={20} className="text-amber-500" />;
  if (lowerName.includes('.doc') || lowerName.includes('.docx')) return <FileText size={20} className="text-blue-500" />;
  if (lowerName.includes('.pdf')) return <FileText size={20} className="text-red-500" />;
  return <FileIcon size={20} className="text-slate-500" />;
};

const JobDetailModal = ({ job, onClose, onApply }) => {
  // State Báo cáo
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!job) return null;

  // ==========================================
  // XỬ LÝ CHUẨN HÓA DỮ LIỆU TỪ DATABASE
  // ==========================================

  // 1. Chuẩn hóa Hình ảnh/Video
  let parsedMedia = [];
  const rawMedia = job.bannerUrl || job.images || "";
  if (typeof rawMedia === 'string' && rawMedia !== 'null') {
    parsedMedia = rawMedia.split(',').filter(Boolean).map(url => url.trim());
  } else if (Array.isArray(rawMedia)) {
    parsedMedia = rawMedia.map(img => typeof img === 'object' ? (img.url || img.fileUrl || img.path) : img).filter(Boolean);
  }

  // 2. Chuẩn hóa File đính kèm
  let parsedFiles = [];
  if (job.documentUrl && job.documentUrl !== 'null') {
    parsedFiles.push({
      name: job.documentName || job.documentUrl.split('/').pop() || 'Tài liệu đính kèm',
      url: job.documentUrl
    });
  } else {
    const rawFiles = job.attachments || job.documents || [];
    if (Array.isArray(rawFiles)) {
      parsedFiles = rawFiles.map(file => {
        if (typeof file === 'object') {
          const finalName = file.documentName || file.name || file.url?.split('/').pop() || 'Tài liệu đính kèm';
          return { name: finalName, url: file.url || file.fileUrl || file.path };
        }
        return { name: file.split('/').pop(), url: file };
      });
    } else if (typeof rawFiles === 'string') {
      parsedFiles = rawFiles.split(',').map(url => ({ name: url.split('/').pop(), url: url.trim() }));
    }
  }
  parsedFiles = parsedFiles.filter(file => file.url);

  // 3. Chuẩn hóa Kỹ năng
  let parsedSkills = [];
  if (Array.isArray(job.skills)) {
    parsedSkills = job.skills;
  } else if (typeof job.skills === 'string') {
    parsedSkills = job.skills.split(',');
  }
  parsedSkills = parsedSkills.filter(Boolean).map(s => s.trim());

  // 4. Chuẩn hóa text mô tả
  const finalDescription = job.description || job.jobDescription;
  const finalRequirements = job.requirements || job.otherRequirements;

  // Lấy thông tin user
  const getActiveUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
    return localUser ? JSON.parse(localUser) : null;
  };

  const reportReasons = [
    { id: "Tin giả mạo / Lừa đảo", label: "Tin giả mạo / Lừa đảo", icon: "🚨" },
    { id: "Yêu cầu đóng phí để phỏng vấn/làm việc", label: "Yêu cầu đóng phí để phỏng vấn/làm việc", icon: "💰" },
    { id: "Thông tin công việc không chính xác", label: "Thông tin công việc không chính xác", icon: "🚫" },
    { id: "Ngôn từ, hình ảnh phản cảm", label: "Ngôn từ, hình ảnh phản cảm", icon: "🔞" },
    { id: "Đa cấp / Spam", label: "Đa cấp / Spam", icon: "🗑️" },
    { id: "Khác", label: "Khác", icon: "ℹ️" }
  ];

  const submitReport = async () => {
    if (!reportReason) return;
    setIsSubmittingReport(true);

    const activeUser = getActiveUser() || {};
    const userId = activeUser?.userId || activeUser?.id || 1;
    const userName = activeUser?.fullName || activeUser?.name || 'Ứng viên';

    try {
      await axios.post('http://localhost:8081/api/reports/add', {
        userId: userId,
        userName: userName,
        reason: reportReason, 
        details: reportDetail,
        targetType: 'JOB_POST', 
        targetId: job.id,
        targetName: `Tin tuyển dụng: ${job.title}` 
      });

      setIsSubmittingReport(false);
      setReportModal({ isOpen: false });
      setReportReason('');
      setReportDetail('');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Lỗi khi gửi báo cáo job:", error);
      alert("❌ Có lỗi xảy ra. Không thể gửi báo cáo lúc này.");
      setIsSubmittingReport(false);
    }
  };

  // Animation Variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: { 
      opacity: 1, scale: 1, y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.2 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-[#F8FAFC] rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút Đóng */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 p-2.5 rounded-full transition-all shadow-lg"
          >
            <X size={16} />
          </button>

          {/* Header - Banner Style Luxury */}
          <div className="h-44 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 relative shrink-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20 -mr-40 -mt-40"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F8FAFC] to-transparent"></div>
          </div>

          {/* Nội Dung (Gồm 2 cột: Main & Sidebar) */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 -mt-16 z-10">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* CỘT TRÁI: THÔNG TIN CHÍNH (Chiếm 2/3) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Card Tiêu đề & Logo */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80">
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-extrabold text-2xl shadow-sm shrink-0 overflow-hidden">
                      {job.logoUrl ? (
                        <img src={job.logoUrl.startsWith('http') ? job.logoUrl : `http://localhost:8081${job.logoUrl}`} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        job.companyName?.substring(0, 2).toUpperCase() || job.company?.substring(0, 2).toUpperCase() || 'JA'
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Tin nổi bật</span>
                        <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Tuyển gấp</span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">{job.title}</h2>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        {job.companyName || job.company}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Card Mô tả & Yêu cầu */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 space-y-6">
                  {/* Mô tả */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                        <Sparkles size={14} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Mô tả công việc</h3>
                    </div>
                    <div className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-wrap pl-1">
                      {finalDescription || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                    </div>
                  </div>

                  {/* Yêu cầu */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                      <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                        <Zap size={14} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Yêu cầu ứng viên</h3>
                    </div>
                    <div className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-wrap pl-1">
                      {finalRequirements || <span className="italic text-slate-400">Không có yêu cầu cụ thể.</span>}
                    </div>
                  </div>
                </motion.div>

                {/* Card Media đính kèm */}
                {parsedMedia.length > 0 && (
                  <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <ImageIcon size={16} className="text-blue-500" /> Hình ảnh & Video
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                      {parsedMedia.map((url, idx) => {
                        const fullUrl = url.startsWith('http') ? url : `http://localhost:8081${url}`;
                        return isVideo(url) ? (
                          <div key={idx} className="relative h-40 min-w-[240px] rounded-2xl overflow-hidden border border-slate-100 snap-center shadow-sm bg-slate-900 group cursor-pointer">
                            <video src={fullUrl} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white shadow-lg transform group-hover:scale-110 transition-transform">
                                <Play fill="white" size={20} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className="relative h-40 min-w-[240px] rounded-2xl overflow-hidden border border-slate-100 snap-center shadow-sm cursor-zoom-in group">
                            <img src={fullUrl} alt={`Media ${idx}`} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02] duration-500" />
                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Maximize2 size={12} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Card Vị trí Bản đồ */}
                {(job.location || job.workLocation) && (
                  <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <Map size={16} className="text-emerald-500" /> Vị trí làm việc
                    </h3>
                    <div className="w-full h-56 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <iframe
                        title="Google Maps Location"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(job.location || job.workLocation)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* CỘT PHẢI: SIDEBAR (Chiếm 1/3) */}
              <div className="space-y-6">
                
                {/* Card Thông tin nhanh */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wider">Thông tin nhanh</h3>
                  
                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mức lương</p>
                      <p className="text-slate-800 font-bold">{job.salary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Địa điểm</p>
                      <p className="text-slate-800 font-bold">{job.location || job.workLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Hình thức</p>
                      <p className="text-slate-800 font-bold">{job.jobType || job.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Kinh nghiệm</p>
                      <p className="text-slate-800 font-bold">{job.experience}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Card Kỹ năng */}
                {parsedSkills.length > 0 && (
                  <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Kỹ năng</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1.5 bg-slate-50 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Card Tài liệu đính kèm */}
                {parsedFiles.length > 0 && (
                  <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider">Tài liệu</h3>
                    <div className="space-y-3">
                      {parsedFiles.map((file, idx) => (
                        <a 
                          key={idx}
                          href={file.url.startsWith('http') ? file.url : `http://localhost:8081${file.url}`} 
                          target="_blank" rel="noreferrer" download
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                        >
                          <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-blue-50 transition-colors">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                              {file.name}
                            </p>
                          </div>
                          <Download size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          </div>

          {/* FOOTER - Nút bấm nổi bật */}
          <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20">
            <div className="hidden sm:block">
              <p 
                onClick={() => setReportModal({ isOpen: true })}
                className="text-xs text-slate-400 font-bold uppercase tracking-wider cursor-pointer hover:text-rose-500 transition-colors"
              >
                Báo cáo tin tuyển dụng
              </p>
            </div>
            
            <div className="w-full sm:w-auto">
              {job.applicationStatus === 'passed' ? (
                <div className="px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-default shadow-sm uppercase tracking-wider">
                  <CheckCircle2 size={14} /> Đã Trúng Tuyển
                </div>
              ) : job.applicationStatus === 'rejected' ? (
                <div className="px-6 py-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-default shadow-sm uppercase tracking-wider">
                  <X size={14} /> Rớt Phỏng Vấn
                </div>
              ) : job.applicationStatus === 'interviewing' ? (
                <div className="px-6 py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-default shadow-sm uppercase tracking-wider">
                  <Users size={14} /> Đang Phỏng Vấn
                </div>
              ) : job.isApplied ? (
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onApply(job.id)}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-rose-600 rounded-xl flex items-center justify-center gap-2 font-bold text-xs border border-rose-200 hover:bg-rose-50 transition-all shadow-sm uppercase tracking-wider"
                >
                  <X size={14} className="text-rose-500" /> Hủy ứng tuyển
                </motion.button>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onApply(job.id)}
                  className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all uppercase tracking-wider"
                >
                  <Send size={14} /> ỨNG TUYỂN NGAY
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {reportModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReportModal({ isOpen: false })}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-50 border-b border-red-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2.5 bg-red-100 rounded-xl">
                    <AlertTriangle size={20} className="fill-red-100" />
                  </div>
                  <h3 className="font-black uppercase tracking-wider text-sm">Báo cáo vi phạm</h3>
                </div>
                <button onClick={() => setReportModal({ isOpen: false })} className="text-red-400 hover:bg-red-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Lý do báo cáo</p>
                <div className="space-y-2 mb-6">
                  {reportReasons.map(reason => (
                    <div 
                      key={reason.id} onClick={() => setReportReason(reason.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        reportReason === reason.id ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xl">{reason.icon}</div>
                      <span className={`font-bold text-xs uppercase tracking-wider ${reportReason === reason.id ? 'text-red-700' : 'text-slate-700'}`}>{reason.label}</span>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${reportReason === reason.id ? 'border-red-500' : 'border-slate-300'}`}>
                        {reportReason === reason.id && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Info size={14} className="text-slate-400" /> Chi tiết bổ sung (Tùy chọn)
                  </label>
                  <textarea 
                    rows="2" value={reportDetail} onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="Mô tả cụ thể hơn vấn đề..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-300 transition-all resize-none placeholder:font-medium placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
                <button onClick={() => setReportModal({ isOpen: false })} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors uppercase tracking-wider">Hủy bỏ</button>
                <button onClick={submitReport} disabled={!reportReason || isSubmittingReport} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-red-500/20 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                  {isSubmittingReport ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Gửi báo cáo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST THÔNG BÁO */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[210] bg-slate-800 text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-slate-700"
          >
            <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
            <span className="font-bold text-xs uppercase tracking-wider">Báo cáo đã được ghi nhận thành công!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default JobDetailModal;