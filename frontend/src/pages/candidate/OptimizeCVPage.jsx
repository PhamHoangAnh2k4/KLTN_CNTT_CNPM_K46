'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud, FileText, CheckCircle2, Sparkles, X,
  Bot, AlertTriangle, Hammer, Target, ArrowRight,
  Loader2, Briefcase, Award, CheckCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OptimizeCVPage = () => {
  // --- STATE UPLOAD & OPTIMIZATION ---
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // --- CONFIG API ---
  const API_BASE_URL = "http://localhost:8081";

  const getSessionUser = () => {
    if (typeof window === 'undefined') return {};
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    const localUser = sessionStorage.getItem('userAccount') || localStorage.getItem('userAccount');
    return localUser ? JSON.parse(localUser) : {};
  };

  const userAccount = getSessionUser();
  const userId = userAccount.userId || null;

  // --- HANDLE UPLOAD EVENTS ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Dung lượng file tối đa là 5MB!");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
    setIsDragOver(false);
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- SUBMIT FUNCTION ---
  const handleOptimize = async () => {
    if (!targetRole.trim()) {
      alert("Vui lòng nhập vị trí bạn muốn ứng tuyển!");
      return;
    }
    if (!file) {
      alert("Vui lòng tải lên CV của bạn!");
      return;
    }
    if (!userId) {
      alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại!");
      return;
    }

    setIsOptimizing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetRole", targetRole);
      formData.append("userId", userId);

      const response = await axios.post(`${API_BASE_URL}/api/cv/analyze-and-optimize`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
    } catch (error) {
      console.error("Lỗi khi tối ưu CV:", error);
      alert("Lỗi: " + (error.response?.data?.error || "Không thể kết nối đến server AI. Vui lòng thử lại!"));
    } finally {
      setIsOptimizing(false);
    }
  };

  // --- RENDER SCORE COLOR ---
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 50) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 font-sans overflow-hidden bg-slate-50/50">
      {/* Background Glows */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-15 pointer-events-none" />
      <div className="absolute top-0 -right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-15 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <div className="p-8 sm:p-14 relative z-10">
          {/* HEADER */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-lg shadow-indigo-500/20 relative group"
            >
              <Target size={40} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-3xl"></div>
              <Sparkles size={20} className="text-amber-300 absolute -top-2 -right-2 animate-pulse" />
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-4 tracking-tight">
              Tối Ưu CV Theo Target Role
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              Nhập vị trí mong muốn, tải lên CV hiện tại của bạn và để chuyên gia AI rà soát lỗi viết, tính điểm ATS và đề xuất sửa đổi cụ thể.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: INPUTS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Vị trí ứng tuyển mục tiêu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="VD: Senior Marketing, Backend Developer..."
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Tải CV của bạn <span className="text-rose-500">*</span>
                  </label>
                  <AnimatePresence mode="wait">
                    {!file ? (
                      <motion.div
                        key="upload-input"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                          isDragOver ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                        />
                        <UploadCloud size={32} className="mx-auto text-indigo-500 mb-2" />
                        <h4 className="font-bold text-slate-700 text-sm">Chọn file hoặc kéo thả</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Hỗ trợ PDF, PNG, JPG (Tối đa 5MB)</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file-details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 text-sm truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all"
                        >
                          <X size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>AI Đang Phân Tích...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Quét & Tối ưu bằng AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* SIDEBAR TIPS */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                  <Info size={16} className="text-indigo-500" /> Hướng dẫn tối ưu CV
                </h4>
                <ul className="text-xs text-slate-500 space-y-2.5 font-medium">
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Hãy nhập rõ chức danh và cấp bậc (ví dụ: Senior Frontend, Team Lead Java).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Đảm bảo ảnh chụp hoặc tài liệu PDF của bạn sắc nét và có chữ rõ ràng để AI OCR tốt nhất.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Chỉ số điểm CV dựa trên cấu trúc ATS nghiêm ngặt và mục tiêu công việc của bạn.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* RIGHT COLUMN: RESULTS */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                {isOptimizing && (
                  <motion.div
                    key="loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[450px]"
                  >
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                        <Bot size={40} className="text-indigo-600 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 border-4 border-dashed border-indigo-400 rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Đang phân tích cấu trúc CV...</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      AI đang so khớp hồ sơ với vị trí ứng tuyển <span className="font-semibold text-slate-700">"{targetRole}"</span>, bóc tách kỹ năng và tính toán điểm số ATS phù hợp.
                    </p>
                  </motion.div>
                )}

                {result && !isOptimizing && (
                  <motion.div
                    key="result-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* WARNING BANNER FOR NON-CV */}
                    {result.is_valid_cv === false && (
                      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <h3 className="font-black text-rose-800 text-base mb-1">Tài liệu tải lên không phải là CV</h3>
                          <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                            {result.invalid_reason || "Hệ thống phát hiện tài liệu bạn tải lên không có cấu trúc hoặc thông tin của một bản CV cá nhân tiêu chuẩn (thiếu tên, liên hệ, học vấn, kinh nghiệm...). Vui lòng tải lên CV chính xác để đánh giá chính xác."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SCORE & RELEVANCY */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      {/* SCORE */}
                      <div className="sm:col-span-5 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 pb-6 sm:pb-0 sm:pr-6">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="54" className="stroke-slate-100 fill-none" strokeWidth="8" />
                            <motion.circle
                              cx="64" cy="64" r="54"
                              className={`fill-none ${getScoreColor(result.pre_evaluation_score)}`}
                              strokeWidth="8"
                              strokeDasharray={2 * Math.PI * 54}
                              initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - (result.pre_evaluation_score || 0) / 100) }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                          </svg>
                          <span className="text-3xl font-black text-slate-800">{result.pre_evaluation_score || 0}</span>
                        </div>
                        <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider text-center">
                          Điểm đánh giá ATS
                        </h4>
                        {result.pre_evaluation_score >= 80 && (
                          <span className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Điểm ATS Rất Tốt</span>
                        )}
                        {result.pre_evaluation_score >= 50 && result.pre_evaluation_score < 80 && (
                          <span className="mt-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Điểm ATS Khá</span>
                        )}
                        {result.pre_evaluation_score < 50 && (
                          <span className="mt-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Điểm ATS Thấp</span>
                        )}
                      </div>
 
                      {/* RELEVANCY STATUS */}
                      <div className="sm:col-span-7 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          {result.target_role_match?.is_relevant ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                              <CheckCircle size={12} /> Mục tiêu tương thích
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100">
                              <AlertTriangle size={12} /> Cảnh báo lệch hướng
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-slate-800 text-lg mb-1">
                          {result.target_role_match?.is_relevant ? "Mục tiêu tương thích" : "Lệch mục tiêu ứng tuyển"}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {result.target_role_match?.message}
                        </p>
                      </div>
                    </div>

                    {/* OPTIMIZATION DETAILS */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <Award className="text-indigo-600" size={20} /> Khuyến nghị sửa đổi chi tiết
                      </h3>
                      <div className="space-y-4">
                        {result.optimization_details?.map((detail, index) => (
                          <div
                            key={index}
                            className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all space-y-2"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-bold border border-indigo-100">
                                {detail.section}
                              </span>
                              <span className="text-rose-500 font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                                <AlertTriangle size={12} /> {detail.status}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {detail.advice}
                            </p>
                          </div>
                        ))}
                        {(!result.optimization_details || result.optimization_details.length === 0) && (
                          <p className="text-sm text-slate-400 italic">Tuyệt vời! Không phát hiện lỗi nghiêm trọng nào.</p>
                        )}
                      </div>
                    </div>

                    {/* RECOMMENDED TOOLS */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <Hammer className="text-pink-500" size={20} /> Công cụ đề xuất
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.recommended_tools?.map((tool, index) => (
                          <div
                            key={index}
                            className="p-4 bg-gradient-to-br from-indigo-50/20 to-purple-50/20 rounded-2xl border border-slate-100"
                          >
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-1">
                              <CheckCircle2 size={14} className="text-indigo-600" /> {tool.tool_name}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                              {tool.reason}
                            </p>
                          </div>
                        ))}
                        {(!result.recommended_tools || result.recommended_tools.length === 0) && (
                          <p className="text-sm text-slate-400 italic">Không có công cụ đề xuất đặc biệt.</p>
                        )}
                      </div>
                    </div>

                    {/* Suggested jobs section removed */}
                  </motion.div>
                )}

                {!result && !isOptimizing && (
                  <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[450px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có kết quả phân tích</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                      Điền vị trí mong muốn ứng tuyển và tải CV lên để bắt đầu kiểm tra điểm số ATS.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OptimizeCVPage;
