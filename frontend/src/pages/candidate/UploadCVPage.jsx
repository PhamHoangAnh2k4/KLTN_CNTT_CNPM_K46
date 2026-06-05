'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  UploadCloud, FileText, CheckCircle2, Sparkles, X,
  Bot, Zap, BarChart3, ShieldCheck, ChevronRight,
  Trash2, Eye, ImageIcon, Loader2, Library, FileWarning, PlusCircle,
  Briefcase, Send, Target, ChevronDown, Award, Star, Compass,
  Building2, AlertTriangle, DollarSign, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobDetailModal from './JobDetailModal';

const UploadCVPage = () => {
  // --- STATE CỦA UPLOAD & SCAN AI ---
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // --- STATE XEM TRƯỚC TÀI LIỆU ---
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // --- STATE KẾT QUẢ AI MATCHING ---
  const [aiKeywords, setAiKeywords] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [uploadedCvUrl, setUploadedCvUrl] = useState(null);

  // --- STATE MODAL CHI TIẾT JOB ---
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STATE CỦA MODAL THIẾT LẬP KỲ VỌNG KHI ỨNG TUYỂN ---
  const [applyPreferenceModal, setApplyPreferenceModal] = useState({ isOpen: false, jobId: null, jobTitle: '', companyName: '', salaryRange: '' });
  const [expectedSalary, setExpectedSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Gross');
  const [salaryError, setSalaryError] = useState('');
  const [interviewPreference, setInterviewPreference] = useState('online');

  // --- STATE CỦA KHO CV ---
  const [cvList, setCvList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // --- CẤU HÌNH API ---
  const API_BASE_URL = "http://localhost:8081";

  const getSessionUser = () => {
    if (typeof window === 'undefined') return {};
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('userAccount');
    return localUser ? JSON.parse(localUser) : {};
  };

  const userAccount = getSessionUser();
  const userId = userAccount.userId || null;
  const isCandidate = userAccount.role === 'ung_vien';

  // ==========================================
  // FETCH KHO CV
  // ==========================================
  const fetchCVs = async () => {
    if (!userId || !isCandidate) {
      setIsLoadingList(false);
      return;
    }
    setIsLoadingList(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/candidate-cvs/${userId}`);
      setCvList(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách CV:", error);
      if (cvList.length === 0) setCvList([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, [userId]);

  const getFullUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
  };

  const handleDelete = async (cvId, fileName) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa "${fileName}" khỏi kho?`);
    if (!isConfirm) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/candidate-cvs/${cvId}`);
      setCvList(prev => prev.filter(cv => cv.id !== cvId));
    } catch (error) {
      alert("Lỗi khi xóa CV!");
    }
  };

  // ==========================================
  // LOGIC UPLOAD & QUÉT AI THẬT
  // ==========================================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Dung lượng file tối đa là 5MB!");
        return;
      }
      setFile(selectedFile);
      setScanComplete(false);
      setMatchedJobs([]);
      setAiKeywords([]);
    }
    setIsDragOver(false);
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setFile(null);
    setScanComplete(false);
    setMatchedJobs([]);
    setAiKeywords([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanAIAndUpload = async () => {
    if (!userId) {
      alert("Bạn cần đăng nhập để tải CV!");
      return;
    }

    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API_BASE_URL}/api/candidate-cvs/${userId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { aiKeywords, matchedJobs, cv } = response.data;

      if (aiKeywords && aiKeywords.includes("INVALID_DOCUMENT")) {
        alert("⚠️ Hệ thống AI phát hiện đây không phải là CV hợp lệ (có thể file bị mờ, hình ảnh không rõ chữ, hoặc sai định dạng). Vui lòng kiểm tra lại file và tải lên bản rõ nét hơn!");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsScanning(false);
        return;
      }

      // Fetch trạng thái ứng tuyển của user cho các job được match
      let appliedStatusMap = {};
      try {
        const appliedRes = await axios.get(`${API_BASE_URL}/api/applications/user/${userId}/applied-jobs`);
        (appliedRes.data || []).forEach(a => {
          appliedStatusMap[a.jobId] = a.status || 'pending';
        });
      } catch (e) {
        console.warn('Không lấy được trạng thái ứng tuyển:', e);
      }

      // Sắp xếp các tin tuyển dụng theo điểm tương thích giảm dần
      const sortedMatchedJobs = [...(matchedJobs || [])].sort((a, b) => {
        const valA = parseFloat(a.matchPercent) || 0;
        const valB = parseFloat(b.matchPercent) || 0;
        return valB - valA;
      });

      const enrichedJobs = sortedMatchedJobs.map(job => ({
        ...job,
        isApplied: appliedStatusMap[job.id] !== undefined,
        applicationStatus: appliedStatusMap[job.id] || null,
      }));

      setAiKeywords(aiKeywords || []);
      setMatchedJobs(enrichedJobs);
      setUploadedCvUrl(cv?.cvFile || null);
      setScanComplete(true);

      fetchCVs();

    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi: " + (error.response?.data || "Không thể kết nối đến server AI."));
    } finally {
      setIsScanning(false);
    }
  };

  // ==========================================
  // LOGIC ỨNG TUYỂN TRỰC TIẾP
  // ==========================================
  const STATUS_CONFIG = {
    pending:      { label: 'Đã nộp hồ sơ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    interviewing: { label: 'Đang phỏng vấn', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    passed:       { label: 'Đã được duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected:     { label: 'Bị từ chối', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const handleOpenPreferenceModal = (job, e) => {
    if (e) e.stopPropagation();
    
    setApplyPreferenceModal({
      isOpen: true,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company || job.companyName || 'Công ty',
      salaryRange: job.salary
    });
    setExpectedSalary('');
    setSalaryType('Gross');
    setSalaryError('');
    setInterviewPreference('online');
  };

  const handleDirectApply = async (jobId, expectedSalary = null, salaryType = null, interviewPreference = null) => {
    if (!userId) {
      alert("Vui lòng đăng nhập với quyền Ứng viên để ứng tuyển!");
      return;
    }

    // Kiểm tra trạng thái trước khi cho ứng tuyển
    const currentJob = matchedJobs.find(j => j.id === jobId);
    if (currentJob?.applicationStatus === 'rejected') {
      alert('❌ Bạn đã bị từ chối ở vị trí này trước đó. Nhà tuyển dụng không chấp nhận hồ sơ lần này.');
      return;
    }
    if (currentJob?.applicationStatus === 'interviewing') {
      alert('📊 Bạn đang ở giai đoạn Phỏng vấn! Hãy chờ kết quả từ nhà tuyển dụng.');
      return;
    }
    if (currentJob?.applicationStatus === 'passed') {
      alert('✅ Chúc mừng! Hồ sơ của bạn đã được duyệt cho vị trí này.');
      return;
    }

    setApplyingJobId(jobId);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/applications/toggle`, {
        jobId: jobId,
        userId: userId,
        cvUrl: uploadedCvUrl,
        expectedSalary: expectedSalary,
        salaryType: salaryType,
        interviewPreference: interviewPreference
      });

      const result = response.data;
      if (result.isApplied) {
        alert("🎉 Chúc mừng! Bạn đã ứng tuyển thành công qua AI. Nhà tuyển dụng sẽ sớm liên hệ!");
      } else {
        alert("Đã hủy ứng tuyển thành công.");
      }

      setMatchedJobs(prev => prev.map(job =>
        job.id === jobId ? {
          ...job,
          isApplied: result.isApplied,
          applicationStatus: result.isApplied ? 'pending' : null
        } : job
      ));

    } catch (error) {
      console.error("Lỗi ứng tuyển:", error);
      alert("Lỗi khi ứng tuyển. Vui lòng thử lại!");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleOpenJobModal = async (job, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs/${job.id}`);
      if (response.data) {
        // Gộp data full của job với data match của AI
        setSelectedJob({ ...response.data, ...job });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết job:", error);
      alert("Không thể tải chi tiết công việc. Vui lòng thử lại sau.");
    }
  };

  if (userAccount.role === 'nha_tuyen_dung') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 max-w-md">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quyền truy cập hạn chế</h2>
          <p className="text-slate-500 mb-6">Trang này chỉ dành cho Ứng viên để quản lý hồ sơ cá nhân.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 font-sans overflow-hidden bg-slate-50/50">
      {/* Background Orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-0 -left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, -20, 0], y: [0, 40, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
        className="absolute top-0 -right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <div className="p-8 sm:p-14 relative z-10">
          {/* HEADER */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-lg shadow-blue-500/20 relative group cursor-pointer"
            >
              <Bot size={48} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-3xl"></div>
              <Sparkles size={24} className="text-amber-300 absolute -top-3 -right-3 animate-pulse" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-4 tracking-tight">
              Phân Tích & Lưu Trữ CV
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Tải hồ sơ của bạn lên và để AI thế hệ mới bóc tách kỹ năng, chấm điểm và tìm kiếm công việc hoàn hảo nhất.
            </p>
          </div>

          {/* VÙNG UPLOAD */}
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload-zone"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                whileHover={{ scale: 1.005 }}
                className={`relative border-2 border-dashed rounded-[2rem] p-14 text-center transition-all duration-300 bg-gradient-to-br from-slate-50/50 to-white group cursor-pointer ${isDragOver ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5'
                  }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
              >
                <input
                  type="file" ref={fileInputRef} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange}
                />
                <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] rounded-[2rem]"></div>

                <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-100 rounded-3xl animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud size={36} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Kéo thả CV hoặc Ảnh chụp vào đây</h3>
                <p className="text-sm font-medium text-slate-400 mb-6">Hệ thống hỗ trợ file PDF, PNG, JPG (Tối đa 5MB)</p>

                <div className="flex justify-center gap-6 text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <Zap size={16} className="text-amber-500" /> <span>Xử lý siêu tốc</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <ShieldCheck size={16} className="text-emerald-500" /> <span>Bảo mật 100%</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-info"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-50/30 p-6 sm:p-8 rounded-[2rem] border border-slate-100/80 shadow-sm relative overflow-hidden"
              >
                {/* Background effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 rounded-full filter blur-3xl pointer-events-none"></div>
                
                {/* LEFT COLUMN: LIVE INTERACTIVE PREVIEW */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Eye size={14} className="text-blue-500" /> Bản xem trước tài liệu
                    </span>
                    {!isScanning && !scanComplete && (
                      <button 
                        onClick={handleRemoveFile} 
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Trash2 size={13} /> Hủy chọn
                      </button>
                    )}
                  </div>
                  
                  <div className="relative border border-slate-200 bg-slate-100 rounded-2xl overflow-hidden min-h-[350px] lg:min-h-[420px] shadow-inner flex items-center justify-center">
                    {previewUrl ? (
                      file.type?.includes('pdf') || file.name.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={`${previewUrl}#toolbar=0`} 
                          title="CV Preview" 
                          className="w-full h-[350px] lg:h-[420px] border-0 bg-white"
                        />
                      ) : (
                        <div className="w-full h-[350px] lg:h-[420px] overflow-auto flex items-center justify-center bg-white p-2">
                          <img 
                            src={previewUrl} 
                            alt="CV Preview" 
                            className="max-w-full max-h-full object-contain rounded-lg hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-center text-slate-400 p-8">
                        <Loader2 className="animate-spin mx-auto mb-2 text-blue-500" size={24} />
                        <span className="text-xs font-medium">Đang tải bản xem trước...</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* RIGHT COLUMN: AI CONTROL PANEL */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                  <div className="space-y-5">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">Thông tin tệp</span>
                      <h3 className="font-extrabold text-slate-800 text-xl mt-3 break-words leading-tight" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{file.name.split('.').pop().toUpperCase()}</span>
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>

                    {/* AI STATUS / SCANNING */}
                    {isScanning ? (
                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-3 text-blue-700 font-extrabold text-sm uppercase tracking-wider">
                          <Bot size={20} className="animate-bounce text-blue-600" />
                          <span className="animate-pulse">AI Đang đọc & phân tích...</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                          Hệ thống AI đang trích xuất dữ liệu, định vị từ khóa chuyên môn và chấm điểm độ tương thích. Quá trình này mất khoảng 2-4 giây.
                        </p>
                        <div className="relative pt-2">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 4, ease: "linear" }}
                              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : scanComplete ? (
                      <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-3">
                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                        <div>
                          <h4 className="font-bold text-emerald-800 text-sm">Phân tích hoàn tất!</h4>
                          <p className="text-xs font-medium text-emerald-600/80 mt-1 leading-relaxed">
                            AI đã trích xuất thành công các kỹ năng cốt lõi và tìm kiếm những cơ hội nghề nghiệp phù hợp nhất cho bạn. Cuộn xuống để xem kết quả.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                          <Sparkles size={16} className="text-indigo-500" /> Trợ lý Tuyển dụng AI
                        </h4>
                        <ul className="text-xs font-medium text-slate-500 space-y-2 list-disc list-inside">
                          <li>Quét kỹ năng bằng thuật toán nâng cao</li>
                          <li>Chấm điểm matching dựa trên JD thật</li>
                          <li>Tự động đề xuất CV cho doanh nghiệp</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* TRIGGER BUTTON */}
                  {!scanComplete && !isScanning && (
                    <button 
                      onClick={handleScanAIAndUpload} 
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl font-black text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                    >
                      <Sparkles size={18} /> Phân tích CV ngay
                    </button>
                  )}
                  
                  {scanComplete && (
                    <button 
                      onClick={handleRemoveFile} 
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-300"
                    >
                      <PlusCircle size={16} /> Tải hồ sơ khác lên
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KẾT QUẢ AI MATCHING */}
          <AnimatePresence>
            {scanComplete && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-12 pt-10 border-t border-slate-100">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="text-indigo-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-800">Kỹ năng AI nhận diện</h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {aiKeywords.length > 0 ? aiKeywords.map((kw, i) => (
                      <span key={i} className="px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100/50 hover:border-blue-300 transition-colors cursor-default">{kw}</span>
                    )) : <span className="text-slate-400 italic text-sm">Không tìm thấy từ khóa đặc trưng</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Compass className="text-rose-500" size={24} />
                    <h3 className="text-xl font-bold text-slate-800">Lộ trình nghề nghiệp gợi ý</h3>
                  </div>
                  <span className="text-sm text-slate-400 font-medium">Tìm thấy {matchedJobs.length} vị trí phù hợp</span>
                </div>

                <motion.div
                  className="space-y-5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.15 } }
                  }}
                >
                    {matchedJobs.length > 0 ? matchedJobs.map((job) => {
                    const appStatus = job.applicationStatus;
                    const statusCfg = STATUS_CONFIG[appStatus] || null;
                    const isLocked = appStatus === 'rejected' || appStatus === 'interviewing' || appStatus === 'passed';

                    return (
                    <motion.div
                      key={job.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                      }}
                      whileHover={{ y: -3 }}
                      className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-blue-200 transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
                      onClick={(e) => handleOpenJobModal(job, e)}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                            {statusCfg && (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusCfg.color}`}>
                                {appStatus === 'rejected' && <AlertTriangle size={11} />}
                                {appStatus === 'interviewing' && <Loader2 size={11} />}
                                {appStatus === 'passed' && <CheckCircle2 size={11} />}
                                {appStatus === 'pending' && <Send size={11} />}
                                {statusCfg.label}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4">
                            <span className="text-sm text-slate-600 font-semibold flex items-center gap-1.5">
                              <Building2 size={14} className="text-slate-400" /> {job.company}
                            </span>
                            <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                            <span className="text-sm text-emerald-600 font-bold flex items-center gap-1.5">
                              <Star size={14} className="text-emerald-500" /> {job.salary || "Thỏa thuận"}
                            </span>
                          </div>

                          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100 rounded-xl p-4 mt-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/30 rounded-bl-full filter blur-xl"></div>
                            <div className="flex items-start gap-3 relative z-10">
                              <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 leading-relaxed">
                                <span className="font-bold text-blue-700">AI Nhận xét: </span>
                                {job.aiExplanation}
                              </p>
                            </div>
                          </div>

                          {appStatus === 'rejected' && (
                            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                              <AlertTriangle size={13} /> Bạn đã bị từ chối ở vị trí này. Nhà tuyển dụng không chấp nhận nộp lại.
                            </div>
                          )}
                          {appStatus === 'interviewing' && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-semibold flex items-center gap-2">
                              <Loader2 size={13} /> Bạn đang trong giai đoạn phỏng vấn! Hãy chuẩn bị kỹ nhé.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-center md:items-end min-w-[150px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                          <div className="text-center mb-5">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{job.matchPercent}%</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">Độ tương thích</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (appStatus === 'pending') {
                                const confirm = window.confirm('ℹ️ Bạn đã nộp hồ sơ trước đó. Bấm OK để hủy ứng tuyển.');
                                if (!confirm) return;
                                handleDirectApply(job.id);
                              } else {
                                handleOpenPreferenceModal(job, e);
                              }
                            }}
                            disabled={applyingJobId === job.id || isLocked}
                            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              applyingJobId === job.id ? 'bg-slate-100 text-slate-400'
                              : appStatus === 'rejected' ? 'bg-rose-50 text-rose-400 border border-rose-100 cursor-not-allowed'
                              : appStatus === 'interviewing' ? 'bg-amber-600 border border-amber-200 cursor-not-allowed'
                              : appStatus === 'passed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed'
                              : appStatus === 'pending' ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                            }`}
                          >
                            {applyingJobId === job.id ? <Loader2 size={14} className="animate-spin" />
                              : appStatus === 'rejected' ? <AlertTriangle size={14} />
                              : appStatus === 'interviewing' ? <Loader2 size={14} />
                              : appStatus === 'passed' ? <CheckCircle2 size={14} />
                              : appStatus === 'pending' ? <CheckCircle2 size={14} />
                              : <Send size={14} />}
                            {applyingJobId === job.id ? 'Đang gửi...'
                              : appStatus === 'rejected' ? 'Bị từ chối'
                              : appStatus === 'interviewing' ? 'Đang phỏng vấn'
                              : appStatus === 'passed' ? 'Đã duyệt'
                              : appStatus === 'pending' ? 'Đã nộp hồ sơ'
                              : 'Ứng tuyển ngay'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  }) : (
                    <div className="text-center py-10 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                      Không tìm thấy công việc nào khớp hoàn toàn kỹ năng của bạn.
                    </div>
                  )}
                </motion.div>

                <div className="mt-8 text-center">
                  <button onClick={handleRemoveFile} className="text-sm font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 mx-auto transition-colors">
                    <PlusCircle size={16} /> Thử lại với hồ sơ khác
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KHO CV ĐÃ LƯU */}
          <div className="mt-20 pt-12 border-t-2 border-dashed border-slate-100 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 flex items-center gap-2 text-slate-300">
              <Library size={24} />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  Kho CV Cá Nhân
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Nơi lưu trữ các hồ sơ bạn đã tải lên</p>
              </div>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">{cvList.length} Hồ sơ</span>
            </div>

            {isLoadingList ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={36} /></div>
            ) : cvList.length === 0 ? (
              <div className="text-center py-14 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                <FileWarning size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm font-bold">Chưa có hồ sơ nào được lưu trữ.</p>
                <p className="text-slate-400 text-xs mt-1">Hãy tải CV lên để bắt đầu phân tích.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {cvList.map((cv) => {
                  const isPDF = cv.fileType?.includes('pdf') || cv.originalName?.toLowerCase().endsWith('.pdf');
                  return (
                    <motion.div
                      key={cv.id}
                      whileHover={{ y: -3 }}
                      className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-pointer"
                    >
                      <div className={`p-3.5 rounded-xl flex-shrink-0 transition-colors ${isPDF ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                        {isPDF ? <FileText size={24} /> : <ImageIcon size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={cv.originalName}>{cv.originalName}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Ngày tải: {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString('vi-VN') : 'Mới đây'}</p>
                        <div className="flex items-center gap-2 mt-4">
                          <a href={getFullUrl(cv.cvFile)} target="_blank" rel="noreferrer" className="px-3.5 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
                            <Eye size={14} className="text-slate-400" /> Xem chi tiết
                          </a>
                          <button onClick={() => handleDelete(cv.id, cv.originalName)} className="px-3.5 py-2 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-50 flex items-center gap-1.5 ml-auto transition-colors">
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* MODAL CHI TIẾT CÔNG VIỆC */}
      <AnimatePresence>
        {isModalOpen && selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setIsModalOpen(false)}
            onApply={(jobId) => {
              setIsModalOpen(false);
              const jobObj = matchedJobs.find(j => j.id === jobId);
              if (jobObj) {
                if (jobObj.applicationStatus === 'pending') {
                  const confirm = window.confirm('ℹ️ Bạn đã nộp hồ sơ trước đó. Bấm OK để hủy ứng tuyển.');
                  if (!confirm) return;
                  handleDirectApply(jobId);
                } else {
                  handleOpenPreferenceModal(jobObj);
                }
              } else {
                handleDirectApply(jobId);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL CẤU HÌNH KỲ VỌNG & PHÒNG VẤN KHI ỨNG TUYỂN */}
      <AnimatePresence>
        {applyPreferenceModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setApplyPreferenceModal(prev => ({ ...prev, isOpen: false }))}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Xác nhận ứng tuyển</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Bạn đang nộp vào <span className="text-blue-600 font-bold">{applyPreferenceModal.companyName}</span></p>
                </div>
                <button onClick={() => setApplyPreferenceModal(prev => ({ ...prev, isOpen: false }))} className="p-2 bg-white rounded-full hover:bg-slate-200 text-slate-500 transition-colors border border-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                {/* Lương đề xuất */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-500 mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-500" /> Mức lương đề xuất (Tùy chọn)
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">Ngân sách của công ty: <strong className="text-slate-800">{applyPreferenceModal.salaryRange || 'Thoả thuận'}</strong></p>
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-none">Chọn loại lương kỳ vọng:</p>
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

                {/* Hình thức phỏng vấn */}
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
                <button onClick={() => setApplyPreferenceModal(prev => ({ ...prev, isOpen: false }))} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all">
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    if (applyPreferenceModal.salaryRange && applyPreferenceModal.salaryRange.toLowerCase() !== 'thoả thuận') {
                      const match = applyPreferenceModal.salaryRange.match(/(\d+)\s*-\s*(\d+)/);
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
                    handleDirectApply(
                      applyPreferenceModal.jobId,
                      expectedSalary ? parseInt(expectedSalary) * 1000000 : null,
                      salaryType,
                      interviewPreference
                    );
                    setApplyPreferenceModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl transition-all flex items-center gap-2"
                >
                  <Send size={14} /> Xác nhận nộp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadCVPage;