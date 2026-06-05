import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, Sparkles, Flag } from 'lucide-react';
import axios from 'axios';

// Giữ lại reports và settings vì chưa có Database cho phần này
import { initialReports, systemChartData } from '../../mockData/adminData';

import OverviewTab from './components/OverviewTab';
import UserTab from './components/UserTab';
import JobTab from './components/JobTab';
import SettingsTab from './components/SettingsTab';
import ReportTab from './components/ReportTab';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, activeTabSet] = useState('jobs'); // Mặc định mở luôn tab Jobs cho bạn dễ test
  
  const adminName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'System Admin';

  const setActiveTab = (tab) => activeTabSet(tab);
  
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState(initialReports); 

  // TẢI DỮ LIỆU TỪ DATABASE SQL SERVER 
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Lấy Users thật
        const userRes = await axios.get('http://localhost:8081/api/admin/users');
        setUsers(userRes.data);

        // Lấy Jobs thật
        const jobRes = await axios.get('http://localhost:8081/api/admin/jobs');
        setJobs(jobRes.data);

      } catch (error) {
        console.error("❌ Lỗi Backend (Spring Boot chưa chạy hoặc sai cổng):", error);
        // Tắt tính năng mock fallback để bạn thấy rõ là có lấy được DB hay không
      }
    };

    fetchAdminData();
  }, []);

  const handleLogout = async () => {
    if(window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi Admin?')) {
      try {
        // Lấy userId của admin hiện tại
        const adminAcc = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount') || '{}');
        if (adminAcc.userId) {
          // Ghi log đăng xuất vào Database
          await axios.post('http://localhost:8081/api/admin/system/logout-log', { userId: adminAcc.userId });
        }
      } catch (e) {
        console.warn('Không thể ghi log đăng xuất:', e.message);
      }
      sessionStorage.clear(); // Chỉ xóa session của tab này
      navigate('/login');
    }
  };

  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { id: 'users', icon: Users, label: 'Quản lý người dùng' },
    { id: 'jobs', icon: Briefcase, label: 'Kiểm duyệt việc làm', badge: jobs.filter(j=> (j.status || 'Chờ duyệt') ==='Chờ duyệt').length },
    { id: 'reports', icon: Flag, label: 'Quản lý báo cáo', badge: reports.filter(r=>r.status==='Chờ xử lý').length }, 
    { id: 'settings', icon: Settings, label: 'Cài đặt hệ thống' },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-600">
      
      {/* SIDEBAR TỔNG */}
      <div className="w-72 bg-[#020617] text-slate-300 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-slate-800/50">
        <div className="h-24 flex items-center px-8 bg-[#0f172a]/50 border-b border-slate-800/50 backdrop-blur-xl">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-wide leading-none">Admin<span className="text-blue-500 italic">JobAI</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Hệ thống quản trị</span>
            </div>
          </motion.div>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar relative">
          <p className="px-4 text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Menu Chính</p>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)} 
                className={`relative w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-colors group ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={20} className={`${isActive ? 'text-blue-400' : 'group-hover:text-slate-300'} transition-colors`} />
                <span className="relative z-10">{item.label}</span>
                {item.badge > 0 && (
                  <span className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-black ${
                    isActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-rose-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col relative h-screen">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-10 shrink-0 z-10 sticky top-0">
          <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {sidebarItems.find(item => item.id === activeTab)?.label}
            </h1>
          </motion.div>
          
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 pl-6 border-l-2 border-slate-200/60">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-black text-slate-900">{adminName}</p>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1.5 uppercase tracking-wider mt-0.5">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     Trực tuyến
                  </p>
                </div>
                
                <div className="relative w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=2563eb&color=fff&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                
                <button onClick={handleLogout} className="ml-2 p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
                  <LogOut size={20}/>
                </button>
              </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <OverviewTab users={users} jobs={jobs} reports={reports} setActiveTab={setActiveTab} />}
              {activeTab === 'users' && <UserTab users={users} setUsers={setUsers} />}
              {activeTab === 'jobs' && <JobTab jobs={jobs} setJobs={setJobs} />}
              {activeTab === 'reports' && <ReportTab reports={reports} setReports={setReports} />}
              {activeTab === 'settings' && <SettingsTab systemChartData={systemChartData} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;