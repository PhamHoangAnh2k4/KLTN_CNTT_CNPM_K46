import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Shield, CheckCircle2, Ban, X,
  AlertOctagon, Clock, ListFilter,
  Mail, Phone, Star, Loader2, MapPin,
  Building, User, MessageSquare, Briefcase,
  DollarSign, GraduationCap, Image as ImageIcon, Tags, FileText,
  AlignLeft
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8081';

const ReportTab = () => {
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const [profileToView, setProfileToView] = useState(null);
  const [targetData, setTargetData] = useState(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);

  const getFirstMediaUrl = (mediaString) => {
    if (!mediaString) return null;
    try {
      if (String(mediaString).startsWith('data:')) {
        return mediaString;
      }
      let url = String(mediaString).split(',')[0].trim().replace(/['"]/g, '');
      if (url.startsWith('http')) return url;
      url = url.replace(/\\/g, '/');
      if (!url.startsWith('/')) url = '/' + url;
      url = url.replace('http://localhost:8081', '');
      return `${API_BASE_URL}${url}`;
    } catch (e) { return null; }
  };

  // Hàm xử lý ảnh: Lấy mảng ảnh (dùng cho bài đăng, bài review có nhiều ảnh)
  const getMediaArray = (mediaData) => {
    if (!mediaData) return [];

    if (Array.isArray(mediaData)) {
      return mediaData.map(url => {
        if (!url) return null;
        if (url.startsWith('data:')) return url;
        if (url.startsWith('http')) return url;
        let cleanUrl = url.replace(/\\/g, '/');
        if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
        return `${API_BASE_URL}${cleanUrl.replace('http://localhost:8081', '')}`;
      }).filter(Boolean);
    }

    let mediaString = String(mediaData);
    if (mediaString.startsWith('data:')) {
      return [mediaString];
    }

    try {
      return mediaString.split(',').map(url => {
        let cleanUrl = url.trim().replace(/['"]/g, '');
        if (!cleanUrl) return null;
        if (cleanUrl.startsWith('data:')) return cleanUrl;
        if (cleanUrl.startsWith('http')) return cleanUrl;
        cleanUrl = cleanUrl.replace(/\\/g, '/');
        if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
        return `${API_BASE_URL}${cleanUrl.replace('http://localhost:8081', '')}`;
      }).filter(Boolean);
    } catch (e) { return []; }
  };

  const isVideo = (url) => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/i) || url.includes('/videos/');
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports`);
      setReports(res.data || []);
    } catch (err) {
      console.error("Lỗi fetch reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const pendingReports = reports.filter(r => r.status !== 'Đã giải quyết');
  const resolvedReports = reports.filter(r => r.status === 'Đã giải quyết');
  const currentDisplayReports = activeTab === 'PENDING' ? pendingReports : resolvedReports;

  const handleViewDetail = (report) => {
    setProfileToView(report);
    fetchTargetDetails(report.targetType, report.targetId);
  };

  const fetchTargetDetails = async (type, id) => {
    setIsLoadingTarget(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/reports/target-details?targetType=${type}&targetId=${id}`);
      setTargetData(res.data);
    } catch (err) {
      setTargetData(null);
    } finally {
      setIsLoadingTarget(false);
    }
  };

  const handlePermanentlyRemove = async () => {
    if (!profileToView) return;
    if (!window.confirm("Xác nhận gỡ vĩnh viễn nội dung này? Hành động này không thể hoàn tác.")) return;

    const adminId = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount') || '{}')?.userId;

    try {
      await axios.put(`${API_BASE_URL}/api/admin/reports/${profileToView.id}/process`, {
        action: 'TAKEDOWN',
        adminId: adminId ? String(adminId) : null
      });

      setReports(prev => prev.map(r =>
        r.id === profileToView.id ? { ...r, status: 'Đã giải quyết' } : r
      ));

      setProfileToView(prev => ({ ...prev, status: 'Đã giải quyết' }));
      alert("✅ Đã xử lý gỡ nội dung thành công.");
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.error || "Server error"));
    }
  };

  // PHẦN HIỂN THỊ NỘI DUNG THỰC TẾ ĐỂ ADMIN KIỂM DUYỆT
  const renderTargetDetails = () => {
    if (!targetData || Object.keys(targetData).length === 0) {
      return (
        <div className="bg-white border border-rose-100 p-8 rounded-3xl text-center shadow-sm">
          <AlertOctagon size={48} className="text-rose-400 mx-auto mb-4" />
          <h4 className="font-black text-slate-900 mb-2 text-xl">Nội dung không tồn tại</h4>
          <p className="text-slate-500 text-sm font-medium">Nội dung này có thể đã bị hệ thống xóa hoặc ẩn trước đó.</p>
        </div>
      );
    }

    const rawType = String(profileToView?.targetType || '').toUpperCase();

    // 1. VI PHẠM TIN TUYỂN DỤNG / BÀI ĐĂNG (HIỆN FULL THÔNG TIN + ẢNH)
    if (rawType.includes('JOB') || rawType.includes('POST')) {
      let parsedMedia = getMediaArray(targetData.mediaUrls || targetData.images || targetData.bannerUrl || targetData.media);
      let parsedSkills = targetData.skills || targetData.tags ? String(targetData.skills || targetData.tags).split(',').filter(Boolean) : [];

      return (
        <div className="space-y-6">
          <div className="px-6 sm:px-8 py-6 border border-slate-100 bg-white rounded-[24px] flex flex-col sm:flex-row gap-6 items-start shadow-sm">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 font-extrabold text-3xl shadow-sm shrink-0 overflow-hidden">
              {(targetData.logoUrl || targetData.companyLogo || targetData.avatar) ? (
                <img src={getFirstMediaUrl(targetData.logoUrl || targetData.companyLogo || targetData.avatar)} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Building className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">{targetData.title || targetData.jobTitle || 'Tin tuyển dụng không có tiêu đề'}</h2>
              <p className="text-lg font-bold text-slate-500">{targetData.companyName || targetData.ownerName || targetData.company || 'Doanh nghiệp ẩn danh'}</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-100">
                  <DollarSign size={16} /> {targetData.salary || 'Thỏa thuận'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
                  <MapPin size={16} /> {targetData.location || targetData.workLocation || targetData.address || 'Toàn quốc'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold border border-purple-100">
                  <Briefcase size={16} /> {targetData.jobType || targetData.type || 'Toàn thời gian'}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold border border-amber-100">
                  <GraduationCap size={16} /> {targetData.experience || 'Không yêu cầu'}
                </span>
              </div>
            </div>
          </div>

          {/* Phần hiển thị ảnh bài đăng */}
          {parsedMedia.length > 0 && (
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> Hình ảnh / Video đính kèm
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {parsedMedia.map((url, idx) => {
                  return isVideo(url) ? (
                    <video key={idx} src={url} controls className="h-48 w-auto min-w-[250px] object-cover rounded-xl border border-slate-200 snap-center shadow-sm bg-slate-900" />
                  ) : (
                    <img key={idx} src={url} alt={`Media ${idx}`} className="h-48 w-auto min-w-[250px] object-cover rounded-xl border border-slate-200 snap-center shadow-sm" />
                  );
                })}
              </div>
            </div>
          )}

          {/* Phần Kỹ năng */}
          {parsedSkills.length > 0 && (
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                <Tags size={18} className="text-indigo-500" /> Yêu cầu chuyên môn
              </h3>
              <div className="flex flex-wrap gap-2">
                {parsedSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mô tả chi tiết & Yêu cầu */}
          <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlignLeft size={18} className="text-blue-500" /> Mô tả nội dung
              </h4>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {targetData.description || targetData.jobDescription || targetData.postContent || targetData.content || 'Nội dung trống.'}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 size={18} className="text-emerald-500" /> Yêu cầu khác
              </h4>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {targetData.requirements || targetData.otherRequirements || targetData.requirement || 'Không có yêu cầu đặc biệt.'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. VI PHẠM ĐÁNH GIÁ (REVIEW) - HIỆN FULL TEXT VÀ ẢNH REVIEW
    if (rawType.includes('REVIEW')) {
      let reviewMedia = getMediaArray(targetData.mediaUrls || targetData.images || targetData.attachedMedia || targetData.mediaUrl);

      return (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex flex-col items-center justify-center border border-amber-100 shadow-sm shrink-0">
                <span className="font-black text-2xl">{targetData.rating || targetData.stars || 5}</span>
                <Star size={14} className="fill-current mt-0.5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{targetData.title || targetData.reviewTitle || 'Đánh giá công ty'}</h3>
                <p className="text-slate-500 font-bold text-sm mt-1 flex items-center gap-2">
                  <User size={16} className="text-slate-400" /> {targetData.reviewerName || targetData.userName || targetData.ownerName || targetData.author || 'Người dùng ẩn danh'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-black text-slate-900 mb-3 uppercase tracking-widest text-xs text-slate-400 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" /> Nội dung đánh giá
              </h4>
              <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 font-medium leading-relaxed italic border border-slate-100 text-sm whitespace-pre-line">
                "{targetData.content || targetData.comment || targetData.description || targetData.reviewContent || 'Không có nội dung chữ'}"
              </div>
            </div>

            {/* Hiện ảnh do user đính kèm khi review */}
            {reviewMedia.length > 0 && (
              <div>
                <h4 className="font-black text-slate-900 mb-3 uppercase tracking-widest text-xs text-slate-400 flex items-center gap-2">
                  <ImageIcon size={16} className="text-blue-500" /> Hình ảnh đính kèm
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                  {reviewMedia.map((url, idx) => (
                    targetData.mediaType === 'video' || isVideo(url) ? (
                      <video
                        key={idx}
                        src={url}
                        controls
                        className="h-32 w-auto min-w-[150px] object-cover rounded-xl border border-slate-200 snap-center shadow-sm"
                      />
                    ) : (
                      <img
                        key={idx}
                        src={url}
                        className="h-32 w-auto min-w-[150px] object-cover rounded-xl border border-slate-200 snap-center shadow-sm"
                        alt={`Ảnh Review ${idx}`}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. VI PHẠM TÀI KHOẢN NHÀ TUYỂN DỤNG / CÔNG TY
    if (rawType.includes('EMPLOYER') || rawType.includes('COMPANY')) {
      return (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm">
            <div className="w-32 h-32 shrink-0 rounded-[24px] overflow-hidden border border-slate-100 shadow-sm bg-white flex items-center justify-center">
              {getFirstMediaUrl(targetData.logoUrl || targetData.avatarUrl) ? (
                <img src={getFirstMediaUrl(targetData.logoUrl || targetData.avatarUrl)} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Building size={40} className="text-slate-300" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-slate-900">{targetData.companyName || targetData.name || 'CÔNG TY KHÔNG XÁC ĐỊNH'}</h3>
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-slate-600 font-bold flex items-center justify-center md:justify-start gap-3 bg-slate-50 px-4 py-2 rounded-xl w-fit">
                  <Mail size={16} className="text-slate-400" /> {targetData.email || 'Không có email'}
                </p>
                <p className="text-slate-600 font-bold flex items-center justify-center md:justify-start gap-3 bg-slate-50 px-4 py-2 rounded-xl w-fit">
                  <Phone size={16} className="text-slate-400" /> {targetData.phone || 'Không có SĐT'}
                </p>
                <p className="text-slate-600 font-bold flex items-center justify-center md:justify-start gap-3 bg-slate-50 px-4 py-2 rounded-xl w-fit">
                  <MapPin size={16} className="text-slate-400" /> {targetData.address || 'Chưa cập nhật địa chỉ'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs text-slate-400">Giới thiệu công ty</h4>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm font-medium">{targetData.description || 'Chưa có thông tin giới thiệu.'}</p>
          </div>
        </div>
      );
    }

    // Default Fallback: Nếu không rơi vào các case trên, show dữ liệu gốc
    return (
      <div className="bg-white border border-slate-100 p-8 rounded-[24px] shadow-sm">
        <h4 className="font-black text-slate-900 mb-4 uppercase tracking-widest text-xs text-slate-400 border-b border-slate-100 pb-4">
          Dữ liệu gốc ({rawType})
        </h4>
        <pre className="text-xs text-slate-600 overflow-x-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
          {JSON.stringify(targetData, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="p-8 font-sans selection:bg-rose-100 bg-slate-50/50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shield className="text-rose-500" size={32} />
            Trung tâm Kiểm duyệt
          </h1>
          <p className="text-slate-500 font-bold mt-2 ml-11">Quản lý và thẩm định nội dung bị báo cáo vi phạm</p>
        </div>

        <div className="bg-white p-1.5 rounded-[20px] flex items-center gap-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            <Clock size={16} /> Chờ xử lý ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 shadow-md border border-emerald-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            <CheckCircle2 size={16} /> Đã giải quyết ({resolvedReports.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Đối tượng bị báo cáo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Lý do & Nội dung</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentDisplayReports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {report.targetType}
                      </span>
                      <span className="text-slate-400 font-bold text-[10px]">#{report.targetId}</span>
                    </div>
                    <p className="font-black text-slate-800 line-clamp-2 text-sm">{report.targetName}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-rose-600 text-[10px] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={12} /> {report.type}
                    </p>
                    <p className="text-slate-500 text-xs italic line-clamp-2 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                      "{report.description || 'Không có mô tả chi tiết'}"
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center justify-center px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border ${report.status === 'Đã giải quyết'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {report.status || 'Chờ xử lý'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button
                      onClick={() => handleViewDetail(report)}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95"
                    >
                      Kiểm tra
                    </button>
                  </td>
                </tr>
              ))}

              {isLoadingReports ? (
                <tr>
                  <td colSpan="4" className="text-center py-32 text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-rose-500" />
                      <p className="font-black uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : currentDisplayReports.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-32 text-slate-300">
                    <div className="flex flex-col items-center gap-4">
                      <ListFilter size={56} className="opacity-20" />
                      <p className="font-black uppercase tracking-widest text-sm text-slate-400">Hiện tại không có báo cáo nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {profileToView && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileToView(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-slate-50 rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-50 rounded-[20px] flex items-center justify-center text-rose-500 border border-rose-100 shadow-inner">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Thẩm định nội dung</h3>
                    <p className="text-slate-500 font-bold text-xs mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded-md">Báo cáo: #{profileToView.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileToView(null)}
                  className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar relative bg-slate-50">
                <div className="mb-8 p-6 bg-rose-50/50 border border-rose-100 rounded-[24px]">
                  <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertOctagon size={14} /> LÝ DO BÁO CÁO TỪ ỨNG VIÊN
                  </h4>
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-900 text-lg">{profileToView.type}</span>
                    <span className="text-slate-600 font-medium italic">"{profileToView.description || 'Không có mô tả bổ sung'}"</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 rounded-full"></div>
                  <div className="pl-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">NỘI DUNG THỰC TẾ TRÊN HỆ THỐNG</h4>
                    {isLoadingTarget ? (
                      <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-rose-500" size={40} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu gốc...</p>
                      </div>
                    ) : renderTargetDetails()}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-end items-center gap-4 z-20">
                <button
                  onClick={() => setProfileToView(null)}
                  className="px-6 py-4 font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl text-xs uppercase transition-all"
                >
                  Đóng
                </button>
                {profileToView.status !== 'Đã giải quyết' ? (
                  <button
                    onClick={handlePermanentlyRemove}
                    className="px-8 py-4 bg-rose-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-rose-200 flex items-center gap-3 hover:bg-rose-600 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <Ban size={18} /> Gỡ nội dung vi phạm
                  </button>
                ) : (
                  <div className="px-8 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl text-xs uppercase flex items-center gap-3 border-2 border-emerald-100">
                    <CheckCircle2 size={18} /> Nội dung này đã được gỡ
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default ReportTab;