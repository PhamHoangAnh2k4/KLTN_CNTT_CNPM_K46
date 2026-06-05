'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Rocket, FileText, User, LogOut, Bell, PlusCircle, 
  LayoutDashboard, Briefcase, UserPlus, AlertCircle, 
  CheckCircle, Sparkles, ShieldAlert, ChevronDown, CheckCheck, Trash2, Clock, ArrowRight, X
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // 🛡️ Ưu tiên sessionStorage (của tab hiện tại), fallback về lastLogin_ cho tab mới mở
  const getFromStorage = (key) => sessionStorage.getItem(key) || localStorage.getItem('lastLogin_' + key) || '';

  const [role, setRole] = useState(getFromStorage('userRole') || 'ung_vien');
  const [fullName, setFullName] = useState(getFromStorage('userName') || 'Người dùng');
  
  // STATE LƯU AVATAR/LOGO MỚI THÊM
  const [userAvatar, setUserAvatar] = useState(null);

  // Hàm lấy userId an toàn từ Storage
  const getUserId = () => {
    let uid = sessionStorage.getItem('userId') || localStorage.getItem('lastLogin_userId');
    if (!uid) {
      try {
        const acc = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount') || '{}');
        uid = acc.userId;
      } catch (e) {}
    }
    return uid;
  };

  // 1. Tách hàm cập nhật ra riêng để tái sử dụng
  const updateIdentity = () => {
    setRole(getFromStorage('userRole') || 'ung_vien');
    setFullName(getFromStorage('userName') || 'Người dùng');
  };

  // 2. Lắng nghe thay đổi (Storage cho tab khác + Custom Event cho tab hiện tại)
  useEffect(() => {
    updateIdentity(); // Cập nhật ngay khi mount
    
    const handleAuthChange = () => {
      updateIdentity();
      window.dispatchEvent(new Event('profileUpdated'));
    };

    window.addEventListener('storage', updateIdentity);
    window.addEventListener('authChange', handleAuthChange); // Bắt event custom
    
    return () => {
      window.removeEventListener('storage', updateIdentity);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // 3. Buộc Navbar check lại Storage mỗi khi chuyển trang
  useEffect(() => {
    updateIdentity();
  }, [location.pathname]);

  const isNTD = role === 'ntd';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FETCH AVATAR TỪ BACKEND ---
  useEffect(() => {
    const fetchAvatar = async () => {
      const uid = getUserId();
      if (!uid) return;

      try {
        if (role === 'ntd') {
          const res = await axios.get(`http://localhost:8081/api/employer-profiles/${uid}`);
          if (res.data && res.data.companyLogo) {
            const fileName = res.data.companyLogo.split('/').pop();
            setUserAvatar(`http://localhost:8081/api/employer-profiles/images/${fileName}`);
          } else {
            setUserAvatar(null);
          }
        } else if (role === 'ung_vien') {
          const res = await axios.get(`http://localhost:8081/api/candidate-profiles/${uid}`);
          
          if (res.data && res.data.avatar) {
            const avatarPath = res.data.avatar;
            const fullUrl = avatarPath.startsWith('http') 
              ? avatarPath 
              : (avatarPath.startsWith('/') ? `http://localhost:8081${avatarPath}` : `http://localhost:8081/${avatarPath}`);
            
            setUserAvatar(fullUrl);
          } else {
            setUserAvatar(null);
          }
        }
      } catch (error) {
        console.warn("Chưa tìm thấy Profile hoặc lỗi lấy ảnh:", error.message);
        setUserAvatar(null);
      }
    };

    fetchAvatar();

    const handleProfileUpdated = () => {
      fetchAvatar();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdated);
  }, [role, location.pathname]);

  // --- FETCH THÔNG BÁO TỪ BACKEND ---
  const fetchNotifications = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await axios.get(`http://localhost:8081/api/notifications/user/${uid}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [role]);

  const unreadCount = notifications.filter(n => !n.isRead).length; 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await axios.put(`http://localhost:8081/api/notifications/user/${uid}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await axios.put(`http://localhost:8081/api/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error(error);
      }
    }
    setShowNotifications(false);
    
    if (role === 'ntd') navigate('/employer/candidates');
    else navigate('/candidate/notifications');
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    if (role === 'ntd') navigate('/employer/notifications');
    else if (role === 'admin') navigate('/admin/notifications');
    else navigate('/candidate/notifications');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const getNavConfig = () => {
    switch (role) {
      case 'ntd':
        return {
          userName: fullName,
          userSub: 'Nhà Tuyển Dụng',
          homeUrl: '/employer',
          links: [
            { path: '/employer', icon: <Briefcase size={18} />, text: 'Quản lý tin' },
            { path: '/employer/create-job', icon: <PlusCircle size={18} />, text: 'Đăng tin mới' },
          ]
        };
      case 'admin':
        return {
          userName: fullName,
          userSub: 'Hệ thống JobAI',
          homeUrl: '/admin',
          links: [{ path: '/admin', icon: <LayoutDashboard size={18} />, text: 'Dashboard' }]
        };
      default:
        return {
          userName: fullName,
          userSub: 'Ứng viên',
          homeUrl: '/candidate',
          links: [
            { path: '/candidate', icon: <Briefcase size={18} />, text: 'Việc làm AI' },
            { path: '/candidate/upload-cv', icon: <FileText size={18} />, text: 'Quét CV' },
            { path: '/candidate/ai-optimize', icon: <Sparkles size={18} />, text: 'Tối ưu CV' },
          ]
        };
    }
  };

  const config = getNavConfig();
  const profilePath = role === 'ntd' ? '/employer/profile' : role === 'admin' ? '/admin/profile' : '/candidate/profile';

  // Animation Variants Luxury
  const dropdownVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95, transformOrigin: 'top right' },
    visible: { 
      opacity: 1, y: 0, scale: 1, 
      transition: { type: "spring", stiffness: 400, damping: 25 } 
    },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }
  };

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30, delay: 0.1 }
    }
  };

  const linkContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const linkItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  const getNotifUI = (type) => {
    switch (type) {
      case 'passed': return { icon: <CheckCircle size={16} className="text-emerald-500"/>, color: 'bg-emerald-100' };
      case 'rejected': return { icon: <AlertCircle size={16} className="text-rose-500"/>, color: 'bg-rose-100' };
      case 'interviewing': return { icon: <UserPlus size={16} className="text-blue-500"/>, color: 'bg-blue-100' };
      default: return { icon: <Bell size={16} className="text-indigo-500"/>, color: 'bg-indigo-100' };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' - ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-4 pb-4 pointer-events-none flex justify-center">
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className={`pointer-events-auto flex justify-between items-center w-full max-w-6xl rounded-full transition-all duration-500 ease-out border
          ${isScrolled
            ? 'py-2 px-4 sm:px-6 bg-white/75 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-white/50'
            : 'py-2.5 px-5 sm:px-7 bg-white/95 backdrop-blur-md shadow-sm border-slate-100'
          }
        `}
      >
        {/* LOGO */}
        <Link to={config.homeUrl} className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-40 group-hover:opacity-80 transition-opacity"></div>
            <Rocket className="relative text-blue-600" size={isScrolled ? 22 : 26} />
          </motion.div>
          <span className={`font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-xl'}`}>
            JobAI
          </span>
        </Link>

        {/* CENTER LINKS - STAGGERED ANIMATION */}
        <motion.div 
          variants={linkContainerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-full border border-slate-100/50"
        >
          {config.links.map((link, index) => {
            const isActive = location.pathname === link.path;
            return (
              <motion.div key={index} variants={linkItemVariants}>
                <Link
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-colors z-10
                    ${isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className={`${isActive ? 'opacity-100' : 'opacity-70'}`}>{link.icon}</span>
                  <span>{link.text}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* NOTIFICATIONS */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-full transition-all duration-300 ${
                showNotifications ? 'bg-blue-100 text-blue-600 shadow-inner' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600'
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                  className="absolute right-0 mt-4 w-[360px] bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Thông báo</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-lg">
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50/50">
                        {notifications.map((notif) => {
                          const ui = getNotifUI(notif.type);
                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 group ${notif.isRead ? 'opacity-70' : 'bg-blue-50/20'}`}
                            >
                              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ui.color}`}>
                                {ui.icon}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm leading-tight ${notif.isRead ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>{notif.title}</p>
                                <p className={`text-[12px] mt-1 leading-tight ${notif.isRead ? 'text-slate-500' : 'text-slate-600'}`}>{notif.message}</p>
                                <span className="text-[11px] text-slate-400 font-medium mt-1.5 block flex items-center gap-1">
                                  <Clock size={10} /> {formatTime(notif.createdAt)}
                                </span>
                              </div>
                              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                        <CheckCircle size={32} className="text-slate-200 mb-2" />
                        <span className="text-sm font-medium">Không có thông báo mới</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors text-center cursor-pointer" onClick={handleViewAll}>
                    <span className="text-sm text-blue-600 font-bold flex items-center justify-center gap-1">
                      Xem tất cả <ArrowRight size={14} />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PROFILE */}
          <div className="relative border-l border-slate-200 pl-3 sm:pl-4" ref={profileRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors group"
            >
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{config.userName}</p>
                <p className={`text-[11px] font-medium ${isNTD ? 'text-blue-600' : 'text-slate-500'}`}>{config.userSub}</p>
              </div>
              
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md font-black text-base group-hover:shadow-lg transition-all group-hover:scale-105 overflow-hidden relative">
                  {userAvatar && (
                    <img 
                      src={userAvatar} 
                      alt="Avatar" 
                      className="absolute inset-0 w-full h-full object-cover bg-white z-10"
                      onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                  )}
                  <span className="z-0">
                    {(config.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                {isNTD && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white">
                    <ShieldAlert size={10} />
                  </div>
                )}
              </div>
              
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  variants={dropdownVariants} initial="hidden" animate="visible" exit="exit"
                  className="absolute right-0 mt-4 w-60 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100/50 mb-1 md:hidden">
                    <p className="text-sm font-bold text-slate-800">{config.userName}</p>
                    <p className="text-xs text-slate-500">{config.userSub}</p>
                  </div>

                  <Link
                    to={profilePath}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors mx-1"
                  >
                    <User size={18} /> Hồ sơ của tôi
                  </Link>
                  <div className="h-px bg-slate-100 my-1 mx-3"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors mx-1"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default Navbar;