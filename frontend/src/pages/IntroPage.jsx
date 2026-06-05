import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, BrainCircuit, Target, Zap, ArrowRight, 
  CheckCircle2, Sparkles, ShieldCheck, Globe, Star
} from 'lucide-react';

const IntroPage = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-600">
      
      {/* --- BACKGROUND DECORATION --- */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full"></div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-md border-b border-slate-200/50">
        <div className="container mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Rocket className="text-white" size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900 italic">JOB.AI</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Link to="/login" className="hidden sm:block text-slate-600 hover:text-blue-600 font-bold px-4 transition-colors">
              Đăng nhập
            </Link>
            <Link 
              to="/register?role=candidate" 
              className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200 active:scale-95"
            >
              Bắt đầu ngay
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="container mx-auto px-6 md:px-12 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest mb-10 shadow-sm"
          >
            <Sparkles size={14} className="animate-pulse" /> Tuyển dụng thế hệ mới với trí tuệ nhân tạo
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black mb-10 tracking-[ -0.04em] text-slate-950 leading-[0.95]"
          >
            Chạm tay tới <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 relative">
              Sự nghiệp
              <motion.svg 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 100 8" preserveAspectRatio="none"
              >
                <path d="M0 7C25 2 75 2 100 7" stroke="#2563EB" strokeWidth="4" fill="none" strokeLinecap="round" />
              </motion.svg>
            </span> mơ ước.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-14 leading-relaxed font-medium"
          >
            Nền tảng JobAI sử dụng thuật toán Matching thông minh để kết nối nhân tài hàng đầu với những doanh nghiệp công nghệ đột phá.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-24"
          >
            <Link 
              to="/register?role=candidate" 
              className="group relative flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
              Tôi tìm việc làm <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              to="/register?role=employer" 
              className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-800 font-black rounded-[2rem] hover:border-blue-600 hover:text-blue-600 transition-all hover:bg-blue-50 shadow-sm"
            >
              Tôi là Nhà tuyển dụng
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
             className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y border-slate-200/60"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900">500+</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đối tác chiến lược</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900">98%</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ hài lòng</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900">10ms</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tốc độ xử lý AI</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-slate-900">24/7</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hỗ trợ tức thì</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Bento Style) --- */}
      <section className="py-24 bg-slate-950 text-white rounded-[3rem] mx-4 md:mx-10 mb-10 overflow-hidden">
        <div className="container mx-auto px-8">
          <div className="max-w-2xl mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight italic text-blue-400 uppercase">
              Công nghệ làm thay đổi cuộc chơi
            </h2>
            <p className="text-slate-400 font-medium text-lg italic uppercase tracking-tighter">
              Bỏ qua các phương pháp tuyển dụng truyền thống. Hãy để AI xử lý những công việc nặng nhọc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Big Bento Box */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-8 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="relative z-10">
                <BrainCircuit size={48} className="mb-6" />
                <h3 className="text-3xl font-black mb-4 uppercase italic">AI Semantic Scan 2.0</h3>
                <p className="text-blue-100 text-lg max-w-md font-medium">
                  Hệ thống phân tích ngữ nghĩa tự động trích xuất các kỹ năng tiềm ẩn từ CV của bạn mà chính bạn cũng không nhận ra.
                </p>
              </div>
              <div className="absolute right-[-5%] bottom-[-5%] opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                 <BrainCircuit size={300} />
              </div>
            </motion.div>

            {/* Small Bento Box */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col justify-between"
            >
              <ShieldCheck size={40} className="text-emerald-400 mb-6" />
              <div>
                <h3 className="text-2xl font-black mb-3 uppercase italic">Bảo mật tuyệt đối</h3>
                <p className="text-slate-500 font-medium">Dữ liệu cá nhân và CV của bạn được mã hóa cấp độ quân đội.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] flex flex-col justify-between"
            >
              <Globe size={40} className="text-blue-400 mb-6" />
              <div>
                <h3 className="text-2xl font-black mb-3 uppercase italic">Remote First</h3>
                <p className="text-slate-500 font-medium">Hỗ trợ tìm kiếm các công việc làm từ xa trên toàn cầu.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-8 bg-indigo-500/10 border border-indigo-500/30 p-10 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <Target size={40} className="text-indigo-400 mb-6" />
                <h3 className="text-2xl font-black mb-3 uppercase italic">Smart Matching</h3>
                <p className="text-slate-400 font-medium">Thuật toán khớp lệnh thông minh giúp giảm 70% thời gian tuyển dụng cho doanh nghiệp.</p>
              </div>
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center font-bold text-xs">
                    U{i}
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-slate-950 bg-indigo-500 flex items-center justify-center font-bold text-xs">
                  +10k
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <footer className="py-20 text-center">
        <h2 className="text-3xl font-black mb-8 italic tracking-tighter">SẴN SÀNG CHO BƯỚC NHẢY VỌT?</h2>
        <div className="flex justify-center gap-6">
          <Star className="text-amber-400 animate-spin-slow" />
          <Star className="text-amber-400 animate-bounce" />
          <Star className="text-amber-400 animate-spin-slow" />
        </div>
        <p className="mt-8 text-slate-400 font-bold text-sm">© 2024 JOB.AI PLATFORM - TRANSFORMING TALENT ACQUISITION</p>
      </footer>
    </div>
  );
};

export default IntroPage;