import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Activity, Settings, History, Monitor, Smartphone, 
  LogIn, LogOut, CheckCircle2, Ban, X, Shield, Server, Globe, Loader2, Filter, User 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Đổi port theo Backend của bạn
const API_BASE_URL = 'http://localhost:8081/api/admin';

// Từ điển đa ngôn ngữ
const translations = {
  vi: {
    title: "Cài đặt & Giám sát hệ thống",
    desc: "Quản lý cấu hình, theo dõi hiệu suất và nhật ký máy chủ",
    saveBtn: "Lưu thay đổi",
    savingBtn: "Đang lưu...",
    chartTitle: "Hiệu suất hệ thống (Real-time)",
    cpu: "Sử dụng CPU (%)",
    ram: "Sử dụng RAM (%)",
    sysConfig: "Cấu hình hệ thống",
    maintenance: "Bảo trì hệ thống",
    maintenanceDesc: "Tạm dừng truy cập từ người dùng để nâng cấp",
    langLabel: "Ngôn ngữ giao diện mặc định",
    logTitle: "Nhật ký hoạt động (Logs)",
    viewAllBtn: "Xem tất cả",
    modalTitle: "Toàn bộ nhật ký hệ thống",
    closeBtn: "Đóng cửa sổ",
  },
  en: {
    title: "System Settings & Monitoring",
    desc: "Manage configuration, monitor performance and server logs",
    saveBtn: "Save Changes",
    savingBtn: "Saving...",
    chartTitle: "System Performance (Real-time)",
    cpu: "CPU Usage (%)",
    ram: "RAM Usage (%)",
    sysConfig: "System Configuration",
    maintenance: "System Maintenance",
    maintenanceDesc: "Pause user access temporarily for upgrades",
    langLabel: "Default Interface Language",
    logTitle: "Activity Logs",
    viewAllBtn: "View All",
    modalTitle: "All System Logs",
    closeBtn: "Close Window",
  }
};

// Mock data dự phòng trường hợp API Logs chưa viết xong
const fallbackLogs = [
  { id: 1, action: { vi: 'Đăng nhập hệ thống', en: 'Logged into system' }, time: '10:10 - 26/03/2026', device: 'Windows 11 - Chrome', iconType: 'LOGIN', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 2, action: { vi: 'Duyệt tin tuyển dụng: "Senior ReactJS"', en: 'Approved job: "Senior ReactJS"' }, time: '09:45 - 26/03/2026', device: 'Windows 11 - Chrome', iconType: 'APPROVE', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 3, action: { vi: 'Xử lý báo cáo: Khóa tài khoản USR-005', en: 'Handled report: Banned USR-005' }, time: '22:15 - 25/03/2026', device: 'iPhone 15 Pro - Safari', iconType: 'BAN', color: 'text-rose-600 bg-rose-50 border-rose-200' },
];

