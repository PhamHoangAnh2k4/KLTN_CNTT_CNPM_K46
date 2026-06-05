import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, MapPin, Map, Sparkles, Plus,
  Image as ImageIcon, X, Video,
  Briefcase, DollarSign, Clock, GraduationCap, FileText, Loader2
} from 'lucide-react';
import axios from 'axios';

const CreateJobPage = () => {
  const navigate = useNavigate();

  // 🛡️ Lấy thông tin user an toàn
  const user = JSON.parse(sessionStorage.getItem('userAccount')) ||
    JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('userAccount')) || {};

  const [formData, setFormData] = useState({
    title: '', location: '', type: 'Toàn thời gian',
    salary: '', experience: 'Không yêu cầu',
    description: '', requirements: '',
    skillInput: ''
  });

  const [skills, setSkills] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [showSalaryDropdown, setShowSalaryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const salaryOptions = [
    "Thỏa thuận", "Dưới 5 Triệu", "5 - 10 Triệu", "10 - 15 Triệu",
    "15 - 20 Triệu", "20 - 25 Triệu", "25 - 30 Triệu", "Trên 30 Triệu"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- QUẢN LÝ KỸ NĂNG ---
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
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    // Giới hạn tối đa 10 file
    if (mediaFiles.length + files.length > 10) {
      alert("Bạn chỉ có thể tải lên tối đa 10 ảnh/video");
      return;
    }
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [isGeneratingJD, setIsGeneratingJD] = useState(false);

  const handleAIGenerateJD = async (e) => {
    e.preventDefault();
    if (!formData.description && !formData.requirements) {
      alert("Vui lòng nhập bản nháp Mô tả hoặc Yêu cầu công việc trước khi tối ưu!");
      return;
    }

    setIsGeneratingJD(true);

    try {
      const res = await axios.post("http://localhost:8081/api/employer-ai/optimize-jd", {
        description: formData.description,
        requirements: formData.requirements
      });

      if (res.data) {
        if (window.confirm("AI đã tối ưu xong. Bạn có muốn cập nhật ghi đè nội dung mới này không?")) {
            setFormData(prev => ({
              ...prev,
              description: res.data.description || prev.description,
              requirements: res.data.requirements || prev.requirements
            }));
        }
      }
    } catch (err) {
      console.error("Lỗi khi tối ưu JD bằng AI:", err);
      alert("Không thể kết nối tới server AI để tối ưu JD. Vui lòng thử lại!");
    } finally {
      setIsGeneratingJD(false);
    }
  };

  // --- HÀM SUBMIT CHÍNH ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const currentUserId = user.userId;
    if (!currentUserId) {
      alert("Vui lòng đăng nhập lại để thực hiện chức năng này.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();

      // 1. Thông tin cơ bản
      data.append('employerId', currentUserId);
      data.append('title', formData.title);
      data.append('skills', skills.join(', '));
      data.append('jobDescription', formData.description);
      data.append('otherRequirements', formData.requirements);
      data.append('salary', formData.salary);
      data.append('jobType', formData.type);
      data.append('experience', formData.experience);
      data.append('workLocation', formData.location);

      // ĐÃ SỬA: Đặt trạng thái mặc định từ FE là "Chờ duyệt" thay vì "Đang hiển thị"
      data.append('status', "Chờ duyệt");

      // 2. File đa phương tiện (Ảnh/Video)
      mediaFiles.forEach(file => {
        data.append('newMediaFiles', file);
      });

      // 3. Tài liệu JD
      if (docFile) {
        data.append('documentFile', docFile);
      }

      await axios.post('http://localhost:8081/api/jobs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // ĐÃ SỬA: Thay đổi câu thông báo rõ ràng cho Nhà tuyển dụng
      alert('🎉 Đăng tin thành công! Tin tuyển dụng của bạn đã được gửi và đang CHỜ ADMIN DUYỆT.');
      navigate('/employer');
    } catch (error) {
      console.error("Lỗi Post Job:", error);
      alert('Không thể đăng tin. Vui lòng kiểm tra lại thông tin hoặc kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/employer" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500 active:scale-90">
              <ArrowLeft size={22} />
            </Link>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Đăng tin mới</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Optimized</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề vị trí tuyển dụng</label>
                <input
                  type="text" name="title" required
                  placeholder="VD: Senior Frontend Developer (ReactJS)"
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-3 transition-all placeholder:text-slate-200"
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
                    value={formData.skillInput} onChange={handleChange} onKeyDown={handleAddSkill}
                  />
                </div>
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
              <h3 className="font-black text-slate-400 text-[11px] uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={16} /> Hình ảnh làm việc & Video giới thiệu
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50">
                    {file.type.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-900">
                        <Video size={32} className="text-white/50" />
                      </div>
                    ) : (
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                    )}
                    <button
                      type="button" onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full hover:bg-rose-500 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {mediaFiles.length < 10 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-slate-400">
                      <Plus size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Tải lên</span>
                    <input type="file" multiple accept="image/*,video/*" hidden onChange={handleMediaChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                    <Briefcase size={18} className="text-blue-500" /> Mô tả công việc
                  </h3>
                  <button
                    onClick={handleAIGenerateJD}
                    disabled={isGeneratingJD}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium text-white transition-all duration-300 shadow-md flex items-center gap-2 ${isGeneratingJD
                      ? "bg-gray-400 cursor-not-allowed animate-pulse"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg hover:scale-105"
                      }`}
                  >
                    {isGeneratingJD ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tối ưu...
                      </>
                    ) : (
                      "✨ Tối ưu hóa với AI"
                    )}
                  </button>
                </div>
                <textarea
                  name="description" required rows="6"
                  placeholder="Mô tả chi tiết các đầu việc, quy trình..."
                  className="w-full bg-slate-50/50 p-5 rounded-[1.5rem] focus:outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all font-medium leading-relaxed"
                  value={formData.description} onChange={handleChange}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                  <GraduationCap size={18} className="text-indigo-500" /> Yêu cầu ứng viên
                </h3>
                <textarea
                  name="requirements" rows="4"
                  placeholder="Kinh nghiệm tối thiểu, bằng cấp, thái độ..."
                  className="w-full bg-slate-50/50 p-5 rounded-[1.5rem] focus:outline-none focus:bg-white border border-transparent focus:border-slate-200 transition-all font-medium"
                  value={formData.requirements} onChange={handleChange}
                />
              </div>

              {/* JD Document */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm"><FileText size={20} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">File JD chính thức</p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {docFile ? docFile.name : "Đính kèm file chi tiết (.pdf, .doc)"}
                  </p>
                </div>
                <label className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-600 transition-all whitespace-nowrap active:scale-95">
                  CHỌN FILE
                  <input type="file" hidden accept=".pdf,.doc,.docx" onChange={(e) => setDocFile(e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
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
                      <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl mt-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {salaryOptions.map(opt => (
                          <button
                            key={opt} type="button"
                            className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onMouseDown={() => setFormData({ ...formData, salary: opt })}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
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
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <MapPin size={18} className="text-rose-500" /> Địa điểm làm việc
              </h3>
              <input
                type="text" name="location" required
                placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white font-bold text-sm transition-all"
                value={formData.location} onChange={handleChange}
              />
              <div className="aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative">
                {formData.location.length > 5 ? (
                  <iframe
                    width="100%" height="100%" frameBorder="0"
                    title="Work Location"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <Map size={32} className="mb-2 opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Bản đồ tự động xác nhận</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-500/25 disabled:opacity-70 active:scale-[0.98] group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <><Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> ĐĂNG TIN NGAY</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobPage;