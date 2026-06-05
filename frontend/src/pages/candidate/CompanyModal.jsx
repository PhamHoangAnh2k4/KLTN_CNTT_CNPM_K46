import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, Users, Globe, MapPin, 
  AlignLeft, Tags, ExternalLink, Building2, Calendar 
} from 'lucide-react';

const CompanyModal = ({ selectedCompany, onClose }) => {
  if (!selectedCompany) return null;

  // Xử lý Tech Stack từ Backend (Duy trì tính ổn định dữ liệu)
  const renderTechStack = () => {
    let techList = [];
    if (Array.isArray(selectedCompany.techStack)) {
      techList = selectedCompany.techStack;
    } else if (typeof selectedCompany.techStack === 'string' && selectedCompany.techStack.trim() !== '') {
      techList = selectedCompany.techStack.split(',').map(s => s.trim());
    } else {
      techList = ['Công nghệ thông tin', 'Phát triển Web', 'AI / Machine Learning'];
    }

    return techList.map((tech, index) => (
      <motion.span 
        key={index}
        whileHover={{ scale: 1.05, y: -2 }}
        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-100 shadow-sm cursor-default uppercase tracking-tight"
      >
        {tech}
      </motion.span>
    ));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] 
Shopee Vietnam
flex items-center justify-center p-4">
        {/* 1. Backdrop mờ - Click ra ngoài để đóng */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        {/* 2. Modal Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header Banner - Business Style */}
          <div className="h-28 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <button 
              onClick={onClose} 
              className="absolute top-5 right-5 z-20 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-8 pb-8 relative">
            {/* Logo Overlap */}
            <div className="flex items-end gap-5 mb-8">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="-mt-12 w-24 h-24 bg-white rounded-3xl border-4 border-white flex items-center justify-center text-blue-600 font-black text-4xl shadow-xl z-10 overflow-hidden"
              >
                {selectedCompany.logo ? (
                  <img src={selectedCompany.logo} alt={selectedCompany.company} className="w-full h-full object-cover" />
                ) : (
                  selectedCompany.logoText || "JA"
                )}
              </motion.div>
              <div className="pb-1">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  {selectedCompany.company}
                  <CheckCircle2 size={20} className="text-blue-500 fill-blue-50" />
                </h2>
                <div className="flex items-center gap-3 mt-1.5">
                   <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wide">
                    <Building2 size={12} /> Verified Company
                   </span>
                   <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                    <Calendar size={12} /> Hợp tác từ 2024
                   </span>
                </div>
              </div>
            </div>

            {/* Thông tin Card Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition-colors">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Users size={14} className="text-blue-600" /> Quy mô
                </h4>
                <p className="font-bold text-slate-700">{selectedCompany.companySize || "N/A"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition-colors">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-blue-600" /> Website
                </h4>
                <a 
                  href={selectedCompany.website || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 truncate"
                >
                  {selectedCompany.website?.replace('https://', '') || "Trang web công ty"}
                  <ExternalLink size={12} />
                </a>
              </div>
              
              <div className="col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-blue-600" /> Địa chỉ chính thức
                </h4>
                <div className="flex justify-between items-center gap-4">
                  <p className="font-bold text-slate-700 text-sm leading-snug">{selectedCompany.location}</p>
                  <motion.a 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCompany.location)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="shrink-0 flex items-center gap-2 text-[11px] font-black text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-xl transition-all shadow-lg"
                  >
                    Bản đồ
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Lĩnh vực & Tags */}
            <div className="mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Tags size={14} className="text-indigo-500" /> Chuyên môn & Hệ sinh thái
              </h4>
              <div className="flex flex-wrap gap-2">
                {renderTechStack()}
              </div>
            </div>

            {/* Giới thiệu */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlignLeft size={14} className="text-blue-600" /> Về chúng tôi
              </h4>
              <div className="max-h-32 overflow-y-auto pr-2 text-slate-600 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
                {selectedCompany.description || "Thông tin giới thiệu đang được cập nhật..."}
              </div>
            </div>

            {/* Footer - Chỉ giữ nút Đóng cho sạch sẽ */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-slate-900 text-white font-black text-xs rounded-2xl transition-all uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-700"
                onClick={onClose}
               >
                Đóng thông tin công ty
               </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompanyModal;