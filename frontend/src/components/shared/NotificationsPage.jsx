'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, Sparkles, UserPlus, 
  AlertCircle, Check, Trash2, CheckCheck, FileText,
  Clock, ArrowRight, Users, XCircle, Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- IMPORT MODAL DÀNH CHO ỨNG VIÊN ---
import JobDetailModal from '../../pages/candidate/JobDetailModal';

const NotificationsPage = ({ role = 'employer' }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  // --- STATE CHO MODAL CỦA ỨNG VIÊN ---
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);

  // --- LẤY USER ID TỪ STORAGE ---
  const getUserId = () => {
    let uid = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    if (!uid) {
      try {
        const acc = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('userAccount') || '{}');
        uid = acc.userId;
      } catch (e) {}
    }
    return uid;
  };

  // --- LẤY ROLE ĐỂ PHÂN BIỆT NTD & ỨNG VIÊN ---
  const getUserRole = () => {
    return sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
  };

  // --- FETCH DATA TỪ BACKEND ---
  const fetchNotifications = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await axios.get(`http://localhost:8081/api/notifications/user/${uid}`);
      setNotifications(res.data);
    } catch (error) {
      console.warn("Không thể tải danh sách thông báo:", error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  // --- CÁC HÀM XỬ LÝ GỌI API ---
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    const target = notifications.find(n => n.id === id);
    if (target && !target.isRead) {
      try {
        await axios.put(`http://localhost:8081/api/notifications/${id}/read`);
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      } catch (error) { console.warn("Lỗi đánh dấu đã đọc:", error.message); }
    }
  };

  const handleMarkAllAsRead = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await axios.put(`http://localhost:8081/api/notifications/user/${uid}/read-all`);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.warn("Lỗi đánh dấu đã đọc tất cả:", error.message); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:8081/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) { console.warn("Lỗi xóa thông báo:", error.message); }
  };

  // --- LOGIC CHUYỂN HƯỚNG SIÊU ĐỈNH CHO CẢ NTD & ỨNG VIÊN ---
  const handleNotificationClick = async (notif) => {
    handleMarkAsRead(notif.id);
    const currentRole = getUserRole();

    if (currentRole === 'ntd') {
      if (notif.link && notif.link.includes('/job-detail/')) {
        const jobId = notif.link.split('/').pop();
        navigate('/employer/candidates', { state: { selectedJobId: jobId } });
      } else if (notif.link) {
        navigate(notif.link);
      } else {
        navigate('/employer/candidates');
      }
      return;
    }

    if (notif.link && notif.link.includes('/job-detail/')) {
      try {
        setIsLoadingJob(true);
        const jobId = notif.link.split('/').pop();
        const res = await axios.get(`http://localhost:8081/api/jobs/${jobId}`);
        if (res.data) {
          setSelectedJob(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết bài đăng:", error);
        navigate(notif.link); 
      } finally {
        setIsLoadingJob(false);
      }
      return; 
    }

    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate('/candidate/cv');
    }
  };

  const getNotifUI = (type) => {
    switch (type) {
      case 'passed': return { icon: <CheckCircle size={20} className="text-emerald-500"/>, color: 'bg-emerald-100' };
      case 'rejected': return { icon: <AlertCircle size={20} className="text-rose-500"/>, color: 'bg-rose-100' };
      case 'interviewing': return { icon: <UserPlus size={20} className="text-blue-500"/>, color: 'bg-blue-100' };
      case 'success': return { icon: <Check size={20} className="text-green-500"/>, color: 'bg-green-100' };
      case 'new_applicant': return { icon: <FileText size={20} className="text-amber-500"/>, color: 'bg-amber-100' };
      default: return { icon: <Bell size={20} className="text-indigo-500"/>, color: 'bg-indigo-100' };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' - ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Animation Variants Luxury
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, y: 0, scale: 1, 
      transition: { type: "spring", stiffness: 300, damping: 25 } 
    },
    exit: { opacity: 0, x: -20, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-100 to-blue-100 rounded-full blur-3xl opacity-50 -ml-40 -mb-40 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER SECTION - LUXURY MESH BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, type: "spring" }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 sm:p-10 text-white shadow-2xl shadow-blue-950/10"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner relative">
                <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-30 animate-pulse"></div>
                <Bell size={32} className="text-blue-300 relative z-10" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black flex items-center gap-2">
                  Trung tâm Thông báo <Sparkles size={24} className="text-amber-300 animate-pulse" />
                </h1>
                <p className="text-blue-100/80 font-medium mt-1">
                  Bạn có <span className="text-amber-300 font-bold">{unreadCount}</span> thông báo chưa đọc cần xử lý.
                </p>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.03, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.3)" }} 
              whileTap={{ scale: 0.98 }}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                unreadCount > 0 
                  ? 'bg-white text-slate-900 shadow-lg hover:bg-slate-50' 
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
              }`}
            >
              <CheckCheck size={16} />
              Đánh dấu tất cả đã đọc
            </motion.button>
          </div>
          
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none" />
        </motion.div>

        {/* MAIN CONTENT AREA */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          
          {/* TABS - LUXURY STYLE */}
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {['all', 'unread'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors z-10 flex items-center gap-2 ${
                    activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabIndicatorPage"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {tab === 'all' ? 'Tất cả' : 'Chưa đọc'}
                  {tab === 'unread' && unreadCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Tổng số: {notifications.length}
            </div>
          </div>

          {/* NOTIFICATION LIST */}
          <div className="min-h-[300px]">
            <AnimatePresence mode='popLayout'>
              {filteredNotifications.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                  {filteredNotifications.map((notif) => {
                    const ui = getNotifUI(notif.type);
                    return (
                      <motion.div 
                        layout
                        key={notif.id} 
                        variants={itemVariants}
                        exit="exit"
                        onClick={() => handleNotificationClick(notif)}
                        className={`group relative p-5 rounded-2xl transition-all cursor-pointer border ${
                          notif.isRead 
                            ? 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-sm' 
                            : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-100 hover:border-blue-200 hover:shadow-md'
                        }`}
                      >
                        {/* Unread pulsing dot */}
                        {!notif.isRead && (
                          <div className="absolute top-5 right-5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                          </div>
                        )}

                        <div className="flex gap-4 sm:gap-5">
                          {/* Icon Box */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-11 h-11 flex items-center justify-center rounded-xl ${ui.color} ${!notif.isRead ? 'shadow-sm' : 'opacity-70'} group-hover:scale-105 transition-transform`}>
                              {ui.icon}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 pr-8 sm:pr-20">
                            <h3 className={`text-base pr-4 ${notif.isRead ? 'text-slate-700 font-bold' : 'text-slate-900 font-black'}`}>
                              {notif.title}
                            </h3>
                            {notif.message && (
                              <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">
                                <Clock size={10} />
                                {formatTime(notif.createdAt)}
                              </span>
                              {!notif.isRead && (
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                  Xem chi tiết <ArrowRight size={10} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons (Hover Reveal) */}
                        <div className="absolute bottom-5 right-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                          {!notif.isRead && (
                            <button 
                              onClick={(e) => handleMarkAsRead(notif.id, e)} 
                              title="Đánh dấu đã đọc" 
                              className="p-2 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-lg shadow-sm transition-all hover:scale-105"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDelete(notif.id, e)} 
                            title="Xóa thông báo" 
                            className="p-2 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 rounded-lg shadow-sm transition-all hover:scale-105"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                /* EMPTY STATE LUXURY */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="py-16 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl opacity-50"></div>
                    <div className="w-24 h-24 bg-gradient-to-tr from-white to-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center shadow-sm relative transform rotate-3">
                      <Inbox size={36} className="text-slate-300" />
                      <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm border border-slate-50">
                        <CheckCircle size={16} className="text-emerald-400" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Tất cả đã được xử lý!</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1 max-w-xs">
                    Bạn không có thông báo nào mới vào lúc này. Hãy quay lại sau nhé.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- RENDER MODAL CHI TIẾT (CHỈ HIỆN VỚI ỨNG VIÊN KHI ĐƯỢC SET) --- */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal 
            job={selectedJob} 
            onClose={() => setSelectedJob(null)} 
            onApply={(jobId) => {
              navigate('/', { state: { openApplyJobId: jobId } });
            }}
          />
        )}
      </AnimatePresence>

      {/* --- RENDER LOADING OVERLAY --- */}
      <AnimatePresence>
        {isLoadingJob && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
          >
            <div className="bg-white p-5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">Đang tải chi tiết...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default NotificationsPage;