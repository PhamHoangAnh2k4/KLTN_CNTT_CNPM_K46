import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Star, Zap, Loader2, Database, FileText,
  Link as LinkIcon, DollarSign, Video, MapPin, CheckCircle2,
  X, Send, AlertTriangle
} from 'lucide-react';
import ProfileCard from '../../pages/candidate/ProfileCard';
import SuggestedJobsTab from '../../pages/candidate/SuggestedJobsTab';
import ReviewsTab from '../../pages/candidate/ReviewsTab';
import CompanyModal from '../../pages/candidate/CompanyModal';
import JobDetailModal from '../../pages/candidate/JobDetailModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const tabContentVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.3 } }
};

const HomeFeed = () => {
  const [activeTab, setActiveTab] = useState('suggested');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);

  // --- STATE CHO MODAL ỨNG TUYỂN ---
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobToApply, setSelectedJobToApply] = useState(null);
  const [cvOption, setCvOption] = useState('repo');
  const [cvList, setCvList] = useState([]);
  const [isLoadingCvs, setIsLoadingCvs] = useState(false);
  const [selectedRepoCv, setSelectedRepoCv] = useState('');
  const [customCvUrl, setCustomCvUrl] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Gross');
  const [salaryError, setSalaryError] = useState('');
  const [interviewPreference, setInterviewPreference] = useState('online');

  // 🛡️ CHIẾN THUẬT ĐỒNG BỘ: Lấy User từ Session
  const getSessionUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);

    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
    return localUser ? JSON.parse(localUser) : {};
  };

  const userAccount = getSessionUser();
  const candidateId = userAccount.role === 'ung_vien' ? userAccount.userId : 'guest_user';

  // 🚀 LẤY DỮ LIỆU TỪ SERVER KHI LOAD TRANG (KHÔNG DÙNG LOCALSTORAGE NỮA)
  useEffect(() => {
    if (userAccount.role && userAccount.role !== 'ung_vien') {
      setIsLoading(false);
      return;
    }

    const fetchAllJobsAndStatus = async () => {
      try {
        setIsLoading(true);

        let allJobs = [];
        let aiSource = 'FALLBACK_ALL_JOBS';

        if (candidateId !== 'guest_user') {
          // ⚡ 1 request duy nhất: jobs + applied status đã gộp trong backend
          try {
            const suggestRes = await axios.get(
              `http://localhost:8081/api/candidate-ai/suggest-jobs/${candidateId}?limit=30`
            );
            allJobs = suggestRes.data.jobs || [];
            aiSource = suggestRes.data.source || 'QDRANT_VECTOR_SEARCH';
          } catch (e) {
            console.warn('⚠️ suggest-jobs failed, fallback:', e.message);
            const jobsRes = await axios.get('http://localhost:8081/api/jobs');
            allJobs = jobsRes.data;
          }
        } else {
          const jobsRes = await axios.get('http://localhost:8081/api/jobs');
          allJobs = jobsRes.data;
        }

        // Mapping — isApplied & applicationStatus đã có trong response từ backend
        const loadedJobs = allJobs.map((job) => ({
          ...job,
          id: job.jobId || job.id,
          logoText: job.title ? job.title.substring(0, 2).toUpperCase() : 'JA',
          matchScore: job.matchScore || 0,
          isApplied: job.isApplied || false,
          applicationStatus: job.applicationStatus || null,
          location: job.workLocation || job.location || "Toàn quốc",
          type: job.jobType || "Full-time",
          applyCount: job.applyCount || 0
        }));

        setJobs(loadedJobs);
      } catch (error) {
        console.error("Lỗi fetch jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllJobsAndStatus();
  }, [candidateId]);

  // --- TĂNG LƯỢT XEM ---
  const handleViewJob = async (job) => {
    setViewingJob(job);
    try {
      await axios.put(`http://localhost:8081/api/jobs/${job.id}/increment-view`);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, viewCount: (j.viewCount || 0) + 1 } : j));
    } catch (err) { console.error(err); }
  };

  // --- MỞ MODAL ỨNG TUYỂN ---
  const handleOpenApplyModal = async (job) => {
    setSelectedJobToApply(job);
    setIsApplyModalOpen(true);
    setCvOption('repo');
    setCustomCvUrl('');
    setExpectedSalary('');
    setSalaryType('Gross');
    setSalaryError('');
    setInterviewPreference('online');

    if (candidateId !== 'guest_user') {
      setIsLoadingCvs(true);
      try {
        const response = await axios.get(`http://localhost:8081/api/candidate-cvs/${candidateId}`);
        setCvList(response.data);
        if (response.data && response.data.length > 0) {
          setSelectedRepoCv(response.data[0].cvFile);
        }
      } catch (error) {
        console.error("Lỗi khi tải kho CV:", error);
      } finally {
        setIsLoadingCvs(false);
      }
    }
  };

  const handleOpenApplyModalFromDetail = (jobId) => {
    setViewingJob(null);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      handleOpenApplyModal(job);
    }
  };

  const handleConfirmApply = async () => {
    // Validate lương nếu công việc có cung cấp mức lương
    if (selectedJobToApply && selectedJobToApply.salary && selectedJobToApply.salary.toLowerCase() !== 'thoả thuận') {
      const match = selectedJobToApply.salary.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const minSal = parseInt(match[1]);
        const maxSal = parseInt(match[2]);
        const expSal = parseInt(expectedSalary);
        if (expectedSalary && (expSal < minSal || expSal > maxSal)) {
          setSalaryError(`Mức lương đề xuất phải nằm trong khoảng ${minSal} - ${maxSal} Triệu`);
          return;
        }
      }
    }
    setSalaryError('');

    const finalCvUrl = cvOption === 'repo' ? selectedRepoCv : customCvUrl;

    // Cập nhật local state jobs trước
    setJobs(prevJobs => prevJobs.map(j =>
      j.id === selectedJobToApply.id
        ? { ...j, isApplied: true, applicationStatus: 'pending' }
        : j
    ));

    toggleApplyJob(selectedJobToApply.id, finalCvUrl, expectedSalary ? parseInt(expectedSalary) * 1000000 : null, salaryType, interviewPreference);
    setIsApplyModalOpen(false);

    try {
      const employerId = selectedJobToApply.userId || selectedJobToApply.employerId || null;
      const companyName = selectedJobToApply.companyName || 'Công ty';

      await axios.post('http://localhost:8081/api/notifications/add', {
        userId: candidateId,
        title: "Ứng tuyển thành công",
        message: `Bạn đã ứng tuyển thành công bài đăng [${selectedJobToApply.title}] của [${companyName}]`,
        type: "success",
        link: `/job-detail/${selectedJobToApply.id}`
      });

      if (employerId) {
        await axios.post('http://localhost:8081/api/notifications/add', {
          userId: employerId,
          title: "Có ứng viên mới",
          message: `[${userAccount.fullName || "Một ứng viên"}] đã ứng tuyển bài đăng [${selectedJobToApply.title}] vào lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          type: "new_applicant",
          link: `/job-detail/${selectedJobToApply.id}`
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi thông báo:", error);
    }
  };

  // 🚀 LOGIC ỨNG TUYỂN MỚI (Nhận thêm cvUrl từ Modal)
  const toggleApplyJob = async (jobId, cvUrl = null, expectedSalary = null, salaryType = null, interviewPreference = null) => {
    if (candidateId === 'guest_user') {
      alert("Vui lòng đăng nhập với quyền Ứng viên để ứng tuyển!");
      return;
    }

    try {
      // 1. Gọi API bảng JobApplications mới
      const response = await axios.post(`http://localhost:8081/api/applications/toggle`, {
        jobId: jobId,
        userId: candidateId,
        cvUrl: cvUrl, // Truyền link CV vào đây
        expectedSalary: expectedSalary,
        salaryType: salaryType,
        interviewPreference: interviewPreference
      });

      const result = response.data; // { isApplied: true/false, applyCount: 15, message: "..." }

      // 2. Chỉ cập nhật giao diện khi Backend báo thành công
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
          const updatedJob = {
            ...job,
            isApplied: result.isApplied,
            applicationStatus: result.isApplied ? 'pending' : null,
            applyCount: result.applyCount // Lấy số lượng mới nhất từ DB
          };

          if (viewingJob && viewingJob.id === jobId) setViewingJob(updatedJob);
          return updatedJob;
        }
        return job;
      }));

    } catch (error) {
      console.error("Lỗi ứng tuyển:", error);
      alert("Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại!");
    }
  };

  const handleReportJob = (companyName) => {
    alert(`Đã gửi báo cáo tin tuyển dụng của ${companyName}`);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="flex gap-8 items-start max-w-7xl mx-auto p-6 md:p-8">
        <ProfileCard />

        <div className="flex-1 space-y-8">
          <div className="relative flex bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 p-1.5">
            {['suggested', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-sm font-bold rounded-xl relative transition-colors ${activeTab === tab ? 'text-blue-700' : 'text-slate-500'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'suggested' ? 'Tất cả việc làm' : 'Đánh giá công ty'}
                {activeTab === tab && <motion.div layoutId="tab" className="absolute inset-0 bg-blue-50 border border-blue-100 rounded-xl -z-10" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'suggested' ? (
              <motion.div key="suggested" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                {isLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : (
                  <SuggestedJobsTab
                    jobs={jobs}
                    setSelectedCompany={setSelectedCompany}
                    toggleApplyJob={toggleApplyJob} 
                    onApplyClick={handleOpenApplyModal}
                    handleReportJob={handleReportJob}
                    onViewDetail={handleViewJob}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div key="reviews" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                <ReviewsTab setSelectedCompany={setSelectedCompany} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CompanyModal selectedCompany={selectedCompany} onClose={() => setSelectedCompany(null)} />
      <JobDetailModal
        job={viewingJob}
        onClose={() => setViewingJob(null)}
        onApply={(jobId) => handleOpenApplyModalFromDetail(jobId)}
      />

      {/* ========================================== */}
      {/* MODAL CHỌN CV VÀ KỲ VỌNG PHÒNG VẤN KHI ỨNG TUYỂN */}
      {/* ========================================== */}
      <AnimatePresence>
        {isApplyModalOpen && selectedJobToApply && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setIsApplyModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Chọn CV ứng tuyển</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Bạn đang nộp vào <span className="text-blue-600 font-bold">{selectedJobToApply.companyName || selectedJobToApply.company}</span></p>
                </div>
                <button onClick={() => setIsApplyModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-slate-200 text-slate-500 transition-colors border border-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div className={`rounded-xl border-2 transition-all ${cvOption === 'repo' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}>
                  <label className="flex items-start gap-3 p-4 cursor-pointer">
                    <input
                      type="radio" name="cvOption" value="repo"
                      checked={cvOption === 'repo'}
                      onChange={() => setCvOption('repo')}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block font-bold text-slate-800 flex items-center gap-2">
                        <Database size={16} className={cvOption === 'repo' ? 'text-blue-600' : 'text-slate-400'} />
                        Kho CV cá nhân
                      </span>

                      <AnimatePresence>
                        {cvOption === 'repo' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-2 overflow-hidden"
                          >
                            {isLoadingCvs ? (
                              <div className="flex items-center gap-2 text-sm text-blue-500 py-2">
                                <Loader2 size={16} className="animate-spin" /> Đang tải kho CV...
                              </div>
                            ) : cvList.length === 0 ? (
                              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-medium">
                                Bạn chưa có CV nào trong kho. Hãy tải lên CV hoặc dùng Link đính kèm nhé!
                              </div>
                            ) : (
                              cvList.map(cv => (
                                <label key={cv.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedRepoCv === cv.cvFile ? 'bg-white border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                  <input
                                    type="radio" name="selectedRepoCv"
                                    value={cv.cvFile}
                                    checked={selectedRepoCv === cv.cvFile}
                                    onChange={() => setSelectedRepoCv(cv.cvFile)}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <FileText size={18} className={selectedRepoCv === cv.cvFile ? 'text-blue-500' : 'text-slate-400'} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{cv.originalName || 'CV_Khong_Ten'}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{new Date(cv.uploadedAt).toLocaleDateString('vi-VN')}</p>
                                  </div>
                                </label>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </label>
                </div>

                <div className={`rounded-xl border-2 transition-all ${cvOption === 'custom' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'}`}>
                  <label className="flex items-start gap-3 p-4 cursor-pointer">
                    <input
                      type="radio" name="cvOption" value="custom"
                      checked={cvOption === 'custom'}
                      onChange={() => setCvOption('custom')}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 w-full min-w-0">
                      <span className="block font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon size={16} className={cvOption === 'custom' ? 'text-blue-600' : 'text-slate-400'} />
                        Link / Portfolio đính kèm
                      </span>
                      <AnimatePresence>
                        {cvOption === 'custom' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <input
                              type="url"
                              placeholder="Nhập link Google Drive, Notion..."
                              value={customCvUrl}
                              onChange={(e) => setCustomCvUrl(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </label>
                </div>

                {/* LƯƠNG ĐỀ XUẤT */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-500" /> Mức lương đề xuất (Tùy chọn)
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">Ngân sách của công ty: <strong className="text-slate-800">{selectedJobToApply?.salary || 'Thoả thuận'}</strong></p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Nhập mức lương mong muốn (VD: 15)"
                        value={expectedSalary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExpectedSalary(val);
                          setSalaryError('');
                          if (!salaryType) setSalaryType('Gross');
                        }}
                        className="w-full pl-4 pr-20 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Triệu VNĐ</span>
                    </div>
                  </div>

                  {expectedSalary && parseFloat(expectedSalary) > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn loại lương kỳ vọng:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSalaryType('Gross')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            salaryType === 'Gross'
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-black text-slate-700">Lương GROSS</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${salaryType === 'Gross' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                              {salaryType === 'Gross' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-sm font-black text-blue-700">{parseFloat(expectedSalary).toLocaleString()} triệu</p>
                          <p className="text-[10px] text-slate-400 mt-1">Quy đổi Net: ~{Math.round(parseFloat(expectedSalary) * 0.895 * 10) / 10} triệu</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSalaryType('Net')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            salaryType === 'Net'
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-black text-slate-700">Lương NET</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${salaryType === 'Net' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                              {salaryType === 'Net' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-sm font-black text-emerald-700">{parseFloat(expectedSalary).toLocaleString()} triệu</p>
                          <p className="text-[10px] text-slate-400 mt-1">Quy đổi Gross: ~{Math.round(parseFloat(expectedSalary) / 0.895 * 10) / 10} triệu</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {salaryError && <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> {salaryError}</p>}
                </div>

                {/* HÌNH THỨC PHÒNG VẤN ĐỀ XUẤT */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                    <Video size={14} className="text-blue-500" /> Hình thức phỏng vấn mong muốn
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">Đề xuất để nhà tuyển dụng dễ dàng chuẩn bị lịch:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInterviewPreference('online')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        interviewPreference === 'online'
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-slate-700">Online (Meet)</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${interviewPreference === 'online' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                          {interviewPreference === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Phỏng vấn qua Google Meet, Zoom...</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewPreference('offline')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        interviewPreference === 'offline'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-100'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-slate-700">Trực tiếp (Offline)</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${interviewPreference === 'offline' ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                          {interviewPreference === 'offline' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Phỏng vấn tại văn phòng công ty</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsApplyModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmApply}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl transition-all flex items-center gap-2"
                >
                  <Send size={14} /> Xác nhận nộp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HomeFeed;