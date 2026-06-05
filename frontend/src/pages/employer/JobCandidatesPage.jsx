import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Search, Download,
  FileText, CheckCircle, XCircle, BrainCircuit, Mail, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { AiScanModal, CvModal, EmailModal, OfferModal } from './CandidateModals';

const JobCandidatesPage = () => {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "http://localhost:8081";

  const [searchTerm, setSearchTerm] = useState('');
  const [emailModal, setEmailModal] = useState({ isOpen: false, candidate: null });
  const [emailForm, setEmailForm] = useState({ type: 'interview', interviewType: 'offline', locationOrLink: '', datetime: '', rejectReason: 'Kinh nghiệm chưa phù hợp với vị trí này.', customNote: '' });
  const [cvModal, setCvModal] = useState({ isOpen: false, candidate: null });
  const [aiScan, setAiScan] = useState({ isOpen: false, step: 'input', prompt: '', results: { passed: [], failed: [] } });
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const [activePipelineTab, setActivePipelineTab] = useState('scanned'); // scanned, interviewing, passed, rejected
  const [offerModal, setOfferModal] = useState({
    isOpen: false, candidate: null, department: '', workAddress: '', startDate: '', salary: '', loadingAi: false, isSubmitting: false
  });

  const fetchJobAndCandidates = async () => {
    try {
      setLoading(true);
      // Giả sử có API lấy chi tiết job (nếu chưa có thì lấy tạm title từ đâu đó, ở đây ta fake tạm hoặc lấy từ list jobs)
      // Để đơn giản, ta chỉ quan tâm list ứng viên
      const res = await axios.get(`${API_BASE_URL}/api/employer-ai/job/${id}/candidates`);
      const dataWithStatus = res.data.map(can => ({
        ...can,
        localStatus: can.status ? can.status.toLowerCase() : 'pending',
        rejectReason: can.rejectReason || null
      }));
      setCandidates(dataWithStatus);
      setJob({ id: id, title: "Chi tiết công việc " + id }); // Placeholder, sau này nối API job detail
    } catch (error) {
      console.error("Lỗi fetch dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggestSalary = async () => {
    setOfferModal(prev => ({ ...prev, loadingAi: true }));
    try {
      const res = await axios.post(`${API_BASE_URL}/api/employer-ai/propose-salary-bonus`, { jobId: parseInt(id), userId: offerModal.candidate.id });
      setOfferModal(prev => ({ ...prev, salary: res.data.suggestedSalary }));
    } catch (error) {
      console.error("Lỗi AI Suggest:", error);
    } finally {
      setOfferModal(prev => ({ ...prev, loadingAi: false }));
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setOfferModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      await axios.post(`${API_BASE_URL}/api/email/send-result`, {
        candidateEmail: offerModal.candidate.email,
        candidateName: offerModal.candidate.fullName,
        type: 'offer',
        department: offerModal.department,
        workAddress: offerModal.workAddress,
        startDate: offerModal.startDate,
        salary: offerModal.salary
      });
      await axios.put(`${API_BASE_URL}/api/applications/update-status`, {
        jobId: parseInt(id), userId: offerModal.candidate.id, status: 'passed'
      });
      alert('Đã gửi Offer thành công!');
      fetchJobAndCandidates();
      setOfferModal({ isOpen: false, candidate: null, department: '', workAddress: '', startDate: '', salary: '', loadingAi: false, isSubmitting: false });
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi Offer.');
    } finally {
      setOfferModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  useEffect(() => {
    if (id) fetchJobAndCandidates();
  }, [id]);

  const startAiScan = async () => {
    if (!aiScan.prompt.trim()) {
      alert("Vui lòng nhập tiêu chí quét!");
      return;
    }
    setAiScan({ ...aiScan, step: 'processing' });
    try {
      const userStr = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
      const employerId = userStr ? JSON.parse(userStr).userId : null;

      const response = await axios.post(`${API_BASE_URL}/api/employer-ai/ai-scan`, {
        jobId: parseInt(id),
        prompt: aiScan.prompt,
        employerId: employerId
      });
      setTimeout(() => {
        if (response.data && response.data.warning) {
          alert("CẢNH BÁO: " + response.data.warning);
        }
        setAiScan({ ...aiScan, step: 'preview', results: response.data });
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.warning) {
        alert("Lỗi giới hạn: " + error.response.data.warning);
      } else {
        alert("Lỗi khi chạy AI Scan!");
      }
      setAiScan({ ...aiScan, step: 'input' });
    }
  };

  const confirmAiScan = async () => {
    alert("Đã hoàn tất quét AI!");
    setAiScan({ ...aiScan, isOpen: false, step: 'input' });
    await fetchJobAndCandidates();
  };

  // === HÀM GỬI EMAIL + TỰ ĐỘNG CHUYỂN TRẠNG THÁI ===
  const handleSendEmailSubmit = async () => {
    const candidate = emailModal.candidate;
    if (!candidate) return;

    try {
      // 1. Gửi email thật
      await axios.post(`${API_BASE_URL}/api/email/send-result`, {
        candidateEmail: candidate.email,
        candidateName: candidate.fullName || candidate.name,
        type: emailForm.type,
        // Interview fields
        datetime: emailForm.datetime || '',
        locationOrLink: emailForm.locationOrLink || '',
        // Offer fields
        startDate: emailForm.startDate || '',
        salary: emailForm.salary || '',
        level: emailForm.level || '',
        workAddress: emailForm.workAddress || '',
        // Reject fields
        rejectReason: emailForm.rejectReason || '',
        customNote: emailForm.customNote || ''
      });

      // 2. Tự động chuyển trạng thái ứng viên
      const statusMap = { interview: 'interviewing', offer: 'passed', reject: 'rejected' };
      const newStatus = statusMap[emailForm.type];
      if (newStatus) {
        await axios.put(`${API_BASE_URL}/api/applications/update-status`, {
          jobId: parseInt(id),
          userId: candidate.id,
          status: newStatus,
          rejectReason: emailForm.type === 'reject' ? emailForm.rejectReason : null,
          interviewPreference: emailForm.type === 'interview' ? emailForm.interviewPreference : undefined,
          interviewPreferenceOverride: emailForm.type === 'interview' ? emailForm.interviewPreferenceOverride : undefined
        });
        // Cập nhật state local ngay lập tức
        setCandidates(prev => prev.map(c =>
          c.id === candidate.id ? { 
            ...c, 
            localStatus: newStatus,
            interviewPreference: emailForm.type === 'interview' ? emailForm.interviewPreference : c.interviewPreference,
            interviewPreferenceOverride: emailForm.type === 'interview' ? emailForm.interviewPreferenceOverride : c.interviewPreferenceOverride
          } : c
        ));
      }

      alert(`✅ Đã gửi email và cập nhật trạng thái thành công!`);
      setEmailModal({ isOpen: false, candidate: null });
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      alert("❌ Lỗi khi gửi email: " + (error.response?.data?.error || error.message));
    }
  };

  // === HÀM XUẤT EXCEL CHUẨN ===
  const handleExportExcel = () => {
    if (filteredCandidates.length === 0) {
      alert("Không có dữ liệu ứng viên để xuất!");
      return;
    }
    // Lọc data đẹp để xuất
    const dataToExport = filteredCandidates.map((c, index) => ({
      "STT": index + 1,
      "Tên ứng viên": c.fullName,
      "Email": c.email,
      "Mức độ phù hợp (%)": c.matchScore || 0,
      "Độ tin cậy (%)": c.legitScore || 0,
      "Trạng thái": c.localStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_sach_ung_vien");
    XLSX.writeFile(workbook, `Danh_Sach_Ung_Vien_${job.title.replace(/\s+/g, '_')}.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[80px] animate-pulse"></div>
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-3xl shadow-xl z-10 text-center text-slate-500 font-bold text-lg flex items-center gap-3">
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        Đang tải dữ liệu...
      </div>
    </div>
  );

  const filteredCandidates = candidates.filter(c => {
    const matchSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    // Ánh xạ tab vào status
    if (activePipelineTab === 'scanned') return c.localStatus === 'pending';
    if (activePipelineTab === 'interviewing') return c.localStatus === 'interviewing';
    if (activePipelineTab === 'passed') return c.localStatus === 'passed';
    if (activePipelineTab === 'rejected') return c.localStatus === 'rejected';
    return true;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'interviewing': return 'bg-amber-500/10 text-amber-700 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)] backdrop-blur-md';
      case 'passed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] backdrop-blur-md';
      case 'rejected': return 'bg-rose-500/10 text-rose-700 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] backdrop-blur-md';
      case 'pending':
      default: return 'bg-blue-500/10 text-blue-700 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)] backdrop-blur-md';
    }
  };

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Animation variants cho Table Rows
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 } // Hiển thị lần lượt từng dòng
    }
  };



  // Hàm xử lý chọn nhiều ứng viên
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredCandidates.map(c => c.id);
      setSelectedCandidates(allIds);
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(item => item !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const handleBulkReject = async () => {
    if (selectedCandidates.length === 0) return;
    const confirm = window.confirm(`Bạn có chắc muốn từ chối ${selectedCandidates.length} ứng viên đã chọn không?`);
    if (!confirm) return;

    try {
      await axios.put(`${API_BASE_URL}/api/applications/bulk-reject`, {
        jobId: parseInt(id),
        candidateIds: selectedCandidates
      });
      alert("Đã từ chối hàng loạt thành công!");
      setSelectedCandidates([]);
      fetchJobAndCandidates(); // Load lại data
    } catch (error) {
      console.error("Lỗi khi từ chối hàng loạt:", error);
      alert("Có lỗi xảy ra khi thực hiện từ chối hàng loạt.");
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20, x: -10 },
    show: { opacity: 1, y: 0, x: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 relative overflow-hidden font-sans">

      {/* BACKGROUND BLOBS TẠO HIỆU ỨNG KÍNH */}
      <div className="fixed top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/20 mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse duration-10000"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-[120px] pointer-events-none animate-pulse duration-7000 delay-1000"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 relative z-10 pb-12"
      >

        {/* HEADER */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white/80 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-shadow duration-500">
          <div className="flex items-center gap-5">
            <Link to={`/employer/jobs/${job.id}`} className="p-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl hover:bg-white hover:scale-105 transition-all shadow-sm group">
              <ArrowLeft size={22} className="text-slate-600 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-1">Danh sách Ứng viên</h2>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                Tin tuyển dụng: <span className="bg-white px-3 py-1 rounded-lg border border-blue-100 text-blue-600 font-bold shadow-sm">{job.title}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setAiScan({ ...aiScan, isOpen: true })}
              className="relative flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border border-violet-500/30 text-violet-700 font-bold rounded-2xl hover:bg-violet-500/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
            >
              <div className="absolute inset-0 w-1/4 h-full bg-white/40 skew-x-12 -translate-x-full group-hover:animate-[shine_1s_ease-in-out]"></div>
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform duration-300" /> Quét AI Lọc CV
            </button>

            {/* NÚT XUẤT EXCEL GIAO DIỆN MỚI PRO */}
            <button
              onClick={handleExportExcel}
              className="relative flex-1 md:flex-none flex items-center justify-center bg-[#25633e] text-white px-7 py-3 rounded-2xl overflow-hidden group shadow-[0_8px_20px_rgba(37,99,62,0.3)] hover:shadow-[0_12px_25px_rgba(37,99,62,0.5)] hover:-translate-y-0.5 transition-all duration-300 font-bold border border-[#1e5233]"
            >
              {/* Lớp nền trượt */}
              <div className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-[#307750] to-[#469b61] transition-all duration-500 ease-out group-hover:w-full z-0"></div>

              {/* Icon */}
              <Download size={22} className="z-10 mr-2.5 drop-shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 text-white" strokeWidth={2.5} />
              <span className="z-10 relative drop-shadow-md tracking-wide">Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* MAIN TABLE CONTAINER */}
        <div className="bg-white/50 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">

          {/* PIPELINE TABS */}
          <div className="flex px-2 sm:px-6 pt-4 gap-2 overflow-x-auto no-scrollbar border-b border-slate-200">
            {[
              { id: 'scanned', label: 'Chờ Xử Lý (AI Quét)', icon: BrainCircuit, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-200' },
              { id: 'interviewing', label: 'Phỏng Vấn', icon: Mail, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-200' },
              { id: 'passed', label: 'Đậu (Tạo Offer)', icon: CheckCircle, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-200' },
              { id: 'rejected', label: 'Từ Chối', icon: XCircle, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-200' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePipelineTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold transition-all border-t border-x border-transparent whitespace-nowrap ${activePipelineTab === tab.id
                    ? `${tab.color} ${tab.activeBg} border-b-0 translate-y-[1px] shadow-[0_-4px_10px_rgba(0,0,0,0.02)]`
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
              >
                <tab.icon size={18} /> {tab.label}
                <span className="ml-1 px-2 py-0.5 rounded-full bg-white/50 text-xs border border-current opacity-70">
                  {candidates.filter(c => tab.id === 'scanned' ? c.localStatus === 'pending' : c.localStatus === tab.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* TOOLBAR TÌM KIẾM */}
          <div className="p-6 border-b border-white/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40">
            <div className="relative w-full sm:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all z-10 duration-300" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm ứng viên theo tên..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 focus:bg-white transition-all font-medium text-slate-700 placeholder-slate-400 shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Nút từ chối hàng loạt */}
            {selectedCandidates.length > 0 && (
              <button
                onClick={handleBulkReject}
                className="flex items-center gap-2 px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md transition-all animate-in zoom-in duration-300"
              >
                <XCircle size={18} />
                Từ chối hàng loạt ({selectedCandidates.length})
              </button>
            )}
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200/50 text-sm">
                  <th className="p-5 pl-8 w-10">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={filteredCandidates.length > 0 && selectedCandidates.length === filteredCandidates.length}
                    />
                  </th>
                  <th className="p-5 font-black text-slate-500 uppercase tracking-wider text-xs">Ứng viên</th>
                  <th className="p-5 font-black text-slate-500 uppercase tracking-wider text-xs">Phân tích AI</th>
                  <th className="p-5 font-black text-slate-500 uppercase tracking-wider text-xs">Trạng thái</th>
                  <th className="p-5 font-black text-slate-500 text-right pr-8 uppercase tracking-wider text-xs">Thao tác</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-100/50"
              >
                {filteredCandidates.map((candidate) => (
                  <motion.tr
                    variants={rowVariants}
                    key={candidate.id}
                    className="hover:bg-white hover:shadow-[0_5px_20px_rgba(0,0,0,0.04)] hover:scale-[1.01] hover:z-10 relative transition-all duration-300 rounded-2xl group cursor-pointer"
                  >
                    {/* CHECKBOX */}
                    <td className="p-5 pl-8">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => handleSelectRow(candidate.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    {/* INFO ỨNG VIÊN */}
                    <td className="p-5 flex items-center gap-4 rounded-l-2xl">
                      <div className="relative">
                        {candidate.avatar ? (
                          <img src={getFullUrl(candidate.avatar)} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
                        ) : (
                          <img src={`https://ui-avatars.com/api/?name=${candidate.fullName}&background=eff6ff&color=2563eb`} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
                        )}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] pointer-events-none"></div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-base">{candidate.fullName}</p>
                        <p className="text-sm font-semibold text-slate-500 bg-slate-100/60 inline-block px-2.5 py-0.5 rounded-lg mt-1 border border-slate-200/50">{candidate.email}</p>
                      </div>
                    </td>

                    {/* AI MATCH SCORE & LEGIT SCORE */}
                    <td className="p-5">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border backdrop-blur-md transition-transform duration-300 w-fit ${candidate.matchScore >= 80
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-500/20'
                          : 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 text-slate-700 border-slate-500/20'
                          }`}>
                          <BrainCircuit size={14} className={candidate.matchScore >= 80 ? "text-emerald-600" : "text-slate-500"} />
                          {candidate.matchScore || 0}% Match
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border backdrop-blur-md transition-transform duration-300 w-fit ${candidate.legitScore >= 80
                          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-500/20'
                          : (candidate.legitScore >= 50 ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-500/20' : 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-700 border-rose-500/20')
                          }`}>
                          <CheckCircle size={14} className={candidate.legitScore >= 80 ? "text-blue-600" : (candidate.legitScore >= 50 ? "text-amber-600" : "text-rose-600")} />
                          {candidate.legitScore || 0}% Trust
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="p-5">
                      <span className={`px-4 py-2 rounded-xl text-xs uppercase tracking-widest font-bold border ${getStatusStyle(candidate.localStatus)} transition-all duration-300 group-hover:brightness-110`}>
                        {candidate.localStatus === 'pending' ? 'Mới ứng tuyển' : candidate.localStatus === 'interviewing' ? 'Đang phỏng vấn' : candidate.localStatus === 'passed' ? 'Trúng tuyển' : 'Từ chối'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-5 pr-8 text-right rounded-r-2xl">
                      <div className="flex items-center justify-end gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                        {/* Xem CV */}
                        <button
                          onClick={() => setCvModal({ isOpen: true, candidate: { ...candidate, cvUrl: getFullUrl(candidate.cvUrl) } })}
                          className="p-2.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
                          title="Xem CV"
                        >
                          <FileText size={20} strokeWidth={2.5} />
                        </button>

                        {/* Gửi Email Phỏng vấn */}
                        <button
                          onClick={() => { setEmailForm(prev => ({ ...prev, type: 'interview' })); setEmailModal({ isOpen: true, candidate }); }}
                          className="p-2.5 text-slate-500 hover:text-amber-600 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
                          title="Hẹn phỏng vấn"
                        >
                          <Mail size={20} strokeWidth={2.5} />
                        </button>

                        {/* Gửi Email Từ chối */}
                        <button
                          onClick={() => { setEmailForm(prev => ({ ...prev, type: 'reject' })); setEmailModal({ isOpen: true, candidate }); }}
                          className="p-2.5 text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
                          title="Từ chối ứng viên"
                        >
                          <XCircle size={20} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {filteredCandidates.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-500 font-medium">
                      Không tìm thấy ứng viên nào phù hợp với từ khóa "<span className="text-blue-600 font-bold">{searchTerm}</span>".
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </div>

      </motion.div>

      {/* MODALS - Moved outside motion.div to escape transform stacking context */}
      <AiScanModal aiScan={aiScan} setAiScan={setAiScan} startAiScan={startAiScan} confirmAiScan={confirmAiScan} />
      <CvModal
        cvModal={cvModal}
        closeCvModal={() => setCvModal({ isOpen: false, candidate: null })}
        openEmailModal={(candidate, type) => {
          if (type) setEmailForm(prev => ({ ...prev, type }));
          setEmailModal({ isOpen: true, candidate });
        }}
        getStatusStyle={getStatusStyle}
        onStatusChange={fetchJobAndCandidates}
      />
      <EmailModal emailModal={emailModal} closeEmailModal={() => setEmailModal({ isOpen: false, candidate: null })} emailForm={emailForm} setEmailForm={setEmailForm} handleSendEmailSubmit={handleSendEmailSubmit} />
      <OfferModal
        isOpen={offerModal.isOpen}
        onClose={() => setOfferModal(prev => ({ ...prev, isOpen: false }))}
        candidate={offerModal.candidate}
        offerForm={offerModal}
        setOfferForm={setOfferModal}
        handleAiSuggestSalary={handleAiSuggestSalary}
        loadingAi={offerModal.loadingAi}
        handleSubmitOffer={handleSubmitOffer}
        isSubmitting={offerModal.isSubmitting}
      />

      {/* Tailwind Custom Keyframes (Được tích hợp trực tiếp qua class arbitrary values hoặc bạn có thể thêm vào index.css) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shine {
          100% { left: 125%; }
        }
      `}} />
    </div>
  );
};

export default JobCandidatesPage;