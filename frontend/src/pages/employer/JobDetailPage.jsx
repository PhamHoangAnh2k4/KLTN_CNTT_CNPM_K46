import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, MapPin, Briefcase, DollarSign, Clock,
  Users, Edit, Trash2, CheckCircle2,
  AlertTriangle, FileText, Map, Award, Tags,
  Download, Eye, Video, FileSpreadsheet, File as FileIcon, Maximize2, X, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import EditJobModal from './EditJobModal';
// --- IMPORT FILE MODALS CỦA BẠN ---
import { CvModal, EmailModal } from './CandidateModals';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE CHO CANDIDATE MODALS ---
  const [cvModal, setCvModal] = useState({ isOpen: false, candidate: null });
  const [emailModal, setEmailModal] = useState({ isOpen: false, candidate: null });
  const [emailForm, setEmailForm] = useState({ type: 'interview', locationOrLink: '', datetime: '', rejectReason: '' });

  const API_BASE_URL = "http://localhost:8081";

  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/i) || url.includes('/videos/');
  };

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/${id}`);
        const data = response.data;

        setJob({
          ...data,
          id: id,
          description: data.jobDescription,
          requirements: data.otherRequirements,
          location: data.workLocation,
          type: data.jobType,
          bannerUrl: data.bannerUrl || null,
          documentUrl: data.documentUrl ? `${API_BASE_URL}${data.documentUrl}` : null,
          documentName: data.documentName,
          postedTime: data.createdAt ? formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: vi }) : 'Vừa xong',
          views: data.viewCount || 0,
          applicants: data.applyCount || 0,
          status: data.status // Đã bổ sung lấy status từ backend
        });
      } catch (error) {
        console.error("Lỗi tải chi tiết công việc:", error);
      }
    };
    fetchJobDetail();
  }, [id]);

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/jobs/${id}`);
      navigate('/employer');
    } catch (error) {
      alert("Không thể xóa tin.");
    } finally { setIsDeleting(false); }
  };

  const getFileConfig = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (ext === 'pdf') return { icon: <FileText size={28} />, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Tài liệu PDF' };
    return { icon: <FileIcon size={28} />, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Tài liệu Word' };
  };

  // Logic Render Gallery
  const renderMediaGallery = () => {
    if (!job.bannerUrl || job.bannerUrl.includes('null')) return null;
    const urls = job.bannerUrl.split(',').filter(u => u.trim() !== "");
    const displayUrls = urls.slice(0, 2);
    const remainCount = urls.length - 2;

    return (
      <div className={`grid gap-2 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-white h-[450px] ${urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {displayUrls.map((url, idx) => (
          <div key={idx} className="relative h-full w-full group cursor-zoom-in overflow-hidden" onClick={() => { setSelectedMediaIndex(idx); setShowFullImage(true); }}>
            {isVideo(url) ? (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <video src={`${API_BASE_URL}${url}`} className="w-full h-full object-cover opacity-80" />
                <Play className="absolute text-white fill-white" size={48} />
              </div>
            ) : (
              <img src={`${API_BASE_URL}${url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Job Media" />
            )}
            {idx === 1 && remainCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white text-4xl font-black">+{remainCount}</span></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!job) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 font-sans relative">
      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8 relative z-10">

        {/* ======================================================= */}
        {/* BƯỚC CHẶN 3: CẢNH BÁO TIN CHỜ DUYỆT TRONG TRANG CHI TIẾT */}
        {/* ======================================================= */}
        {job.status === 'Chờ duyệt' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm animate-pulse">
            <AlertTriangle size={28} className="text-amber-500 shrink-0" />
            <div>
              <h4 className="font-bold text-lg">Tin tuyển dụng đang chờ kiểm duyệt</h4>
              <p className="text-sm font-medium opacity-80">Ứng viên sẽ không thể nhìn thấy hoặc ứng tuyển vào bài đăng này cho đến khi Admin phê duyệt.</p>
            </div>
          </div>
        )}

        {/* TOP ACTION BAR */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/employer" className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{job.title}</h1>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                <span><Eye size={14} className="inline mr-1" /> {job.views} lượt xem</span>
                <span className="text-blue-600">{job.postedTime}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Chuyển hướng đến trang danh sách ứng viên của Job này */}
            <Link to={`/employer/jobs/${id}/candidates`} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all ${job.status === 'Chờ duyệt'
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}>
              <Users size={18} /> Danh sách Ứng viên ({job.applicants})
            </Link>

            <button onClick={() => setIsEditModalOpen(true)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 shadow-sm"><Edit size={20} /></button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white shadow-sm transition-all"><Trash2 size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {renderMediaGallery()}

            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full"></div> Thông tin chi tiết
              </h3>

              <div className="space-y-10">
                <section>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Mô tả công việc</h4>
                  <p className="text-slate-700 leading-loose whitespace-pre-line font-medium text-lg">{job.description}</p>
                </section>
                <section>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Yêu cầu ứng viên</h4>
                  <p className="text-slate-700 leading-loose whitespace-pre-line font-medium text-lg">{job.requirements}</p>
                </section>
                <section>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Kỹ năng</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.split(',').map((s, i) => (
                      <span key={i} className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold border border-slate-100">{s.trim()}</span>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* FILE ĐÍNH KÈM */}
            {job.documentUrl && !job.documentUrl.includes('null') && (
              <div className={`p-8 rounded-[2.5rem] border ${getFileConfig(job.documentName).bg} border-white shadow-sm`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-5 rounded-2xl bg-white shadow-sm ${getFileConfig(job.documentName).color}`}>{getFileConfig(job.documentName).icon}</div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{getFileConfig(job.documentName).label}</span>
                      <h3 className="text-xl font-black text-slate-800 break-all">{job.documentName}</h3>
                    </div>
                  </div>
                  <a href={job.documentUrl} target="_blank" rel="noreferrer" download className="px-6 py-4 bg-white text-slate-900 font-bold rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                    <Download size={20} className="inline mr-2" /> Tải tài liệu
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR PHẢI */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl sticky top-10">
              <h3 className="text-lg font-black mb-8 border-b border-white/10 pb-4 uppercase">Tóm tắt</h3>
              <div className="space-y-8">
                {[
                  { icon: <DollarSign className="text-emerald-400" />, label: "Lương", value: job.salary },
                  { icon: <MapPin className="text-rose-400" />, label: "Địa điểm", value: job.location },
                  { icon: <Briefcase className="text-blue-400" />, label: "Hình thức", value: job.type },
                  { icon: <Clock className="text-amber-400" />, label: "Kinh nghiệm", value: job.experience },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{item.label}</p>
                      <p className="font-bold text-slate-100">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal sửa tin */}
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        jobData={job}
        onSave={(updated) => setJob({ ...job, ...updated })}
      />

      {/* 2. Modal xác nhận xóa */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center">
              <AlertTriangle size={40} className="text-rose-500 mx-auto mb-6" />
              <h2 className="text-2xl font-black mb-2">Xác nhận xóa?</h2>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">Hủy</button>
                <button onClick={handleDeleteJob} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black">Xóa ngay</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal xem ảnh/video Full */}
      <AnimatePresence>
        {showFullImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4">
            <button className="absolute top-10 right-10 text-white" onClick={() => setShowFullImage(false)}><X size={32} /></button>
            <div className="w-full max-w-5xl h-[80vh] flex items-center justify-center">
              {(() => {
                const urls = job.bannerUrl.split(',');
                const currentUrl = urls[selectedMediaIndex];
                return isVideo(currentUrl)
                  ? <video src={`${API_BASE_URL}${currentUrl}`} controls autoPlay className="max-h-full rounded-lg" />
                  : <img src={`${API_BASE_URL}${currentUrl}`} className="max-h-full object-contain rounded-lg" alt="Full" />;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. TÍCH HỢP MODALS ỨNG VIÊN (Sử dụng File CandidateModals.jsx) */}
      <CvModal
        cvModal={cvModal}
        closeCvModal={() => setCvModal({ isOpen: false, candidate: null })}
        openEmailModal={(candidate, type) => {
          if (type) setEmailForm(prev => ({ ...prev, type }));
          setEmailModal({ isOpen: true, candidate });
        }}
        getStatusStyle={(status) => 'bg-blue-100 text-blue-600'}
        onStatusChange={() => {}}
      />
      <EmailModal
        emailModal={emailModal}
        closeEmailModal={() => setEmailModal({ isOpen: false, candidate: null })}
        emailForm={emailForm}
        setEmailForm={setEmailForm}
      />
    </div>
  );
};

export default JobDetailPage;