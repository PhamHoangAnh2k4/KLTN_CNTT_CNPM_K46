'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Star, Image as ImageIcon, X, MoreHorizontal, Flag, 
  MapPin, Quote, ThumbsUp, MessageCircle, Send, CheckCircle2, 
  Play, Film, Maximize2, AlertTriangle, Info, Sparkles, Zap, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ReviewsTab = ({ currentUser, setSelectedCompany }) => {
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [companyTag, setCompanyTag] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [posts, setPosts] = useState([]);
  
  const API_BASE_URL = "http://localhost:8081/api/reviews"; 

  // Media State
  const [postMedia, setPostMedia] = useState(null); 
  const [mediaFile, setMediaFile] = useState(null); 
  const [mediaType, setMediaType] = useState(null); 
  
  // Lightbox & Report State
  const [selectedLightbox, setSelectedLightbox] = useState(null);
  const [reportModal, setReportModal] = useState({ isOpen: false, postId: null });
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ==========================================
  // LẤY THÔNG TIN USER TỪ SESSION CHUẨN
  // ==========================================
  const getActiveUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount');
    return localUser ? JSON.parse(localUser) : null;
  };

  const activeUser = getActiveUser() || currentUser || {};
  const userAvatar = activeUser?.avatar || null;
  const userName = activeUser?.fullName || activeUser?.name || 'Ứng viên';
  const userId = activeUser?.userId || activeUser?.id || 1; 

  const reportReasons = [
    { id: 'Ngôn từ đả kích, thù ghét', label: 'Ngôn từ đả kích, thù ghét', icon: '🤬' },
    { id: 'Thông tin sai sự thật', label: 'Thông tin sai sự thật', icon: '🚫' },
    { id: 'Spam / Quảng cáo rác', label: 'Spam / Quảng cáo rác', icon: '🗑️' },
    { id: 'Nội dung không phù hợp', label: 'Nội dung không phù hợp', icon: '🔞' },
  ];

  // 1. LẤY DỮ LIỆU TỪ BACKEND
  useEffect(() => {
    fetchReviews();
  }, []);

  // Tự động tìm kiếm gợi ý công ty từ Database
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (companyTag.trim().length > 0) {
        try {
          const response = await axios.get(`http://localhost:8081/api/employer-profiles/search`, {
            params: { query: companyTag }
          });
          setCompanySuggestions(response.data);
        } catch (error) {
          console.error("Lỗi khi tìm kiếm công ty:", error);
        }
      } else {
        setCompanySuggestions([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [companyTag]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/all`);
      setPosts(response.data);
    } catch (error) {
      console.error("Lỗi lấy bài viết:", error);
    }
  };

  // ==========================================
  // XỬ LÝ ẢNH/VIDEO DÙNG OBJECT URL (TRÁNH CRASH MEMORY BỞI BASE64)
  // ==========================================
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');
      setMediaFile(file); 
      
      const objectUrl = URL.createObjectURL(file);
      setPostMedia(objectUrl); // Dùng Object URL để preview nhanh không tốn ram
    }
  };

  const handleRemoveMedia = () => {
    if (postMedia && postMedia.startsWith('blob:')) {
      URL.revokeObjectURL(postMedia);
    }
    setPostMedia(null);
    setMediaFile(null);
    setMediaType(null);
  };

  // 2. ĐĂNG BÀI VIẾT LÊN BACKEND (UPLOAD FILE ĐỘC LẬP QUA FORM DATA)
  const handlePostReview = async () => {
    if (!newReview || !companyTag || rating === 0) {
      return alert('Vui lòng nhập đủ thông tin (Công ty, Số sao, Nội dung)!');
    }
    
    const tempId = Date.now();
    const newPost = {
      id: tempId,
      user: { name: userName, avatar: userAvatar, title: activeUser?.title || 'Ứng viên' },
      company: companyTag,
      rating: rating,
      content: newReview,
      media: postMedia, 
      mediaType: mediaType,
      time: 'Vừa xong',
      likes: 0,
      comments: [],
      showComments: false, showMenu: false, isLiked: false
    };

    setPosts([newPost, ...posts]);

    const tempMedia = postMedia;
    const tempFile = mediaFile;
    const tempMediaType = mediaType;
    const tempReview = newReview;
    const tempCompany = companyTag;
    const tempRating = rating;

    setNewReview(''); setRating(0); setCompanyTag(''); setPostMedia(null); setMediaType(null); setMediaFile(null);

    try {
      let finalMediaUrl = null;
      if (tempFile) {
        const formData = new FormData();
        formData.append('file', tempFile);
        const uploadRes = await axios.post("http://localhost:8081/api/reviews/upload-media", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalMediaUrl = uploadRes.data.url;
      }

      const payload = {
        userId: Number(userId), 
        companyName: tempCompany.trim(),
        rating: Number(tempRating),
        content: tempReview.trim(),
        mediaUrl: finalMediaUrl,
        mediaType: tempMediaType
      };

      await axios.post(`${API_BASE_URL}/add`, payload);
      if (tempMedia && tempMedia.startsWith('blob:')) {
        URL.revokeObjectURL(tempMedia);
      }
      fetchReviews(); 
    } catch (error) {
      console.error("Lỗi đăng bài:", error.response?.data || error);
      alert("Đăng bài thất bại, vui lòng kiểm tra kết nối!");
      fetchReviews(); 
    }
  };

  const toggleMenu = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showMenu: !p.showMenu } : { ...p, showMenu: false }));
  };

  const handleLike = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const isCurrentlyLiked = p.isLiked;
        return { ...p, likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1, isLiked: !isCurrentlyLiked };
      }
      return p;
    }));
  };

  const toggleComments = (postId) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleSendComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    
    const newComment = { 
      id: Date.now(), 
      user: userName, 
      avatar: userAvatar, 
      content: text 
    };
    
    setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment], showComments: true } : p));
    setCommentTexts({ ...commentTexts, [postId]: '' });

    try {
      await axios.post(`${API_BASE_URL}/comment/add`, {
        reviewId: Number(postId),
        userId: Number(userId),
        content: text.trim()
      });
      fetchReviews(); 
    } catch (error) {
      console.error("Lỗi gửi bình luận:", error);
    }
  };

  const handleDeleteReview = async (postId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đánh giá này? Hành động này sẽ xóa cả các bình luận liên quan.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/${postId}`, {
        params: { userId: Number(userId) }
      });
      alert("Xóa bài đánh giá thành công!");
      fetchReviews();
    } catch (error) {
      console.error("Lỗi xóa bài viết:", error.response?.data || error);
      alert("Xóa bài viết thất bại: " + (error.response?.data?.error || error.message));
    }
  };

  const handleViewCompany = async (companyName) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/employer-profiles/by-name`, {
        params: { name: companyName }
      });
      const profile = response.data;
      setSelectedCompany({
        company: profile.companyName,
        logoText: profile.companyName.substring(0, 2).toUpperCase(),
        logo: profile.companyLogo ? `http://localhost:8081${profile.companyLogo}` : null,
        companySize: profile.companySize,
        website: profile.website,
        location: profile.address || 'Chưa cập nhật địa chỉ',
        description: profile.description || 'Thông tin giới thiệu đang được cập nhật...'
      });
    } catch (error) {
      console.warn("Không tìm thấy profile công ty trong DB, sử dụng dữ liệu mặc định:", error);
      setSelectedCompany({
        company: companyName,
        logoText: companyName.substring(0, 2).toUpperCase(),
        logo: null,
        companySize: 'N/A',
        website: '#',
        location: 'Đang cập nhật...',
        description: `Thông tin về công ty ${companyName}`
      });
    }
  };

  const openReportModal = (postId) => {
    setReportModal({ isOpen: true, postId });
    toggleMenu(postId); 
  };

  const closeReportModal = () => {
    setReportModal({ isOpen: false, postId: null });
    setTimeout(() => {
      setReportReason('');
      setReportDetail('');
    }, 300);
  };

  const submitReport = async () => {
    if (!reportReason) return;
    setIsSubmittingReport(true);

    try {
      const postToReport = posts.find(p => p.id === reportModal.postId);
      
      await axios.post('http://localhost:8081/api/reports/add', {
        userId: userId,
        userName: userName,
        reason: reportReason, 
        details: reportDetail,
        targetType: 'EMPLOYER_REVIEW', 
        targetId: postToReport.id,
        targetName: `Đánh giá về công ty ${postToReport.company}` 
      });

      setIsSubmittingReport(false);
      closeReportModal();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Lỗi khi gửi báo cáo review:", error);
      alert("❌ Có lỗi xảy ra. Không thể gửi báo cáo lúc này.");
      setIsSubmittingReport(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="space-y-8 font-sans relative">
      
      {/* Box Đăng Bài - Luxury Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden"
      >
        {/* Subtle decorative gradient orb */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex gap-4 items-start mb-6 relative z-10">
          {/* Avatar User Đăng Bài */}
          <div className="relative shrink-0">
            {userAvatar && !userAvatar.includes('pravatar') ? (
              <img src={userAvatar} alt="User" className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold text-lg uppercase">
                {userName.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex-1">
            <textarea
              rows="3" value={newReview} onChange={(e) => setNewReview(e.target.value)}
              placeholder={`${userName} ơi, hãy chia sẻ trải nghiệm làm việc hoặc đánh giá công ty nhé...`}
              className="w-full bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all resize-none font-medium text-sm"
            ></textarea>

            {postMedia && (
              <div className="relative mt-3 inline-block group">
                {mediaType === 'image' ? (
                  <img src={postMedia} alt="Preview" className="h-40 rounded-xl border border-slate-100 object-cover shadow-sm transition-transform group-hover:scale-[1.02]" />
                ) : (
                  <div className="relative h-40 w-72 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                    <video src={postMedia} className="h-full w-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <Play className="text-white fill-white" size={32} />
                    </div>
                  </div>
                )}
                <button onClick={handleRemoveMedia} className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md z-10">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between pt-2 relative z-10">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Công ty Input */}
            <div className="relative w-full sm:w-60">
              <div className="flex items-center bg-slate-50 border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 ring-blue-500/5 px-4 py-2.5 rounded-xl w-full transition-all">
                <Building2 size={16} className="text-blue-500 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Gõ tên công ty..." 
                  value={companyTag} 
                  onChange={(e) => {
                    setCompanyTag(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                  className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium" 
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && companySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto z-50 py-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {companySuggestions.map((item) => (
                    <div
                      key={item.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCompanyTag(item.companyName);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      {item.logo ? (
                        <img src={`http://localhost:8081${item.logo}`} alt={item.companyName} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs uppercase border border-slate-100">
                          {item.companyName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-bold text-slate-800 text-xs">{item.companyName}</div>
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">{item.address || 'Chưa cập nhật địa chỉ'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Upload Media Button */}
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors font-bold text-xs">
              <ImageIcon size={16} className="text-blue-600"/> Ảnh / <Film size={16} className="text-indigo-600"/> Video
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
            </label>
            
            {/* Star Rating */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} size={18} 
                  className={`cursor-pointer transition-transform hover:scale-120 ${ (hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200' }`} 
                  onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} 
                />
              ))}
            </div>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handlePostReview} disabled={!newReview || !companyTag || rating === 0} 
            className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Send size={14} /> ĐĂNG BÀI
          </motion.button>
        </div>
      </motion.div>

      {/* Danh sách bài đăng - Có Animation Stagger */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {posts.map((post) => (
          <motion.div 
            key={post.id} 
            variants={itemVariants}
            className="bg-white rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              {/* Header Bài Viết */}
              <div className="flex justify-between items-start mb-6 relative">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    {post.user?.avatar && !post.user.avatar.includes('pravatar') ? (
                      <img src={post.user.avatar} alt={post.user?.name} className="w-12 h-12 rounded-2xl border border-slate-100 object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl border border-slate-100 shadow-sm bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                        {(post.user?.name || 'U').charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px] shadow-sm">
                      <CheckCircle2 size={14} className="text-blue-500 fill-blue-50" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      {post.user?.name}
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Top Contributor</span>
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{post.user?.title}</div>
                    <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                      {post.time} • <MapPin size={10} className="text-blue-500"/> Việt Nam
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button onClick={() => toggleMenu(post.id)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2.5 rounded-xl transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                  <AnimatePresence>
                    {post.showMenu && (
                      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] py-1.5 z-20 overflow-hidden"
                      >
                        {(activeUser?.role === 'admin' || post.userId === userId) ? (
                          <button 
                            onClick={() => { handleDeleteReview(post.id); toggleMenu(post.id); }} 
                            className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors uppercase"
                          >
                            <Trash2 size={14} /> Xóa bài viết
                          </button>
                        ) : (
                          <button 
                            onClick={() => openReportModal(post.id)} 
                            className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors uppercase"
                          >
                            <Flag size={14} /> Báo cáo bài viết
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Tags & Rating */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span 
                  onClick={() => handleViewCompany(post.company)} 
                  className="text-blue-600 bg-blue-50 border border-blue-100/50 px-3.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-blue-100 font-bold flex items-center gap-2 transition-all"
                >
                  <Building2 size={12} /> {post.company}
                </span>
                <div className="flex gap-0.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50">
                  {[1, 2, 3, 4, 5].map((star) => ( 
                    <Star key={star} size={12} className={post.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} /> 
                  ))}
                </div>
              </div>

              {/* Nội dung bài viết */}
              <div className="relative mb-6">
                <Quote size={40} className="text-blue-50 absolute -top-4 -left-4 z-0 opacity-50" />
                <p className="text-slate-700 text-[14px] font-medium leading-relaxed relative z-10 pl-2 whitespace-pre-wrap">{post.content}</p>
              </div>
              
              {/* Media */}
              {post.media && (
                <div 
                  className="relative rounded-2xl overflow-hidden border border-slate-100 cursor-zoom-in group"
                  onClick={() => setSelectedLightbox({ url: post.media, type: post.mediaType })}
                >
                  {post.mediaType === 'image' ? (
                    <img src={post.media} className="w-full max-h-[450px] object-cover transition-transform group-hover:scale-[1.02] duration-500" alt="Review" />
                  ) : (
                    <div className="relative bg-slate-900">
                      <video src={post.media} className="w-full max-h-[450px] object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 text-white shadow-lg transform group-hover:scale-110 transition-transform">
                           <Play fill="white" size={24} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Maximize2 size={16} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Thích & Bình luận */}
            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center gap-2 text-xs font-bold text-slate-500">
              <motion.button 
                whileTap={{ scale: 0.95 }} onClick={() => handleLike(post.id)} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${post.isLiked ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <ThumbsUp size={16} className={post.isLiked ? 'fill-blue-600' : ''} /> 
                {post.likes > 0 ? `${post.likes} Hữu ích` : 'Hữu ích'}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} onClick={() => toggleComments(post.id)} 
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${post.showComments ? 'text-slate-800 bg-slate-100' : 'hover:bg-slate-100 hover:text-slate-700'}`}
              >
                <MessageCircle size={16} /> Bình luận {(post.comments?.length || 0) > 0 && `(${post.comments.length})`}
              </motion.button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {post.showComments && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-50 bg-slate-50/50 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="space-y-4 mb-6">
                      {post.comments?.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          {/* Avatar trong danh sách comment */}
                          <div className="shrink-0">
                            {comment.avatar && !comment.avatar.includes('pravatar') ? (
                              <img src={comment.avatar} alt={comment.user} className="w-8 h-8 rounded-full border border-slate-100 shadow-sm object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full border border-slate-100 shadow-sm bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                {(comment.user || 'U').charAt(0)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm">
                              <span className="font-bold text-slate-800 block mb-0.5">{comment.user}</span>
                              <span className="text-slate-600 font-medium leading-relaxed text-xs">{comment.content}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1.5 ml-2 cursor-pointer hover:text-slate-600 uppercase tracking-wider">Phản hồi • Vừa xong</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Ô nhập comment */}
                    <div className="flex gap-3 items-center">
                      <div className="shrink-0">
                        {userAvatar && !userAvatar.includes('pravatar') ? (
                          <img src={userAvatar} alt="User" className="w-8 h-8 rounded-full shadow-sm object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full shadow-sm bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {userName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="relative flex-1">
                        <input 
                          type="text" placeholder="Viết bình luận của bạn..." 
                          value={commentTexts[post.id] || ''} onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })} 
                          onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)} 
                          className="w-full bg-white border border-slate-100 rounded-xl pl-4 pr-12 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                        />
                        <button 
                          onClick={() => handleSendComment(post.id)} disabled={!commentTexts[post.id]?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 p-2 rounded-full hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
                        >
                          <Send size={14} className={commentTexts[post.id]?.trim() ? 'fill-blue-600 text-blue-600' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedLightbox && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedLightbox(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 bg-black/20 rounded-full hover:bg-black/40">
              <X size={32} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-5xl w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedLightbox.type === 'image' ? (
                <img src={selectedLightbox.url} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Full view" />
              ) : (
                <video src={selectedLightbox.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl bg-black" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT MODAL */}
      <AnimatePresence>
        {reportModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeReportModal}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-50 border-b border-red-100 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2.5 bg-red-100 rounded-xl">
                    <AlertTriangle size={20} className="fill-red-100" />
                  </div>
                  <h3 className="font-black uppercase tracking-wider text-sm">Báo cáo vi phạm</h3>
                </div>
                <button onClick={closeReportModal} className="text-red-400 hover:bg-red-100 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Lý do báo cáo</p>
                <div className="space-y-2 mb-6">
                  {reportReasons.map(reason => (
                    <div 
                      key={reason.id} onClick={() => setReportReason(reason.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        reportReason === reason.id ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xl">{reason.icon}</div>
                      <span className={`font-bold text-xs uppercase tracking-wider ${reportReason === reason.id ? 'text-red-700' : 'text-slate-700'}`}>{reason.label}</span>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${reportReason === reason.id ? 'border-red-500' : 'border-slate-300'}`}>
                        {reportReason === reason.id && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <Info size={14} className="text-slate-400" /> Chi tiết bổ sung (Tùy chọn)
                  </label>
                  <textarea 
                    rows="2" value={reportDetail} onChange={(e) => setReportDetail(e.target.value)}
                    placeholder="Mô tả cụ thể hơn vấn đề..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-300 transition-all resize-none placeholder:font-medium placeholder:text-slate-400"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
                <button onClick={closeReportModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors uppercase tracking-wider">Hủy bỏ</button>
                <button onClick={submitReport} disabled={!reportReason || isSubmittingReport} className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-red-500/20 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                  {isSubmittingReport ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Gửi báo cáo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
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

export default ReviewsTab;