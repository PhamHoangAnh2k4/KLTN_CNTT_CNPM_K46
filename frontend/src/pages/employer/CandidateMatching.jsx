import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Briefcase, MapPin, Search, Filter,
  FileText, Mail, Sparkles, ChevronLeft,
  Users, Download, Eye, Phone, Globe, CheckCircle, XCircle
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

import { AiScanModal, CvModal, EmailModal } from './CandidateModals';

const CandidateMatching = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  const API_BASE_URL = "http://localhost:8081";

  const [aiScan, setAiScan] = useState({ isOpen: false, step: 'input', prompt: '', results: { passed: [], failed: [] } });
  const [cvModal, setCvModal] = useState({ isOpen: false, candidate: null });
  const [emailModal, setEmailModal] = useState({ isOpen: false, candidate: null });
  const [emailForm, setEmailForm] = useState({ type: 'interview', locationOrLink: '', datetime: '', rejectReason: '' });

  // Tách hàm fetch ra để có thể tái sử dụng sau khi AI quét xong
  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer-ai/job/${id}/candidates`);
      const dataWithStatus = response.data.map(can => ({
         ...can,
         localStatus: can.status ? can.status.toLowerCase() : 'pending',
         rejectReason: can.rejectReason || null
      }));
      setCandidates(dataWithStatus);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu ứng viên:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCandidates();
  }, [id]);

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path; 
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed': return 'bg-emerald-100 text-emerald-600';
      case 'rejected': return 'bg-rose-100 text-rose-600';
      case 'interviewing': return 'bg-blue-100 text-blue-600';
      default: return 'bg-amber-100 text-amber-600'; 
    }
  };

  const handleSendEmailSubmit = async () => {
    const candidate = emailModal.candidate;
    if (!candidate) return;

    try {
      // CHỈ gửi email, KHÔNG tự động đổi trạng thái
      await axios.post(`${API_BASE_URL}/api/email/send-result`, {
        candidateEmail: candidate.email,
        candidateName: candidate.fullName,
        type: emailForm.type,
        datetime: emailForm.datetime,
        locationOrLink: emailForm.locationOrLink,
        rejectReason: emailForm.rejectReason,
        startDate: emailForm.startDate,
        workAddress: emailForm.workAddress,
        salary: emailForm.salary,
        level: emailForm.level
      });

      alert(`✅ Đã gửi email thành công! Hãy chủ động cập nhật trạng thái ứng viên thủ công.`);
      setEmailModal({ isOpen: false, candidate: null });

    } catch (error) {
      console.error("Lỗi:", error);
      alert("❌ Gửi email thất bại. Hãy kiểm tra Backend!");
    }
  };


  const updateCandidateStatus = async (canId, newStatus) => {
     const reason = newStatus === 'rejected' ? "Không vượt qua vòng Phỏng vấn" : null;
     
     try {
       await axios.put(`${API_BASE_URL}/api/applications/update-status`, {
          jobId: parseInt(id),
          userId: canId,
          status: newStatus,
          rejectReason: reason
       });

      let notifTitle = newStatus === 'passed' ? "🎉 Chúc mừng bạn trúng tuyển" : "😔 Kết quả ứng tuyển";
      let notifMessage = newStatus === 'passed'
          ? "Bạn đã xuất sắc vượt qua vòng phỏng vấn. Nhà tuyển dụng sẽ sớm liên hệ với bạn!"
          : "Rất tiếc, bạn chưa vượt qua vòng phỏng vấn cho vị trí này.";

      await axios.post(`${API_BASE_URL}/api/notifications/add`, {
          userId: canId,
          title: notifTitle,
          message: notifMessage,
          type: newStatus,
          link: `/job-detail/${id}`
      });

       setCandidates(prev => prev.map(can => 
          can.id === canId ? { ...can, localStatus: newStatus, rejectReason: reason } : can
       ));
     } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi khi cập nhật trạng thái hệ thống!");
     }
  };

  const handleStartAiScan = async () => {
    if (!aiScan.prompt.trim()) {
      alert("Vui lòng nhập tiêu chí quét!");
      return;
    }

    setAiScan({ ...aiScan, step: 'processing' });

    try {
      // Lấy employerId từ session storage
      const userStr = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
      const employerId = userStr ? JSON.parse(userStr).userId : null;

      const response = await axios.post(`${API_BASE_URL}/api/employer-ai/ai-scan`, {
        jobId: parseInt(id),
        prompt: aiScan.prompt,
        employerId: employerId
      });

      setTimeout(() => {
        setAiScan({ 
          ...aiScan, 
          step: 'preview', 
          results: response.data 
        });
      }, 1500);

    } catch (error) {
      console.error("Lỗi khi chạy AI Scan:", error);
      alert("Quá trình quét AI gặp lỗi. Vui lòng thử lại!");
      setAiScan({ ...aiScan, step: 'input' }); 
    }
  };

  const handleConfirmAiScan = async () => {
    try {
      alert("Đã hoàn tất quét và cập nhật điểm AI cho ứng viên!");
      setAiScan({ ...aiScan, isOpen: false, step: 'input' });
      
      // Load lại danh sách CV cực mượt mà không cần F5
      await fetchCandidates();
    } catch (error) {
       console.error("Lỗi khi xác nhận:", error);
    }
  };

  const filteredCandidates = candidates.filter(can => 
    (can.localStatus === activeTab) &&
    (can.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || can.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Link to={`/employer/jobs/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest mb-4 transition-all">
              <ChevronLeft size={16} /> Quay lại chi tiết bài đăng
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              Quản lý Ứng viên 
            </h1>
          </div>
          
          <button onClick={() => setAiScan({ ...aiScan, isOpen: true })} className="group relative px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center gap-2 uppercase tracking-widest text-xs">
              <Sparkles size={18} className="animate-pulse" /> AI Smart Scan
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 w-fit">
          {[
            { id: 'pending', label: 'Mới ứng tuyển', color: 'text-amber-600 bg-amber-50' },
            { id: 'interviewing', label: 'Đang phỏng vấn', color: 'text-blue-600 bg-blue-50' },
            { id: 'passed', label: 'Đã trúng tuyển', color: 'text-emerald-600 bg-emerald-50' },
            { id: 'rejected', label: 'Đã từ chối', color: 'text-rose-600 bg-rose-50' }
          ].map(tab => {
            const count = candidates.filter(c => c.localStatus === tab.id).length;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? tab.color + ' shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab.label} <span className="bg-white/50 px-2 py-0.5 rounded-md text-xs">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên ứng viên hoặc email..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:border-blue-500 outline-none transition-all font-medium text-slate-600 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Đang kết nối dữ liệu ứng viên...</div>
        ) : filteredCandidates.length > 0 ? (
          filteredCandidates.map((can) => (
            <motion.div 
              layout key={can.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 hover:border-blue-500/30 transition-all group shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col cursor-pointer"
              onClick={() => setCvModal({ isOpen: true, candidate: { ...can, cvUrl: getFullUrl(can.cvUrl) }})}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 p-1 group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                  {can.avatar ? (
                    <img src={getFullUrl(can.avatar)} className="w-full h-full object-cover rounded-xl" alt="avatar" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-xl">
                        {can.fullName?.charAt(0)}
                    </div>
                  )}
                </div>
                {can.localStatus === 'rejected' && can.rejectReason && (
                   <span className="max-w-[150px] text-right text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl truncate">
                     {can.rejectReason}
                   </span>
                )}
                {can.localStatus !== 'rejected' && (
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(can.localStatus)}`}>
                    {can.localStatus === 'pending' ? 'Mới ứng tuyển' : can.localStatus === 'interviewing' ? 'Đang Phỏng vấn' : 'Đã Trúng Tuyển'}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 truncate">{can.fullName}</h3>
              
              <div className="space-y-2 mb-8 flex-1">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Mail size={14} className="text-slate-300" /> {can.email}
                </p>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <Phone size={14} className="text-slate-300" /> {can.phone || "Chưa để lại SĐT"}
                </p>
              </div>

              <div className="mb-6 space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-16 text-xs font-bold text-slate-400">Phù hợp</div>
                   <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className={`h-full ${can.matchScore >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${can.matchScore || 0}%`}}></div>
                   </div>
                   <span className="w-10 text-right text-xs font-black text-slate-600">{can.matchScore || 0}%</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-16 text-xs font-bold text-slate-400">Độ tin cậy</div>
                   <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                     <div className={`h-full ${can.legitScore >= 80 ? 'bg-blue-500' : (can.legitScore >= 50 ? 'bg-amber-500' : 'bg-rose-500')}`} style={{ width: `${can.legitScore || 0}%`}}></div>
                   </div>
                   <span className="w-10 text-right text-xs font-black text-slate-600">{can.legitScore || 0}%</span>
                 </div>
              </div>

              {can.localStatus === 'pending' && (
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 mt-auto">
                  <button onClick={(e) => { e.stopPropagation(); setCvModal({ isOpen: true, candidate: { ...can, cvUrl: getFullUrl(can.cvUrl) }}); }} className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-all">
                    <Eye size={14} /> XEM CV
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEmailModal({ isOpen: true, candidate: can }); }} className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-600 font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                    <Mail size={14} /> LIÊN HỆ
                  </button>
                </div>
              )}

              {can.localStatus === 'interviewing' && (
                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 mt-auto">
                  <button onClick={(e) => { e.stopPropagation(); setEmailForm(prev => ({...prev, type: 'offer'})); setEmailModal({ isOpen: true, candidate: can }); }} className="flex items-center justify-center gap-1 py-3.5 bg-emerald-50 text-emerald-600 font-black text-[10px] rounded-xl uppercase hover:bg-emerald-600 hover:text-white transition-all">
                    <CheckCircle size={14}/> ĐẬU PV
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEmailForm(prev => ({...prev, type: 'reject'})); setEmailModal({ isOpen: true, candidate: can }); }} className="flex items-center justify-center gap-1 py-3.5 bg-rose-50 text-rose-600 font-black text-[10px] rounded-xl uppercase hover:bg-rose-600 hover:text-white transition-all">
                    <XCircle size={14}/> RỚT PV
                  </button>
                </div>
              )}

              {can.localStatus === 'passed' && (
                <div className="pt-6 border-t border-slate-50 mt-auto text-center">
                  <p className="text-sm font-black text-emerald-600 bg-emerald-50 py-3 rounded-xl uppercase tracking-widest">Đã xác nhận trúng tuyển</p>
                </div>
              )}

              {can.localStatus === 'rejected' && (
                <div className="pt-6 border-t border-slate-50 mt-auto text-center">
                  <p className="text-sm font-black text-rose-600 bg-rose-50 py-3 rounded-xl uppercase tracking-widest">Đã từ chối</p>
                </div>
              )}

            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-slate-200 inline-block">
                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold italic">Danh sách trống.</p>
            </div>
          </div>
        )}
      </div>

      <AiScanModal 
        aiScan={aiScan} 
        setAiScan={setAiScan} 
        startAiScan={handleStartAiScan} 
        confirmAiScan={handleConfirmAiScan} 
      />
      <CvModal
        cvModal={cvModal}
        closeCvModal={() => setCvModal({ isOpen: false, candidate: null })}
        openEmailModal={(can, type) => {
          if (type) setEmailForm(prev => ({ ...prev, type }));
          setEmailModal({ isOpen: true, candidate: can });
        }}
        getStatusStyle={getStatusStyle}
        onStatusChange={fetchCandidates}
      />
      <EmailModal emailModal={emailModal} closeEmailModal={() => setEmailModal({ isOpen: false, candidate: null })} emailForm={emailForm} setEmailForm={setEmailForm} handleSendEmailSubmit={handleSendEmailSubmit} />
    </div>
  );
};

export default CandidateMatching;