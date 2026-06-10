'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BrainCircuit, Flag, MapPin, Briefcase,
  CheckCircle2, Send, Sparkles, Zap, X, Users,
  Loader2, Building2, Globe, Info,
  AlertTriangle, Star, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const SuggestedJobsTab = ({ jobs, onViewDetail, toggleApplyJob, onApplyClick, handleReportJob }) => {
  // --- STATE MODAL THÔNG TIN CÔNG TY ---
  const [isEmployerModalOpen, setIsEmployerModalOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  // --- STATE BÁO CÁO TIN TUYỂN DỤNG ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [jobToReport, setJobToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Danh sách lý do báo cáo với Icon Luxury
  const reportReasonsList = [
    { id: "Tin giả mạo / Lừa đảo", label: "Tin giả mạo / Lừa đảo", icon: "🚨" },
    { id: "Yêu cầu đóng phí để phỏng vấn/làm việc", label: "Yêu cầu đóng phí để phỏng vấn/làm việc", icon: "💰" },
    { id: "Thông tin công việc không chính xác", label: "Thông tin công việc không chính xác", icon: "🚫" },
    { id: "Ngôn từ, hình ảnh phản cảm", label: "Ngôn từ, hình ảnh phản cảm", icon: "🔞" },
    { id: "Đa cấp / Spam", label: "Đa cấp / Spam", icon: "🗑️" },
    { id: "Khác", label: "Khác", icon: "ℹ️" }
  ];

  // --- STATE QUẢN LÝ DANH SÁCH JOB NỘI BỘ ---
  const [localJobs, setLocalJobs] = useState([]);

  const getSessionUser = () => {
    const session = sessionStorage.getItem('userAccount') || localStorage.getItem('userAccount');
    return session ? JSON.parse(session) : {};
  };
  const userId = getSessionUser().userId;
  const userName = getSessionUser().fullName || "Một ứng viên";

  // --- FETCH DATA TỪ DATABASE ---
  useEffect(() => {
    const fetchData = async () => {
      if (!jobs || jobs.length === 0) {
        setLocalJobs([]);
        return;
      }

      try {
        const activeJobs = jobs.filter(job => job.status === 'Đang hiển thị');

        let appliedData = [];
        if (userId) {
          const response = await axios.get(`http://localhost:8081/api/applications/user/${userId}/applied-jobs`);
          appliedData = response.data;
        }

        const mergedJobs = await Promise.all(activeJobs.map(async (job) => {
          const appliedInfo = appliedData.find(app => app.id === job.id || app.jobId === job.id);
          const empId = job.employerId || job.userId;

          let fetchedCompanyName = job.companyName || "Chưa xác định";
          let fetchedCompanyLogo = job.companyLogo || null;
          let fetchedProfile = null;

          if (empId) {
            try {
              const profileRes = await axios.get(`http://localhost:8081/api/employer-profiles/${empId}`);
              if (profileRes.data) {
                fetchedProfile = profileRes.data;
                if (profileRes.data.companyName) {
                  fetchedCompanyName = profileRes.data.companyName;
                  fetchedCompanyLogo = profileRes.data.companyLogo;
                }
              }
            } catch (err) {
              // Lỗi lấy profile cho ID
            }
          }

          return {
            ...job,
            isApplied: !!appliedInfo,
            applicationStatus: appliedInfo ? appliedInfo.status : null,
            interviewPreference: appliedInfo ? appliedInfo.interviewPreference : null,
            interviewPreferenceOverride: appliedInfo ? appliedInfo.interviewPreferenceOverride : null,
            companyName: fetchedCompanyName,
            companyLogo: fetchedCompanyLogo,
            employerProfile: fetchedProfile
          };
        }));

        // Sắp xếp tin tuyển dụng mới nhất lên đầu
        const sortedMergedJobs = [...mergedJobs].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : null;
          const dateB = b.createdAt ? new Date(b.createdAt) : null;
          if (dateA && dateB) return dateB - dateA;
          const idA = a.jobId || a.id || 0;
          const idB = b.jobId || b.id || 0;
          return idB - idA;
        });

        setLocalJobs(sortedMergedJobs);
      } catch (error) {
        console.error("Lỗi tổng quát khi fetch data:", error);
        const fallbackJobs = jobs.filter(job => job.status === 'Đang hiển thị').sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : null;
          const dateB = b.createdAt ? new Date(b.createdAt) : null;
          if (dateA && dateB) return dateB - dateA;
          const idA = a.jobId || a.id || 0;
          const idB = b.jobId || b.id || 0;
          return idB - idA;
        });
        setLocalJobs(fallbackJobs);
      }
    };

    fetchData();
  }, [jobs, userId]);

  // --- HÀM MỞ MODAL XEM NHANH THÔNG TIN CÔNG TY ---
  const handleOpenEmployerModal = (profile, e) => {
    e.stopPropagation();
    if (!profile || !profile.companyName) {
      alert("Thông tin chi tiết của công ty này đang được cập nhật!");
      return;
    }
    setSelectedEmployer(profile);
    setIsEmployerModalOpen(true);
  };



  // --- CẬP NHẬT HÌNH THỨC PHỎNG VẤN MONG MUỐN ---
  const handleUpdateInterviewPreference = async (jobId, preference, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`http://localhost:8081/api/applications/update-interview-preference`, {
        jobId: jobId,
        userId: userId,
        interviewPreference: preference
      });
      setLocalJobs(prev => prev.map(j => 
        (j.id === jobId || j.jobId === jobId) ? { ...j, interviewPreference: preference } : j
      ));
      alert("✅ Đã ghi nhận hình thức phỏng vấn mong muốn của bạn!");
    } catch (error) {
      console.error("Lỗi cập nhật hình thức phỏng vấn:", error);
      alert("❌ Lỗi: " + (error.response?.data?.error || error.message));
    }
  };

  // --- HỦY ỨNG TUYỂN ---
  const handleCancelApply = async (jobId, e) => {
    e.stopPropagation();

    const jobToCancel = localJobs.find(j => j.id === jobId);

    setLocalJobs(prev => prev.map(j =>
      j.id === jobId
        ? { ...j, isApplied: false, applicationStatus: null }
        : j
    ));

    toggleApplyJob(jobId, null);

    if (jobToCancel) {
      try {
        const companyName = jobToCancel.companyName || 'Công ty';
        await axios.post('http://localhost:8081/api/notifications/add', {
          userId: userId,
          title: "Đã hủy ứng tuyển",
          message: `Bạn đã hủy ứng tuyển bài đăng [${jobToCancel.title}] của [${companyName}]`,
          type: "action",
          link: `/job-detail/${jobToCancel.id}`
        });
      } catch (error) {
        console.error("Lỗi khi gửi thông báo hủy:", error);
      }
    }
  };

  // --- MỞ MODAL BÁO CÁO ---
  const handleOpenReportModal = (job, e) => {
    e.stopPropagation();
    setJobToReport(job);
    setReportReason('');
    setReportDetails('');
    setIsReportModalOpen(true);
  };

  // --- XỬ LÝ GỬI BÁO CÁO ---
  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert("Vui lòng chọn lý do báo cáo!");
      return;
    }

    setIsSubmittingReport(true);

    try {
      await axios.post('http://localhost:8081/api/reports/add', {
        userId: userId,
        userName: userName,
        reason: reportReason,
        details: reportDetails,
        targetType: 'JOB',
        targetId: jobToReport.id || jobToReport.jobId,
        targetName: jobToReport.title || 'Tin tuyển dụng ẩn danh'
      });

      if (handleReportJob) {
        handleReportJob(jobToReport.companyName || jobToReport.title, reportReason, reportDetails);
      }

      await axios.post('http://localhost:8081/api/notifications/add', {
        userId: userId,
        title: "Báo cáo thành công",
        message: `Cảm ơn bạn đã báo cáo. Ban quản trị sẽ kiểm tra doanh nghiệp [${jobToReport.companyName || jobToReport.title}] ngay lập tức!`,
        type: "success"
      });

      setIsSubmittingReport(false);
      setIsReportModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Lỗi khi gửi báo cáo:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
      setIsSubmittingReport(false);
    }
  };

  if (!localJobs || localJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-xl rounded-3xl border border-dashed border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
          <Briefcase size={32} />
        </div>
        <p className="text-slate-600 font-bold text-lg">Hiện chưa có công việc nào phù hợp.</p>
        <p className="text-slate-400 text-sm mt-1">Hãy cập nhật hồ sơ để AI gợi ý tốt hơn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans relative">

      {/* Banner AI - Phong cách Luxury & Business */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 sm:p-10 text-white shadow-xl shadow-blue-950/10"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner">
              <BrainCircuit size={36} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-2">
                Đề xuất từ Trí Tuệ Nhân Tạo <Sparkles size={24} className="text-amber-300 animate-pulse" />
              </h2>
              <p className="text-blue-100/80 font-medium mt-1">
                Thuật toán đã phân tích và tìm thấy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-black text-2xl mx-1">{localJobs.length}</span> cơ hội vàng cho sự nghiệp của bạn.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -mr-40 -mt-40 blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500 rounded-full -ml-20 -mb-20 blur-3xl opacity-20 pointer-events-none" />
      </motion.div>

      {/* Danh sách Job */}
      <div className="space-y-5">
        {localJobs.map((job, index) => (
          <motion.div
            key={job.id || index}
            onClick={() => onViewDetail(job)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.05)" }}
            className="group bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-100 p-6 transition-all cursor-pointer relative hover:border-blue-200"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex gap-5 items-start flex-1 min-w-0">

                {/* LOGO CÔNG TY */}
                <div
                  onClick={(e) => handleOpenEmployerModal(job.employerProfile, e)}
                  className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-black text-xl shadow-sm overflow-hidden relative cursor-pointer hover:scale-105 hover:border-blue-300 hover:shadow-md transition-all z-10"
                  title="Click để xem thông tin công ty"
                >
                  {job.companyLogo ? (
                    <img
                      src={`http://localhost:8081/api/employer-profiles/images/${job.companyLogo.split('/').pop()}`}
                      alt="Logo"
                      className="absolute inset-0 w-full h-full object-cover z-10 bg-white"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="z-0 bg-gradient-to-br from-blue-50 to-indigo-50 w-full h-full flex items-center justify-center">
                      {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors truncate mb-1">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-3">
                    <p className="text-slate-500 text-sm font-semibold flex items-center gap-1.5 hover:text-slate-700 transition-colors" onClick={(e) => handleOpenEmployerModal(job.employerProfile, e)}>
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{job.companyName}</span>
                    </p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                      <MapPin size={14} className="text-slate-400" /> {job.location || "Toàn quốc"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <Star size={14} className="text-emerald-500" /> {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      <Users size={14} className="text-blue-500" /> {job.applyCount || 0} ứng tuyển
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION SIDE */}
              <div className="flex flex-col items-end gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0 justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md shadow-blue-500/10">
                    <Zap size={14} className="fill-current text-amber-300" /> MATCH: {job.matchScore || 0}%
                  </div>
                  <button
                    onClick={(e) => handleOpenReportModal(job, e)}
                    className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    title="Báo cáo bài đăng này"
                  >
                    <Flag size={16} />
                  </button>
                </div>

                {job.isApplied ? (
                  <div className="w-full md:w-auto">
                    {job.applicationStatus === 'passed' ? (
                      <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-default" title="Chúc mừng bạn đã trúng tuyển!">
                        <CheckCircle2 size={16} /> Đã Trúng Tuyển
                      </div>
                    ) : job.applicationStatus === 'rejected' ? (
                      <div className="px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-default" title="Rất tiếc bạn chưa phù hợp ở thời điểm này.">
                        <X size={16} /> Rớt Phỏng Vấn
                      </div>
                    ) : job.applicationStatus === 'interviewing' ? (
                      <div className="px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-default" title="Nhà tuyển dụng đã liên hệ phỏng vấn">
                        <Users size={16} /> Đang Phỏng Vấn
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleCancelApply(job.id, e)}
                        className="w-full md:w-auto px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all group/btn shadow-sm"
                        title="Hồ sơ của bạn đang được duyệt"
                      >
                        <Loader2 size={16} className="group-hover/btn:hidden transition-all animate-spin" />
                        <X size={16} className="hidden group-hover/btn:block transition-all" />
                        <span className="group-hover/btn:hidden">Đang chờ duyệt</span>
                        <span className="hidden group-hover/btn:block">Hủy ứng tuyển</span>
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onApplyClick && onApplyClick(job); }}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Send size={14} /> Ứng tuyển ngay
                  </motion.button>
                )}
              </div>
            </div>

            {/* BẢN TIN PHỎNG VẤN 2 CHIỀU CHO ỨNG VIÊN */}
            {job.isApplied && job.applicationStatus === 'interviewing' && (
              <div 
                className="mx-6 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100/70 text-blue-600 rounded-xl">
                    <Video size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Xác nhận hình thức phỏng vấn</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.interviewPreference 
                        ? `Bạn đã chọn hình thức: ${job.interviewPreference === 'online' ? 'Phỏng vấn Online (Meet)' : 'Phỏng vấn Trực tiếp (Offline)'}`
                        : "Vui lòng chọn hình thức phỏng vấn mong muốn của bạn để nhà tuyển dụng chuẩn bị:"
                      }
                    </p>
                  </div>
                </div>

                {!job.interviewPreference ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleUpdateInterviewPreference(job.id, 'online', e)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
                    >
                      <Video size={14} /> Online (Meet)
                    </button>
                    <button
                      onClick={(e) => handleUpdateInterviewPreference(job.id, 'offline', e)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <MapPin size={14} /> Trực tiếp (Offline)
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 size={14} /> Đã xác nhận ({job.interviewPreference === 'online' ? 'Online' : 'Trực tiếp'})
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {/* ========================================== */}
        {/* MODAL 1: XEM NHANH THÔNG TIN NHÀ TUYỂN DỤNG */}
        {/* ========================================== */}
        {isEmployerModalOpen && selectedEmployer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setIsEmployerModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 h-28 relative">
                <button onClick={() => setIsEmployerModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="px-8 pb-8">
                <div className="flex justify-center -mt-14 mb-4 relative z-10">
                  <div className="w-28 h-28 bg-white rounded-3xl p-1 shadow-xl border-4 border-white">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      {selectedEmployer.companyLogo ? (
                        <img
                          src={`http://localhost:8081/api/employer-profiles/images/${selectedEmployer.companyLogo.split('/').pop()}`}
                          className="w-full h-full object-cover"
                          alt="logo"
                        />
                      ) : (
                        <span className="text-3xl font-black text-blue-600">{selectedEmployer.companyName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">{selectedEmployer.companyName}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit mx-auto px-3 py-1.5 rounded-full border border-emerald-100">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Doanh nghiệp đã xác thực
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500 border border-slate-100"><MapPin size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Trụ sở chính</p>
                      <p className="text-sm font-bold text-slate-700 leading-snug">{selectedEmployer.address || 'Đang cập nhật'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1 text-slate-400">
                        <Users size={14} /> <span className="text-[10px] font-black uppercase">Quy mô</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{selectedEmployer.companySize || 'Đang cập nhật'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1 text-slate-400">
                        <Globe size={14} /> <span className="text-[10px] font-black uppercase">Website</span>
                      </div>
                      {selectedEmployer.website ? (
                        <a href={selectedEmployer.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 truncate block hover:underline">
                          Truy cập Web
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-slate-500">Đang cập nhật</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Info size={14} /> <span className="text-[10px] font-black uppercase">Giới thiệu</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                      {selectedEmployer.description || 'Chưa có thông tin mô tả chi tiết về môi trường và văn hóa công ty.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEmployerModalOpen(false)}
                  className="w-full mt-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {/* ========================================== */}
        {/* MODAL 3: BÁO CÁO TIN TUYỂN DỤNG - LUXURY */}
        {/* ========================================== */}
        {isReportModalOpen && jobToReport && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setIsReportModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-red-50 border-b border-red-100 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 rounded-xl text-red-600">
                    <AlertTriangle size={20} className="fill-red-100" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-wider text-sm text-red-700">Báo cáo bài đăng</h3>
                  </div>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="text-red-400 hover:bg-red-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Tin tuyển dụng bị báo cáo</p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{jobToReport.title}</p>
                  <p className="text-xs text-blue-600 font-bold mt-0.5">{jobToReport.companyName}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do báo cáo (*)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {reportReasonsList.map((reason, idx) => (
                      <div
                        key={idx} onClick={() => setReportReason(reason.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${reportReason === reason.id ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <div className="text-xl">{reason.icon}</div>
                        <span className={`font-bold text-xs uppercase tracking-wider ${reportReason === reason.id ? 'text-red-700' : 'text-slate-700'}`}>
                          {reason.label}
                        </span>
                        <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${reportReason === reason.id ? 'border-red-500' : 'border-slate-300'}`}>
                          {reportReason === reason.id && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chi tiết thêm (Tùy chọn)</label>
                  <textarea
                    rows="2"
                    placeholder="Mô tả cụ thể hơn vấn đề..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-300 transition-all resize-none placeholder:font-medium placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsReportModalOpen(false)} className="px-5 py-3 rounded-xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors uppercase tracking-wider">Hủy bỏ</button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason || isSubmittingReport}
                  className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-red-500/20 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {isSubmittingReport ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                  {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST THÔNG BÁO */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-slate-700"
          >
            <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-400/20" />
            <span className="font-bold text-xs uppercase tracking-wider">Báo cáo đã được ghi nhận thành công!</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SuggestedJobsTab;