const SettingsTab = () => {
  // --- STATES ---
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('adminLang') || 'vi');
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(''); // Filter theo admin
  
  // State chứa dữ liệu biểu đồ CPU/RAM
  const [chartData, setChartData] = useState([]); 
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const t = translations[lang];

  // --- FETCH DATA ---
  useEffect(() => {
    fetchSystemConfig();
    fetchLogs();
    fetchAdminList();
    
    fetchSystemMetrics();
    const metricsInterval = setInterval(() => {
      fetchSystemMetrics();
    }, 3000);

    return () => clearInterval(metricsInterval);
  }, []);

  // 1. API: Lấy CPU/RAM (Gắn với Java Controller bạn vừa đưa)
  const fetchSystemMetrics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/system/metrics`);
      if (res.data && Array.isArray(res.data)) {
        setChartData(res.data);
      }
    } catch (error) {
      console.warn("Lỗi khi lấy dữ liệu CPU/RAM:", error.message);
      // Bạn có thể cho mock data vào đây nếu server sập để biểu đồ không trống
    }
  };

  // 2. API: Lấy Config hệ thống
  const fetchSystemConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/system/config`);
      if (res.data) {
        setMaintenanceMode(res.data.maintenanceMode);
        if (res.data.defaultLang) {
            setLang(res.data.defaultLang);
            localStorage.setItem('adminLang', res.data.defaultLang);
        }
      }
    } catch (error) {
      console.warn("Chưa có API config, dùng state mặc định");
    }
  };

  // 3. API: Lấy Logs
  const fetchLogs = async (adminId = '') => {
    setIsLoadingLogs(true);
    try {
      const url = adminId 
        ? `${API_BASE_URL}/system/logs?adminId=${adminId}` 
        : `${API_BASE_URL}/system/logs`;
      const res = await axios.get(url);
      setLogs(res.data || []);
    } catch (error) {
      console.warn("Chưa có API logs, dùng mock data dự phòng");
      setLogs(fallbackLogs);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 4. API: Lấy danh sách Admin
  const fetchAdminList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/system/admins`);
      setAdmins(res.data || []);
    } catch (e) {
      console.warn('Không lấy được danh sách admin');
    }
  };

  // Khi chọn filter admin
  const handleAdminFilter = (adminId) => {
    setSelectedAdminId(adminId);
    fetchLogs(adminId);
  };

  // --- LƯU CẤU HÌNH ---
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/system/config`, {
        maintenanceMode: maintenanceMode,
        defaultLang: lang
      });
      localStorage.setItem('adminLang', lang); 
      alert('✅ Đã lưu cấu hình hệ thống thành công!');
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình:", error);
      alert('❌ Có lỗi xảy ra khi lưu. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  // Hàm render Icon cho Log
  const renderLogIcon = (type, size = 18) => {
    switch(type) {
      case 'LOGIN': return <LogIn size={size} />;
      case 'LOGOUT': return <LogOut size={size} />;
      case 'APPROVE': return <CheckCircle2 size={size} />;
      case 'BAN': return <Ban size={size} />;
      case 'SETTINGS': return <Settings size={size} />;
      case 'REPORT': return <Activity size={size} />;
      case 'UNBAN': return <Shield size={size} />;
      default: return <History size={size} />;
    }
  };

  // UI Variants & Components
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const Toggle = ({ enabled, setEnabled }) => (
    <div onClick={() => setEnabled(!enabled)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 border-2 border-transparent shadow-inner flex items-center ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <div className={`w-6 h-6 bg-white rounded-full absolute shadow-md transition-transform duration-300 flex items-center justify-center ${enabled ? 'translate-x-7' : 'translate-x-1'}`}>
        {enabled && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100/50">
          <p className="text-sm font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs font-semibold mt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-600">{entry.name}:</span>
              <span className="text-slate-900 font-black">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden relative flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 shrink-0">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Server className="text-blue-500" size={28} /> {t.title}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">{t.desc}</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-xl shadow-slate-500/20 flex items-center gap-2 active:scale-95"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} 
          {isSaving ? t.savingBtn : t.saveBtn}
        </button>
      </div>

      <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: Biểu đồ (Chiếm 2 cột) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col">
            <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm p-6 sm:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl"><Activity className="text-blue-600" size={20} /></div>
                  {t.chartTitle}
                </h4>
                {/* Dấu chấm xanh nhấp nháy biểu thị Live Data */}
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  LIVE
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} dx={-10} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4, radius: 8 }} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '25px', fontSize: '13px', fontWeight: 600, color: '#475569'}} />
                    <Bar dataKey="cpu" name={t.cpu} fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} animationDuration={500} />
                    <Bar dataKey="ram" name={t.ram} fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} animationDuration={500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* CỘT PHẢI: Cài đặt hệ thống */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-8">
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-[2rem] shadow-sm p-6 sm:p-8">
              <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-xl"><Settings className="text-slate-700" size={20} /></div>
                {t.sysConfig}
              </h4>
              <div className="space-y-5">
                {/* Bảo trì */}
                <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                  <div className="pr-4">
                    <p className="font-bold text-slate-800 mb-0.5">{t.maintenance}</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{t.maintenanceDesc}</p>
                  </div>
                  <Toggle enabled={maintenanceMode} setEnabled={setMaintenanceMode} />
                </div>
                
                {/* Ngôn ngữ */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                    <Globe size={16} className="text-blue-500"/> {t.langLabel}
                  </label>
                  <div className="relative">
                    <select 
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-700 font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="vi">🇻🇳 Tiếng Việt</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* BOTTOM ROW: Nhật ký hoạt động */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl"><History className="text-amber-600" size={20} /></div>
                  {t.logTitle}
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Filter theo Admin */}
                  {admins.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={selectedAdminId}
                        onChange={(e) => handleAdminFilter(e.target.value)}
                        className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="">Tất cả Admin</option>
                        {admins.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button 
                    onClick={() => setIsLogModalOpen(true)}
                    className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl transition-all active:scale-95 border border-blue-100"
                  >
                    {t.viewAllBtn}
                  </button>
                </div>
              </div>
              
              {isLoadingLogs ? (
                 <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md transition-all group cursor-default flex flex-col justify-between">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Hiển thị Ảnh gốc (Avatar) của Admin */}
                        <div className="relative shrink-0 group-hover:scale-110 transition-transform">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.adminName || 'Admin')}&background=2563eb&color=fff&bold=true`} 
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200" 
                            alt="Admin Avatar"
                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff&bold=true'; }}
                          />
                          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-white ${log.color || 'bg-slate-50 text-slate-600'}`}>
                            {renderLogIcon(log.iconType, 12)}
                          </div>
                        </div>
                        <div>
                          {/* Tên Admin */}
                          {log.adminName && (
                            <div className="flex items-center gap-1 mb-1">
                              <User size={11} className="text-blue-500" />
                              <span className="text-[11px] font-black text-blue-600 uppercase tracking-wide">{log.adminName}</span>
                            </div>
                          )}
                          <p className="font-bold text-slate-800 text-sm line-clamp-2">
                            {typeof log.action === 'object' ? (log.action[lang] || log.action['vi']) : log.actionType}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-1">{log.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl w-fit border border-slate-200 shadow-sm">
                        {log.device?.includes('iPhone') || log.device?.includes('Android') ? (
                          <Smartphone size={14} className="text-slate-400" />
                        ) : (
                          <Monitor size={14} className="text-slate-400" />
                        )}
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{log.device}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>

      {/* MODAL XEM TẤT CẢ LỊCH SỬ */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><History size={20} /></div>
                  <h3 className="text-lg font-black text-slate-800">{t.modalTitle}</h3>
                </div>
                <button 
                  onClick={() => setIsLogModalOpen(false)} 
                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all gap-4 group">
                    <div className="flex items-start gap-4">
                      {/* Hiển thị Ảnh gốc (Avatar) của Admin trong Modal */}
                      <div className="relative shrink-0 group-hover:scale-110 transition-transform">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.adminName || 'Admin')}&background=2563eb&color=fff&bold=true`} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200" 
                          alt="Admin Avatar"
                          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff&bold=true'; }}
                        />
                        <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border border-white ${log.color || 'bg-slate-50 text-slate-600'}`}>
                          {renderLogIcon(log.iconType, 12)}
                        </div>
                      </div>
                      <div>
                        {/* Tên Admin (nếu có) */}
                        {log.adminName && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-wide">{log.adminName}</span>
                          </div>
                        )}
                        <p className="font-bold text-slate-800 text-base">
                          {log.action[lang] || log.action['vi']}
                        </p>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{log.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl shrink-0 border border-slate-100 group-hover:bg-white transition-colors">
                      {log.device?.includes('iPhone') || log.device?.includes('Android') ? (
                        <Smartphone size={16} className="text-slate-400" />
                      ) : (
                        <Monitor size={16} className="text-slate-400" />
                      )}
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">{log.device}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 py-5 bg-slate-50/80 backdrop-blur-xl border-t border-slate-200/60 flex justify-end shrink-0">
                <button 
                  onClick={() => setIsLogModalOpen(false)} 
                  className="px-8 py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-500/20 active:scale-95"
                >
                  {t.closeBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsTab;