import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  X, Save, Image as ImageIcon, Video, Paperclip, Plus,
  MapPin, Briefcase, Wallet, Clock, Trash2, FileText,
  DollarSign, GraduationCap, Map
} from 'lucide-react';

const EditJobModal = ({ isOpen, onClose, onSave, jobData }) => {
  const [formData, setFormData] = useState({
    title: '', location: '', salary: '', experience: '',
    type: 'Toàn thời gian', description: '', requirements: '', skillInput: ''
  });

  const [skills, setSkills] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false);

  const salaryOptions = [
    "Thỏa thuận", "Dưới 5 Triệu", "5 - 10 Triệu", "10 - 15 Triệu",
    "15 - 20 Triệu", "20 - 25 Triệu", "25 - 30 Triệu", "Trên 30 Triệu"
  ];

  const API_BASE = "http://localhost:8081";

  // HIỂN THỊ TRƯỚC DỮ LIỆU CHỦ (DỮ LIỆU CŨ CỦA TIN)
  useEffect(() => {
    if (jobData && isOpen) {
      setFormData({
        title: jobData.title || '',
        location: jobData.location || jobData.workLocation || '',
        salary: jobData.salary || '',
        experience: jobData.experience || 'Không yêu cầu',
        type: jobData.type || jobData.jobType || 'Toàn thời gian',
        description: jobData.description || jobData.jobDescription || '',
        requirements: jobData.requirements || jobData.otherRequirements || '',
        skillInput: ''
      });

      // Load mảng Kỹ năng
      let oldSkills = [];
      if (Array.isArray(jobData.skills)) {
        oldSkills = jobData.skills;
      } else if (typeof jobData.skills === 'string' && jobData.skills.trim() !== '') {
        oldSkills = jobData.skills.split(',').map(s => s.trim());
      }
      setSkills(oldSkills);

      // Load ảnh/video cũ từ chuỗi bannerUrl
      if (jobData.bannerUrl && jobData.bannerUrl !== 'null') {
        setExistingMedia(jobData.bannerUrl.split(',').filter(u => u.trim() !== ""));
      } else {
        setExistingMedia([]);
      }
      setNewMediaFiles([]);
      setDocFile(null);
    }
  }, [jobData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- QUẢN LÝ KỸ NĂNG ---
  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    if (value.includes(',')) {
      const parts = value.split(',');
      const newSkills = parts.slice(0, -1)
        .map(s => s.trim().replace(/[.,\s]+$/, ''))
        .filter(s => s.length > 0);
      
      const lastPart = parts[parts.length - 1];
      
      if (newSkills.length > 0) {
        setSkills(prev => {
          const updated = [...prev];
          newSkills.forEach(s => {
            if (!updated.includes(s)) updated.push(s);
          });
          return updated;
        });
      }
      setFormData(prev => ({ ...prev, skillInput: lastPart }));
    } else {
      setFormData(prev => ({ ...prev, skillInput: value }));
    }
  };

  const handleSkillPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const parts = pastedText.split(',');
    const newSkills = parts
      .map(s => s.trim().replace(/[.,\s]+$/, ''))
      .filter(s => s.length > 0);
      
    if (newSkills.length > 0) {
      setSkills(prev => {
        const updated = [...prev];
        newSkills.forEach(s => {
          if (!updated.includes(s)) updated.push(s);
        });
        return updated;
      });
    }
    setFormData(prev => ({ ...prev, skillInput: '' }));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = formData.skillInput.trim().replace(',', '');
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill]);
        setFormData({ ...formData, skillInput: '' });
      }
    }
  };

  const removeSkill = (indexToRemove) => {
    setSkills(skills.filter((_, index) => index !== indexToRemove));
  };

  // --- QUẢN LÝ MEDIA ---
  const handleNewMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingMedia.length + newMediaFiles.length + files.length > 10) {
      alert("Bạn chỉ có thể lưu tối đa 10 ảnh/video");
      return;
    }
    setNewMediaFiles(prev => [...prev, ...files]);
  };

  const removeExistingMedia = (url) => {
    setExistingMedia(prev => prev.filter(u => u !== url));
  };

  const removeNewMedia = (index) => {
    setNewMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- HÀM SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // FIX: Lấy ID an toàn (hỗ trợ cả dạng id và jobId từ database)
      const jobId = jobData.id || jobData.jobId;

      if (!jobId) {
        alert("Lỗi: Không tìm thấy ID của tin tuyển dụng!");
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('workLocation', formData.location);
      formDataToSend.append('salary', formData.salary);
      formDataToSend.append('jobType', formData.type);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('jobDescription', formData.description);
      formDataToSend.append('otherRequirements', formData.requirements);
      formDataToSend.append('skills', skills.join(', '));

      formDataToSend.append('remainingMedia', existingMedia.join(','));

      newMediaFiles.forEach(file => {
        formDataToSend.append('newMediaFiles', file);
      });

      if (docFile) {
        formDataToSend.append('documentFile', docFile);
      }

      const response = await axios.put(`${API_BASE}/api/jobs/${jobId}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onSave) onSave(response.data);
      alert('✅ Cập nhật thành công!');
      onClose();
    } catch (error) {
      console.error('Lỗi:', error);
      alert('❌ Không thể cập nhật tin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[#F8FAFC] rounded-[2.5rem] w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-slate-200">

        {/* HEADER MODAL */}
        <div className="flex justify-between items-center px-8 py-6 bg-white border-b border-slate-100 z-10 shadow-sm shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chỉnh sửa tin tuyển dụng</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">Cập nhật thông tin chi tiết dựa trên dữ liệu cũ</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        {/* BODY (SCROLL) */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <form id="edit-job-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* CỘT TRÁI (THÔNG TIN CHÍNH + MÔ TẢ + MEDIA) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tiêu đề & Kỹ năng */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề vị trí tuyển dụng</label>
                  <input
                    type="text" name="title" required
                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-3 transition-all text-slate-800"
                    value={formData.title} onChange={handleChange}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kỹ năng trọng tâm</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                    {skills.map((skill, index) => (
                      <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl animate-in zoom-in-95">
                        {skill}
                        <button type="button" onClick={() => removeSkill(index)} className="hover:text-rose-400 transition-colors"><X size={14} /></button>
                      </span>
                    ))}
                     <input
                      type="text" name="skillInput"
                      placeholder="Nhấn Enter để thêm..."
                      className="flex-1 bg-transparent outline-none text-sm font-bold min-w-[150px]"
                      value={formData.skillInput}
                      onChange={handleSkillInputChange}
                      onKeyDown={handleAddSkill}
                      onPaste={handleSkillPaste}
                    />
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-black text-slate-400 text-[11px] uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={16} /> Hình ảnh làm việc & Video giới thiệu
                </h3>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {/* Ảnh cũ */}
                  {existingMedia.map((url, index) => (
                    <div key={`old-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                      {url.toLowerCase().match(/\.(mp4|mov|avi)$/i) || url.includes('/videos/') ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white"><Video size={24} /></div>
                      ) : (
                        <img src={`${API_BASE}${url}`} className="w-full h-full object-cover" alt="Old media" />
                      )}
                      <button type="button" onClick={() => removeExistingMedia(url)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-[9px] text-center text-white font-bold tracking-widest">CŨ</div>
                    </div>
                  ))}

                  {/* Ảnh mới */}
                  {newMediaFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-blue-200 group">
                      {file.type.startsWith('video/') ? (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-400"><Video size={24} /></div>
                      ) : (
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="New upload" />
                      )}
                      <button type="button" onClick={() => removeNewMedia(index)}
                        className="absolute top-2 right-2 p-1 bg-slate-800 text-white rounded-full">
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500/80 py-1 text-[9px] text-center text-white font-bold tracking-widest">MỚI</div>
                    </div>
                  ))}

                  {/* Nút upload */}
                  {(existingMedia.length + newMediaFiles.length) < 10 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-500">
                      <Plus size={24} />
                      <span className="text-[10px] font-black uppercase">Thêm</span>
                      <input type="file" multiple accept="image/*,video/*" hidden onChange={handleNewMediaChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Mô tả & Yêu cầu & File JD */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                    <Briefcase size={18} className="text-blue-500" /> Mô tả công việc
                  </h3>
                  <textarea
                    name="description" required rows="6"
                    className="w-full bg-slate-50/50 p-5 rounded-[1.5rem] focus:outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all font-medium leading-relaxed text-slate-700"
                    value={formData.description} onChange={handleChange}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                    <GraduationCap size={18} className="text-indigo-500" /> Yêu cầu ứng viên
                  </h3>
                  <textarea
                    name="requirements" rows="4"
                    className="w-full bg-slate-50/50 p-5 rounded-[1.5rem] focus:outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all font-medium text-slate-700"
                    value={formData.requirements} onChange={handleChange}
                  />
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm"><FileText size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">File JD chính thức</p>
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {docFile ? docFile.name : (jobData.documentName || "Chưa có tài liệu đính kèm")}
                    </p>
                  </div>
                  <label className="px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap">
                    THAY ĐỔI FILE
                    <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => setDocFile(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (THÔNG SỐ & ĐỊA ĐIỂM) */}
            <div className="space-y-6 lg:sticky lg:top-0 h-fit">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest border-b border-slate-50 pb-3">Thông số tuyển dụng</h3>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Lương hằng tháng</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text" name="salary" required autoComplete="off"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-bold text-sm transition-all"
                        value={formData.salary} onChange={handleChange}
                        onFocus={() => setShowSalaryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSalaryDropdown(false), 200)}
                      />
                      {showSalaryDropdown && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl mt-2 z-50 overflow-hidden">
                          {salaryOptions.map(opt => (
                            <button key={opt} type="button"
                              className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                              onMouseDown={() => setFormData({ ...formData, salary: opt })}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Hình thức</label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select name="type" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm appearance-none outline-none focus:bg-white cursor-pointer" value={formData.type} onChange={handleChange}>
                        <option>Toàn thời gian</option><option>Bán thời gian</option><option>Thực tập sinh</option><option>Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Kinh nghiệm</label>
                    <div className="relative">
                      <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select name="experience" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm appearance-none outline-none focus:bg-white cursor-pointer" value={formData.experience} onChange={handleChange}>
                        <option>Không yêu cầu</option><option>Dưới 1 năm</option><option>1 - 3 năm</option><option>3 - 5 năm</option><option>Trên 5 năm</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={18} className="text-rose-500" /> Địa điểm làm việc
                </h3>
                <input
                  type="text" name="location" required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-bold text-sm transition-all"
                  value={formData.location} onChange={handleChange}
                />
                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative">
                  {formData.location.length > 5 ? (
                    <iframe
                      width="100%" height="100%" frameBorder="0" title="Work Location"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                      <Map size={32} className="mb-2 opacity-20" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Bản đồ tự động</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER MODAL (BUTTONS) */}
        <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end gap-4 shrink-0">
          <button onClick={onClose} className="px-8 py-3.5 text-slate-500 font-black text-sm hover:bg-slate-100 rounded-2xl transition-all">
            HỦY BỎ
          </button>
          <button type="submit" form="edit-job-form" disabled={isSubmitting}
            className="flex items-center gap-2 px-10 py-3.5 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? "ĐANG LƯU..." : <><Save size={18} /> LƯU THAY ĐỔI</>}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default EditJobModal;