import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Users, Clock, Eye,
  CheckCircle, CheckCircle2, Sparkles, X, Briefcase, ExternalLink, ShieldCheck,
  Globe, AlignLeft, Tags, Calendar, ChevronRight
} from 'lucide-react';

// ==========================================
// MOCK DATA: CHUẨN BỊ CHO BACKEND
// ==========================================
const MOCK_API_RESPONSE = [
  {
    id: 1,
    company: 'VNG Corporation',
    logo: 'V',
    color: 'bg-orange-500',
    viewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'applied',
    jobApplied: 'Senior ReactJS Developer',
    industry: 'Công nghệ thông tin / IT',
    scale: '1000+ nhân viên',
    website: 'https://vng.com.vn',
    location: 'Z06 Đường số 13, Tân Thuận Đông, Quận 7, TP.HCM',
    description: 'VNG là công ty công nghệ hàng đầu Việt Nam, kiến tạo hệ sinh thái sản phẩm công nghệ đa dạng phục vụ hàng chục triệu người dùng trong và ngoài nước. Môi trường làm việc năng động, trẻ trung và nhiều cơ hội phát triển.',
    techStack: ['ReactJS', 'NodeJS', 'AWS', 'Microservices']
  },
  {
    id: 2,
    company: 'FPT Software',
    logo: 'F',
    color: 'bg-blue-600',
    viewedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    source: 'ai_suggested',
    industry: 'Gia công phần mềm',
    scale: '10000+ nhân viên',
    website: 'https://fptsoftware.com',
    location: 'Khu công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội',
    description: 'FPT Software là công ty tiên phong trong lĩnh vực xuất khẩu phần mềm tại Việt Nam. Chúng tôi mang đến cơ hội làm việc với các khách hàng toàn cầu và trải nghiệm các công nghệ tiên tiến nhất.',
    techStack: ['Java', 'Spring Boot', 'Cloud', 'AI / ML']
  },
  {
    id: 3,
    company: 'Shopee Vietnam',
    logo: 'S',
    color: 'bg-orange-600',
    viewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: 'applied',
    jobApplied: 'Frontend Engineer',
    industry: 'Thương mại điện tử',
    scale: '1000 - 5000 nhân viên',
    website: 'https://careers.shopee.vn',
    location: 'Tòa nhà Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM',
    description: 'Shopee là nền tảng thương mại điện tử hàng đầu tại Đông Nam Á và Đài Loan. Chúng tôi liên tục tối ưu hóa trải nghiệm mua sắm và cung cấp nền tảng vững chắc cho cả người mua và người bán.',
    techStack: ['ReactJS', 'TypeScript', 'Golang']
  },
  {
    id: 4,
    company: 'Momo (M_Service)',
    logo: 'M',
    color: 'bg-pink-500',
    viewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'ai_suggested',
    industry: 'Fintech / Thanh toán',
    scale: '500 - 1000 nhân viên',
    website: 'https://momo.vn',
    location: 'Tòa nhà Phú Mỹ Hưng, Quận 7, TP.HCM',
    description: 'MoMo là siêu ứng dụng số 1 Việt Nam, cung cấp đa dạng dịch vụ từ thanh toán, chuyển tiền đến tài chính, bảo hiểm. MoMo hướng tới việc thúc đẩy thanh toán không tiền mặt và mang lại cuộc sống tiện lợi cho người Việt.',
    techStack: ['Fintech', 'Java', 'Kotlin', 'Swift']
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const CvViewersPage = () => {
  const [viewersData, setViewersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const fetchCompanyViews = async () => {
      try {
        setIsLoading(true);
        // GIẢ LẬP GỌI API MẤT 1 GIÂY
        await new Promise(resolve => setTimeout(resolve, 1000));
        const data = MOCK_API_RESPONSE;
        const sortedData = data.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
        setViewersData(sortedData);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanyViews();
  }, []);

  const getRelativeTime = (isoString) => {
    const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const hoursDifference = Math.round((new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60));

    if (Math.abs(hoursDifference) < 24) return rtf.format(hoursDifference, 'hour');
    return rtf.format(daysDifference, 'day');
  };

  const isNewView = (isoString) => {
    const hoursDifference = Math.abs((new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60));
    return hoursDifference <= 24;
  };

  const filteredViewers = viewersData.filter(viewer => {
    if (activeTab === 'all') return true;
    return viewer.source === activeTab;
  });

  const tabs = [
    { id: 'all', label: `Tất cả (${viewersData.length})`, icon: null },
    { id: 'applied', label: 'Việc làm đã ứng tuyển', icon: CheckCircle },
    { id: 'ai_suggested', label: 'AI gợi ý / Mới', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-3 bg-white border border-slate-200/60 text-blue-600 rounded-2xl shadow-sm">
              <Eye size={26} strokeWidth={2.5} />
            </div>
            Nhà tuyển dụng đã xem CV
          </h1>
          <p className="text-slate-500 mt-3 font-medium text-base">
            Theo dõi sự quan tâm của doanh nghiệp đối với hồ sơ của bạn. Lượt xem mới nhất hiển thị trên cùng.
          </p>
        </motion.div>

        {/* TABS FILTER */}
        <div className="flex bg-slate-200/50 p-1.5 w-fit rounded-2xl mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl transition-colors z-10 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.icon && <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? (tab.id === 'applied' ? 'text-blue-600' : 'text-emerald-500') : ''} />}
                {tab.label}
                {isActive && <motion.div layoutId="viewerTabIndicator" className="absolute inset-0 bg-white rounded-xl -z-10 shadow-sm border border-slate-200/50" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm animate-pulse h-48">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-[1.25rem]"></div>
                  <div className="flex-1 pt-1 space-y-3">
                    <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100"><div className="h-8 bg-slate-100 rounded-xl w-full"></div></div>
              </div>
            ))}
          </div>
        ) : (
          /* DANH SÁCH VIEWERS */
          filteredViewers.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredViewers.map((viewer) => {
                const isNew = isNewView(viewer.viewedAt);

                return (
                  <motion.div
                    key={viewer.id} variants={itemVariants}
                    className={`bg-white rounded-[1.5rem] p-6 border shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all group flex flex-col justify-between relative overflow-hidden
                      ${isNew ? 'border-blue-200 hover:border-blue-300' : 'border-slate-200/60 hover:border-slate-300/80'}`}
                  >
                    <div className="flex items-start gap-4 mb-6 relative z-10">
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedCompany(viewer)}
                        className={`w-16 h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-md cursor-pointer ${viewer.color} shadow-${viewer.color.split('-')[1]}-200/50 transition-all`}
                      >
                        {viewer.logo}
                      </motion.button>

                      <div className="flex-1 pt-1">
                        <div onClick={() => setSelectedCompany(viewer)} className="inline-flex items-center gap-1.5 cursor-pointer group/title">
                          <h3 className="font-extrabold text-[1.15rem] text-slate-800 group-hover/title:text-blue-600 transition-colors">
                            {viewer.company}
                          </h3>
                          <ShieldCheck size={18} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Clock size={12} strokeWidth={2.5} /> {getRelativeTime(viewer.viewedAt)}</span>
                          {isNew && (
                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] tracking-widest border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> MỚI
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCompany(viewer)}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all absolute right-0 top-1"
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="pt-5 border-t border-slate-100/80">
                      {viewer.source === 'applied' ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle size={12} className="text-blue-600" /> Ứng tuyển từ vị trí:
                          </span>
                          <span className="text-sm font-bold text-slate-800 truncate">{viewer.jobApplied}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 h-full">
                          <div className="p-1.5 rounded-lg bg-emerald-100/50 text-emerald-600"><Sparkles size={16} strokeWidth={2.5} /></div>
                          <span className="text-emerald-700 text-xs font-bold tracking-tight">Chủ động tìm thấy bạn qua AI Match</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-16 text-center border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Eye size={48} strokeWidth={1.5} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có lượt xem nào</h3>
              <p className="text-slate-500 font-medium">Hãy cập nhật CV hoặc tiếp tục ứng tuyển để thu hút nhà tuyển dụng nhé.</p>
            </motion.div>
          )
        )}

        {/* ========================================== */}
        {/* MODAL CHI TIẾT DOANH NGHIỆP - FULL UI PRO */}
        {/* ========================================== */}
        <AnimatePresence>
          {selectedCompany && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} onClick={() => setSelectedCompany(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-br from-slate-800 via-slate-900 to-black relative">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="absolute top-5 right-5 z-20 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all border border-white/10"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                  {/* Badge thời gian xem ở Banner */}
                  <div className="absolute bottom-4 right-5 text-white/80 text-xs font-semibold flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    <Clock size={14} /> Đã xem {getRelativeTime(selectedCompany.viewedAt)}
                  </div>
                </div>

                <div className="px-8 pb-8 relative">
                  {/* Avatar & Tên CTY */}
                  <div className="flex items-end gap-5 mb-8">
                    <div className={`-mt-12 w-24 h-24 rounded-3xl border-4 border-white flex items-center justify-center text-white font-black text-4xl shadow-xl z-10 ${selectedCompany.color}`}>
                      {selectedCompany.logo}
                    </div>
                    <div className="pb-1">
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {selectedCompany.company}
                        <CheckCircle2 size={20} className="text-blue-500 fill-blue-50" />
                      </h2>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wide">
                          <Building2 size={12} /> Verified
                        </span>
                        <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                          <Calendar size={12} /> Hợp tác từ 2024
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grid Data (Quy mô, Website, Địa chỉ) */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Users size={14} className="text-slate-600" /> Quy mô
                      </h4>
                      <p className="font-bold text-slate-800">{selectedCompany.scale || "Đang cập nhật"}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Globe size={14} className="text-slate-600" /> Website
                      </h4>
                      {selectedCompany.website ? (
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate">
                          {selectedCompany.website.replace('https://', '')} <ExternalLink size={12} strokeWidth={2.5} />
                        </a>
                      ) : (
                        <p className="font-bold text-slate-500">Chưa cập nhật</p>
                      )}
                    </div>

                    <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <MapPin size={14} className="text-slate-600" /> Địa chỉ chính thức
                      </h4>
                      <div className="flex justify-between items-center gap-4">
                        <p className="font-bold text-slate-800 text-sm leading-snug">{selectedCompany.location || "Đang cập nhật"}</p>
                        {selectedCompany.location && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(selectedCompany.location)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 text-[11px] font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                          >
                            Bản đồ <ExternalLink size={12} strokeWidth={2.5} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Tags size={14} className="text-slate-600" /> Chuyên môn & Yêu cầu
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedCompany.techStack || []).length > 0 ? (
                        selectedCompany.techStack.map((tech, index) => (
                          <span key={index} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg shadow-sm uppercase tracking-tight">
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 font-medium">Chưa có thông tin kỹ năng.</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3 mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <AlignLeft size={14} className="text-slate-600" /> Về chúng tôi
                    </h4>
                    <div className="max-h-32 overflow-y-auto pr-2 text-slate-600 text-sm font-medium leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
                      {selectedCompany.description || "Doanh nghiệp chưa cập nhật phần giới thiệu."}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-6 border-t border-slate-100 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCompany(null)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all uppercase tracking-widest"
                    >
                      Đóng
                    </motion.button>

                    {selectedCompany.source === 'ai_suggested' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="flex-[2] py-4 bg-blue-600 text-white font-black text-xs rounded-2xl transition-all uppercase tracking-[0.1em] shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 flex justify-center items-center gap-2"
                      >
                        <Briefcase size={16} strokeWidth={2.5} /> Xem việc làm đang mở
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default CvViewersPage;