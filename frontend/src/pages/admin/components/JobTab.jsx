import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Clock, Eye, CheckCircle2, XCircle, Check, X, 
  Briefcase, Paperclip, FileText, Building2, CircleDollarSign, 
  GraduationCap, Image as ImageIcon, Download
} from 'lucide-react';
import axios from 'axios'; 

const JobTab = ({ jobs = [], setJobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('Chờ duyệt');
  const [selectedJob, setSelectedJob] = useState(null);

  const API_BASE = "http://localhost:8081";
  const filters = ['Chờ duyệt', 'Tất cả', 'Đang hiển thị', 'Từ chối'];

  const filteredJobs = jobs.filter(job => {
    const realJobRow = job.rawJob || job;
    const title = job.title || realJobRow.title || '';
    const company = job.company || realJobRow.company || 'Chưa cập nhật';
    const status = job.status || realJobRow.status || 'Chờ duyệt';
    
    const normalizedStatus = status === 'Đã duyệt' ? 'Đang hiển thị' : status;

    const matchSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = jobFilter === 'Tất cả' || normalizedStatus === jobFilter;
    
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.id || 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.id || 0);
    return timeB - timeA;
  });

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    const adminId = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount') || '{}')?.userId;
    try {
      await axios.put(`${API_BASE}/api/admin/jobs/${jobId}/status`, {
        status: newStatus,
        adminId: adminId ? String(adminId) : null
      });
      
      const updatedJobs = jobs.map(job => (job.id === jobId || job.jobId === jobId) ? { ...job, status: newStatus } : job);
      setJobs(updatedJobs);
      setSelectedJob(null);
      alert(`✅ Đã chuyển trạng thái tin tuyển dụng thành: ${newStatus}`);
    } catch (error) {
      console.error("Lỗi cập nhật Job:", error);
      alert("❌ Đã xảy ra lỗi khi kết nối với máy chủ!");
    }
  };

  const getStatusUI = (status) => {
    const normStatus = status === 'Đã duyệt' ? 'Đang hiển thị' : status;
    switch (normStatus) {
      case 'Đang hiển thị': return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 };
      case 'Chờ duyệt': return { bg: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock };
      case 'Từ chối': return { bg: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
      default: return { bg: 'bg-slate-50 text-slate-600 border-slate-200', icon: Briefcase };
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col h-full w-full">
      
      {/* Header & Search */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Kiểm duyệt Việc làm</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và phê duyệt các bài đăng từ doanh nghiệp</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên bài đăng, công ty..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400" 
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-6 md:px-8 py-4 bg-white border-b border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar">
        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          {filters.map(filter => (
            <button 
              key={filter} 
              onClick={() => setJobFilter(filter)} 
              className={`relative px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap z-10 ${
                jobFilter === filter ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {jobFilter === filter && (
                <motion.div 
                  layoutId="jobTabFilter"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {filter}
              {filter === 'Chờ duyệt' && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${jobFilter === filter ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                  {jobs.filter(j => (j.status || j.rawJob?.status || 'Chờ duyệt') === 'Chờ duyệt').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bảng Dữ Liệu */}
      <div className="overflow-x-auto flex-1 min-h-0 w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest w-[40%]">Bài đăng / Doanh nghiệp</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Thông tin chung</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <Briefcase size={48} className="text-slate-400 mb-4" />
                      <p className="text-slate-600 font-bold text-lg">Không tìm thấy bài đăng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, index) => {
                  const realJobRow = job.rawJob || job;
                  const StatusIcon = getStatusUI(job.status || realJobRow.status).icon;
                  const title = job.title || realJobRow.title || "Chưa có tiêu đề";
                  const company = job.company || realJobRow.company || "Chưa cập nhật";
                  const salary = job.salary || realJobRow.salary || 'Thỏa thuận';
                  const location = job.location || realJobRow.workLocation || 'Toàn quốc';
                  const type = job.type || realJobRow.jobType || 'Toàn thời gian';
                  const status = job.status || realJobRow.status || 'Chờ duyệt';
                  
                  return (
                    <motion.tr 
                      key={job.id || job.jobId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/80 group transition-colors"
                    >
                      <td className="p-5">
                        <div className="flex gap-4 items-start">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                             <Building2 size={24} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">{title}</p>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-1"><Building2 size={14}/> {company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="space-y-2 text-xs font-bold text-slate-600">
                          <p className="flex items-center gap-2"><CircleDollarSign size={14} className="text-emerald-500"/> <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{salary}</span></p>
                          <p className="flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> {location}</p>
                          <p className="flex items-center gap-2"><Clock size={14} className="text-amber-500"/> {type}</p>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold uppercase tracking-wider ${getStatusUI(status).bg}`}>
                          <StatusIcon size={14}/> {status === 'Đã duyệt' ? 'Đang hiển thị' : status}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => setSelectedJob(job)} 
                          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 ml-auto active:scale-95"
                        >
                          <Eye size={16}/> Xem chi tiết
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modal / Popup Xem chi tiết */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50"
            >
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Briefcase size={20} /></div>
                  <h3 className="text-lg font-black text-slate-800">Chi tiết Tin Tuyển Dụng</h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 text-slate-400 hover:text-rose-50 hover:bg-rose-50 rounded-full transition-colors"><X size={24} /></button>
              </div>

              {/* DỮ LIỆU MODAL */}
              {(() => {
                const realJob = selectedJob.rawJob || selectedJob;
                
                // FIX LOGIC FILE ĐÍNH KÈM: Kiểm tra cả attachments mảng và documentUrl chuỗi
                const attachment = (realJob.attachments && realJob.attachments.length > 0) ? realJob.attachments[0] : null;
                const docUrl = attachment?.url || attachment?.fileUrl || realJob.documentUrl;
                const docName = attachment?.fileName || realJob.documentName || "Tai_lieu_chi_tiet.pdf";
                
                const bannerUrl = realJob.bannerUrl;
                const jobDesc = realJob.jobDescription || realJob.description || 'Chưa cập nhật mô tả';
                const jobReq = realJob.otherRequirements || realJob.requirements || 'Chưa cập nhật yêu cầu';
                const additionalInfo = realJob.additionalInfo || '';

                const title = selectedJob.title || realJob.title;
                const company = selectedJob.company || realJob.company || 'Chưa cập nhật doanh nghiệp';
                const status = selectedJob.status || realJob.status || 'Chờ duyệt';
                const salary = selectedJob.salary || realJob.salary || 'Thỏa thuận';
                const location = selectedJob.location || realJob.workLocation || 'Toàn quốc';
                const type = selectedJob.type || realJob.jobType || 'Toàn thời gian';
                const jobId = selectedJob.id || realJob.jobId;

                return (
                  <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                    
                    {/* Tiêu đề & Cty */}
                    <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{title}</h2>
                        <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
                          <Building2 size={24} /> {company}
                        </div>
                      </div>
                      <div className={`px-4 py-2 border rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusUI(status).bg}`}>
                        {React.createElement(getStatusUI(status).icon, { size: 18 })}
                        {status === 'Đã duyệt' ? 'Đang hiển thị' : status}
                      </div>
                    </div>

                    {/* Grid Thông tin nhanh */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Mức lương</p>
                          <p className="font-bold text-emerald-600">{salary}</p>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Địa điểm</p>
                          <p className="font-bold text-slate-700">{location}</p>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Hình thức</p>
                          <p className="font-bold text-slate-700">{type}</p>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Mã tin</p>
                          <p className="font-bold text-slate-700">#JOB-{jobId}</p>
                       </div>
                    </div>

                    {/* Nội dung chi tiết chính */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><FileText size={22} className="text-blue-500"/> Mô tả công việc</h4>
                        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[1.5rem] prose prose-sm prose-slate max-w-none">
                          <p className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">{jobDesc}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><CheckCircle2 size={22} className="text-emerald-500"/> Yêu cầu ứng viên</h4>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[1.5rem] prose prose-sm prose-slate max-w-none">
                          <p className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">{jobReq}</p>
                        </div>
                      </div>
                    </div>

                    {/* YÊU CẦU BỔ SUNG */}
                    {additionalInfo && (
                      <div className="pt-2">
                        <h4 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><GraduationCap size={22} className="text-purple-500"/> Yêu cầu bổ sung</h4>
                        <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-[1.5rem] prose prose-sm prose-slate max-w-none">
                          <p className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">{additionalInfo}</p>
                        </div>
                      </div>
                    )}

                    {/* FILE ĐÍNH KÈM (JD) */}
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="font-black text-sm text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" /> TÀI LIỆU ĐÍNH KÈM (JD)
                      </h4>
                      
                      {(docUrl && docUrl !== 'null') ? (
                        <div className="p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 break-all">
                                {docName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                File mô tả chi tiết công việc
                              </p>
                            </div>
                          </div>
                          
                          <a 
                            href={docUrl.startsWith('http') ? docUrl : `${API_BASE}${docUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 text-xs"
                          >
                            <Download size={14} /> XEM FILE
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 border-dashed text-center">
                           <p className="text-sm font-medium text-slate-500 italic">Nhà tuyển dụng không tải lên tài liệu đính kèm.</p>
                        </div>
                      )}
                    </div>

                    {/* HÌNH ẢNH / VIDEO ĐÍNH KÈM */}
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="font-black text-sm text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ImageIcon size={18} className="text-purple-500" /> Hình ảnh / Video đính kèm
                      </h4>
                      
                      {(bannerUrl && bannerUrl !== 'null') ? (
                        <div className="flex flex-wrap gap-4 mt-2">
                          {bannerUrl.split(',').filter(url => url.trim() !== '').map((url, index) => {
                            const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`; 
                            const isVideo = fullUrl.match(/\.(mp4|webm|ogg)$/i); 
                            
                            return isVideo ? (
                              <video 
                                key={index} 
                                src={fullUrl} 
                                controls 
                                className="h-40 w-auto object-cover rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                              />
                            ) : (
                              <img 
                                key={index} 
                                src={fullUrl} 
                                alt={`Đính kèm ${index + 1}`} 
                                className="h-40 w-auto object-cover rounded-xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 border-dashed text-center">
                           <p className="text-sm font-medium text-slate-500 italic">Không có hình ảnh/video đính kèm.</p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="px-8 py-5 bg-slate-50/80 backdrop-blur-xl border-t border-slate-200/60 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                {selectedJob.status !== 'Từ chối' && (
                  <button 
                    onClick={() => handleUpdateJobStatus(selectedJob.id || selectedJob.rawJob?.jobId, 'Từ chối')} 
                    className="px-6 py-3.5 bg-white text-rose-600 border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <X size={20} /> TỪ CHỐI ĐĂNG
                  </button>
                )}
                {(selectedJob.status !== 'Đang hiển thị' && selectedJob.status !== 'Đã duyệt') && (
                  <button 
                    onClick={() => handleUpdateJobStatus(selectedJob.id || selectedJob.rawJob?.jobId, 'Đang hiển thị')} 
                    className="px-8 py-3.5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Check size={20} /> PHÊ DUYỆT TIN NÀY
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobTab;