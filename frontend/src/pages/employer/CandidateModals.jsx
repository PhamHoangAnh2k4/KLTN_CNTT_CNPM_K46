import React, { useState, useEffect } from 'react';
import {
  X, BrainCircuit, Mail, Briefcase, GraduationCap, Award,
  Sparkles, AlertCircle, MapPin, Calendar, Link as LinkIcon,
  ChevronRight, ThumbsUp, ThumbsDown, Info, Eye, Edit3, CheckCircle2,
  FileText, Layout, Download, ScanSearch, CheckCircle, XCircle, DollarSign, Mic, Play, Pause,
  Trash2, Plus, Lock
} from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// ==========================================
// 1. AI SCAN MODAL
// ==========================================
export const AiScanModal = ({ aiScan, setAiScan, startAiScan, confirmAiScan }) => {
  if (!aiScan.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">

        <div className="relative bg-slate-900 p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 border border-violet-500/30 rounded-2xl backdrop-blur-md">
                <Sparkles size={28} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">AI Smart Scanner</h3>
                <p className="text-slate-400 text-sm font-medium">Sàng lọc ứng viên bằng trí tuệ nhân tạo</p>
              </div>
            </div>
            {aiScan.step !== 'processing' && (
              <button onClick={() => setAiScan({ ...aiScan, isOpen: false, step: 'input' })} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          {aiScan.step === 'input' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <div>
                <label className="block text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Yêu cầu/Tiêu chí đặc biệt (Optional)</label>
                <div className="relative group">
                  <textarea
                    autoFocus rows="3"
                    placeholder="VD: Tìm ứng viên tốt nghiệp ĐH Bách Khoa, GPA trên 3.2..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-violet-500 focus:bg-white outline-none transition-all resize-none font-medium text-slate-700 shadow-inner"
                    value={aiScan.prompt}
                    onChange={(e) => setAiScan({ ...aiScan, prompt: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["GPA > 3.0", "Kinh nghiệm > 2 năm", "Tiếng Anh IELTS 6.5+"].map(chip => (
                    <button
                      key={chip}
                      onClick={() => setAiScan({ ...aiScan, prompt: aiScan.prompt + (aiScan.prompt ? ', ' : '') + chip })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-violet-500 hover:text-violet-600 transition-all shadow-sm"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mb-6">
                <h4 className="text-sm font-black text-emerald-800 mb-2 flex items-center gap-2"><Sparkles size={18} /> Chế Độ Phân Tích Thông Minh</h4>
                <p className="text-xs font-medium text-emerald-600 leading-relaxed">
                  Hệ thống sẽ dùng Mock Vector DB (Cosine Similarity) để đọc CV và đối chiếu với JD.
                  AI Agent sẽ đánh giá mức độ phù hợp, tính trung thực, phân tích điểm mạnh/yếu, và <strong>đề xuất nên tiếp tục phỏng vấn hay từ chối</strong> cho từng ứng viên.
                </p>
              </div>

              <button onClick={startAiScan} className="w-full py-4 bg-violet-600 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:bg-violet-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                <BrainCircuit size={20} /> BẮT ĐẦU PHÂN TÍCH BẰNG AI
              </button>
            </div>
          )}

          {aiScan.step === 'processing' && (
            <div className="py-8 flex flex-col items-center space-y-6 animate-in fade-in">
              <div className="relative w-full h-48 bg-slate-50 border-2 border-dashed border-violet-300 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                <div
                  className="absolute left-0 w-full h-1 bg-violet-500 shadow-[0_0_20px_#8b5cf6] z-10"
                  style={{ animation: 'scan-laser 2s ease-in-out infinite' }}
                />
                <style>{`
                  @keyframes scan-laser {
                    0%, 100% { top: 0%; opacity: 0; }
                    10%, 90% { opacity: 1; }
                    50% { top: 100%; }
                  }
                `}</style>

                <div className="absolute inset-0 bg-violet-50/50 flex flex-col items-center justify-center animate-pulse z-0">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin absolute"></div>
                    <ScanSearch size={32} className="text-violet-600" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">Đang quét & đối chiếu bằng Gemini...</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">
                  Hệ thống đang chạy OCR bóc tách dữ liệu và tính toán Match Score.
                </p>
              </div>
            </div>
          )}

          {aiScan.step === 'preview' && (
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-4 w-16 h-16" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">Đã quét xong CV!</h3>
                <p className="text-slate-500 font-medium">Hệ thống đã cập nhật điểm số và phân tích chi tiết cho từng ứng viên.</p>
              </div>

              <button onClick={confirmAiScan} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                XEM KẾT QUẢ ĐÁNH GIÁ <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. CV MODAL (HIỂN THỊ DỮ LIỆU TỪ AI)
// ==========================================
export const CvModal = ({ cvModal, closeCvModal, openEmailModal, getStatusStyle, onStatusChange }) => {
  const [viewMode, setViewMode] = useState('summary');
  const [offerSuggestion, setOfferSuggestion] = useState(null);
  const [loadingOffer, setLoadingOffer] = useState(false);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [criteriaMatrix, setCriteriaMatrix] = useState(null);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [decision, setDecision] = useState('pass'); // 'pass' or 'fail'
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const [expectedSalary, setExpectedSalary] = useState('');
  const [salaryType, setSalaryType] = useState('Gross');
  const [savingSalary, setSavingSalary] = useState(false);

  const { id: jobIdParam } = useParams();
  const API_BASE_URL = "http://localhost:8081";

  const candidate = cvModal.candidate;

  const handleSaveSalary = async () => {
    if (!expectedSalary || isNaN(parseFloat(expectedSalary)) || parseFloat(expectedSalary) <= 0) {
      alert("Vui lòng nhập mức lương hợp lệ (ví dụ: 15 = 15 triệu VNĐ)");
      return;
    }
    setSavingSalary(true);
    try {
      const salaryInVnd = Math.round(parseFloat(expectedSalary) * 1000000);
      await axios.put(`${API_BASE_URL}/api/applications/update-salary`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id,
        expectedSalary: salaryInVnd,
        salaryType: salaryType
      });
      candidate.expectedSalary = salaryInVnd;
      candidate.salaryType = salaryType;
      alert("Đã cập nhật mức đề xuất của ứng viên!");
    } catch (error) {
      console.error("Lỗi khi lưu mức lương đề xuất:", error.response?.data || error.message);
      alert("Lỗi khi lưu mức đề xuất: " + (error.response?.data?.error || error.message));
    } finally {
      setSavingSalary(false);
    }
  };

  const normalizeMatrix = (parsed) => {
    if (!parsed) return null;
    let criteria = [];
    if (Array.isArray(parsed)) {
      criteria = parsed;
    } else if (parsed && Array.isArray(parsed.criteria)) {
      criteria = parsed.criteria;
    } else if (parsed && typeof parsed === 'object') {
      criteria = parsed.criteria || [];
    }

    let weightSum = criteria.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);

    // Tự động chuẩn hóa tổng trọng số về 100% nếu ban đầu chưa bằng 100%
    if (weightSum > 0 && weightSum !== 100) {
      let currentSum = 0;
      for (let i = 0; i < criteria.length; i++) {
        if (i === criteria.length - 1) {
          // Gán phần còn thiếu cho tiêu chí cuối cùng để chắc chắn tổng là 100
          criteria[i].weight = 100 - currentSum;
        } else {
          const w = parseFloat(criteria[i].weight) || 0;
          const scaled = Math.round((w / weightSum) * 100);
          criteria[i].weight = scaled;
          currentSum += scaled;
        }
      }
      weightSum = 100; // Cập nhật lại tổng mới
    } else if (weightSum === 0 && criteria.length > 0) {
      // Nếu tổng bằng 0 (có thể AI không sinh weight), chia đều cho các tiêu chí
      const equalWeight = Math.floor(100 / criteria.length);
      for (let i = 0; i < criteria.length; i++) {
        criteria[i].weight = i === criteria.length - 1 ? 100 - (equalWeight * (criteria.length - 1)) : equalWeight;
      }
      weightSum = 100;
    }

    let weightedScoreSum = criteria.reduce((acc, item) => acc + ((parseFloat(item.score) || 0) * (parseFloat(item.weight) || 0)), 0);
    let calculatedOverall = weightSum > 0 ? parseFloat((weightedScoreSum / weightSum).toFixed(2)) : 0;

    return {
      criteria: criteria.map(item => ({
        name: item.name || '',
        weight: item.weight === '' ? '' : (parseFloat(item.weight) || 0),
        score: parseFloat(item.score) || 0,
        comment: item.comment || ''
      })),
      overallScore: calculatedOverall // Luôn tính lại điểm tổng sau khi scale weight
    };
  };

  // Auto-load dữ liệu đã lưu trong DB khi mở modal
  useEffect(() => {
    if (candidate) {
      setExpectedSalary(candidate.expectedSalary ? (candidate.expectedSalary / 1000000).toString() : '');
      setSalaryType(candidate.salaryType || 'Gross');

      if (candidate.offerSuggestion) {
        try { setOfferSuggestion(JSON.parse(candidate.offerSuggestion)); } catch (e) { setOfferSuggestion(null); }
      } else {
        setOfferSuggestion(null);
      }

      if (candidate.criteriaMatrix) {
        try {
          const parsed = JSON.parse(candidate.criteriaMatrix);
          setCriteriaMatrix(normalizeMatrix(parsed));
        } catch (e) {
          setCriteriaMatrix(null);
        }
      } else {
        setCriteriaMatrix(null);
      }
    } else {
      setOfferSuggestion(null);
      setExpectedSalary('');
      setSalaryType('Gross');
    }
  }, [candidate?.id]);

  if (!cvModal.isOpen || !cvModal.candidate) return null;

  const candidateName = candidate.fullName || candidate.name || "Ứng viên chưa rõ tên";
  const firstLetter = candidateName.charAt(0).toUpperCase();
  const matchScore = candidate.matchScore || 0;
  const status = candidate.localStatus || "pending";
  const totalWeight = criteriaMatrix?.criteria?.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0) || 0;

  // TIẾN HÀNH DỊCH JSON TỪ AI CHUYỂN VỀ
  let aiData = null;
  let evidenceData = [];
  try {
    if (candidate.aiSummary) aiData = JSON.parse(candidate.aiSummary);
    if (candidate.aiEvidence) evidenceData = JSON.parse(candidate.aiEvidence);
  } catch (error) {
    console.error("Lỗi đọc JSON AI:", error);
  }

  const handleSuggestOffer = async () => {
    setLoadingOffer(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/employer-ai/offer-suggestion`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id
      });
      setOfferSuggestion(res.data);
    } catch (error) {
      alert("Lỗi khi gợi ý Offer!");
    } finally {
      setLoadingOffer(false);
    }
  };


  const handleGenerateCriteria = async () => {
    setLoadingCriteria(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/employer-ai/generate-criteria`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id
      });
      setCriteriaMatrix(normalizeMatrix(res.data));
    } catch (error) {
      alert("Lỗi khi tạo Bảng tiêu chí!");
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleUpdateCriteriaItem = (index, field, value) => {
    setCriteriaMatrix(prev => {
      if (!prev) return null;
      const updatedCriteria = [...prev.criteria];

      let parsedValue = value;
      if (field === 'score') {
        parsedValue = parseFloat(value) || 0;
      } else if (field === 'weight') {
        parsedValue = value === '' ? '' : (parseFloat(value) || 0);
      }

      updatedCriteria[index] = {
        ...updatedCriteria[index],
        [field]: parsedValue
      };

      let weightSum = updatedCriteria.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
      let weightedScoreSum = updatedCriteria.reduce((acc, item) => acc + ((parseFloat(item.score) || 0) * (parseFloat(item.weight) || 0)), 0);
      let calculatedOverall = weightSum > 0 ? parseFloat((weightedScoreSum / weightSum).toFixed(2)) : 0;

      return {
        criteria: updatedCriteria,
        overallScore: calculatedOverall
      };
    });
  };

  const handleDeleteCriteriaItem = (index) => {
    setCriteriaMatrix(prev => {
      if (!prev) return null;
      const updatedCriteria = prev.criteria.filter((_, i) => i !== index);

      let weightSum = updatedCriteria.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
      let weightedScoreSum = updatedCriteria.reduce((acc, item) => acc + ((parseFloat(item.score) || 0) * (parseFloat(item.weight) || 0)), 0);
      let calculatedOverall = weightSum > 0 ? parseFloat((weightedScoreSum / weightSum).toFixed(2)) : 0;

      return {
        criteria: updatedCriteria,
        overallScore: calculatedOverall
      };
    });
  };

  const handleAddCriteriaItem = () => {
    setCriteriaMatrix(prev => {
      const newCriteria = {
        name: "Tiêu chí mới",
        weight: 10,
        score: 5,
        comment: ""
      };
      const updatedCriteria = prev ? [...(prev.criteria || []), newCriteria] : [newCriteria];

      let weightSum = updatedCriteria.reduce((acc, item) => acc + (parseFloat(item.weight) || 0), 0);
      let weightedScoreSum = updatedCriteria.reduce((acc, item) => acc + ((parseFloat(item.score) || 0) * (parseFloat(item.weight) || 0)), 0);
      let calculatedOverall = weightSum > 0 ? parseFloat((weightedScoreSum / weightSum).toFixed(2)) : 0;

      return {
        criteria: updatedCriteria,
        overallScore: calculatedOverall
      };
    });
  };

  const handleSaveCriteria = async () => {
    if (!criteriaMatrix) return;
    if (totalWeight !== 100) {
      alert(`Tổng trọng số của các tiêu chí phải bằng 100% (Hiện tại đang là ${totalWeight}%). Vui lòng điều chỉnh lại!`);
      return;
    }
    setSavingCriteria(true);
    try {
      await axios.post(`${API_BASE_URL}/api/employer-ai/update-criteria`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id,
        matrix: JSON.stringify(criteriaMatrix)
      });

      candidate.criteriaMatrix = JSON.stringify(criteriaMatrix);
      alert("Đã lưu đánh giá bảng tiêu chí!");
    } catch (error) {
      console.error("Lỗi khi lưu bảng tiêu chí:", error);
      alert("Lỗi khi lưu bảng tiêu chí!");
    } finally {
      setSavingCriteria(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!criteriaMatrix) {
      alert("Vui lòng khởi tạo bảng đánh giá tiêu chí trước!");
      return;
    }
    if (totalWeight !== 100) {
      alert(`Tổng trọng số của các tiêu chí phải bằng 100% (Hiện tại đang là ${totalWeight}%). Vui lòng điều chỉnh lại!`);
      return;
    }
    setSubmittingDecision(true);
    try {
      // 1. Silent save criteria
      await axios.post(`${API_BASE_URL}/api/employer-ai/update-criteria`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id,
        matrix: JSON.stringify(criteriaMatrix)
      });
      candidate.criteriaMatrix = JSON.stringify(criteriaMatrix);

      // 2. Update status
      const targetStatus = decision === 'pass' ? 'passed' : 'rejected';
      const rejectReason = decision === 'fail' ? 'Kinh nghiệm chuyên môn chưa đáp ứng đủ yêu cầu của vị trí này.' : null;

      await axios.put(`${API_BASE_URL}/api/applications/update-status`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id,
        status: targetStatus,
        rejectReason: rejectReason
      });

      alert(`Đã cập nhật kết quả phỏng vấn ứng viên thành công!`);

      // Trigger status change in parent component
      if (onStatusChange) {
        onStatusChange();
      }

      // 3. Navigation/Modal redirection
      if (decision === 'pass') {
        // Switch tab to offer suggestion
        setViewMode('offer');
      } else {
        // Close current CvModal and open EmailModal with reject type
        closeCvModal();
        openEmailModal(candidate, 'reject');
      }
    } catch (error) {
      console.error("Lỗi khi hoàn tất đánh giá:", error);
      alert("Lỗi khi hoàn tất đánh giá!");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const canEvaluate = candidate?.localStatus === 'interviewing' || candidate?.localStatus === 'passed';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300 transition-all ${viewMode === 'pdf' ? 'w-full max-w-6xl h-[95vh]' : 'w-full max-w-4xl max-h-[90vh]'}`}>

        {/* Header Tab */}
        <div className="h-20 bg-slate-900 relative shrink-0 flex items-center justify-between px-8 text-white">
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar pr-4">
            <div className="flex bg-slate-800 p-1 rounded-2xl border border-white/10 shrink-0">
              <button
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'summary' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Layout size={14} /> TÓM TẮT AI
              </button>
              <button
                onClick={() => canEvaluate ? setViewMode('criteria') : alert("Bạn cần chuyển ứng viên sang trạng thái Phỏng Vấn (bằng cách Gửi Email Hẹn Phỏng Vấn) để mở khóa Đánh Giá Tiêu Chí.")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${!canEvaluate ? 'opacity-50 cursor-not-allowed bg-slate-800/50 text-slate-500' : viewMode === 'criteria' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {!canEvaluate ? <Lock size={14} /> : <Award size={14} />} ĐÁNH GIÁ TIÊU CHÍ
              </button>
              <button
                onClick={() => canEvaluate ? setViewMode('offer') : alert("Bạn cần chuyển ứng viên sang trạng thái Phỏng Vấn để mở khóa Đề Xuất Offer.")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${!canEvaluate ? 'opacity-50 cursor-not-allowed bg-slate-800/50 text-slate-500' : viewMode === 'offer' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {!canEvaluate ? <Lock size={14} /> : <DollarSign size={14} />} ĐỀ XUẤT OFFER
              </button>
            </div>
          </div>
          <button onClick={closeCvModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all shrink-0 ml-4">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* TAB TÓM TẮT AI */}
          {viewMode === 'summary' && (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-slate-50 p-1 shadow-inner border border-slate-100 flex items-center justify-center text-3xl font-black text-slate-300 uppercase">
                    {firstLetter}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{candidateName}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-500">
                        <MapPin size={16} className="text-slate-400" /> {candidate.location || "Chưa xác định"}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle ? getStatusStyle(status) : 'bg-amber-100 text-amber-600'}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl text-center min-w-[100px]">
                    <div className="text-3xl font-black text-emerald-700">{matchScore}%</div>
                    <div className="text-[10px] font-black uppercase text-emerald-600 mt-1">Match</div>
                  </div>
                  <div className={`${candidate.legitScore >= 80 ? 'bg-blue-50 border-blue-100 text-blue-700' : candidate.legitScore >= 50 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700'} border p-4 rounded-3xl text-center min-w-[100px]`}>
                    <div className="text-3xl font-black">{candidate.legitScore || 0}%</div>
                    <div className="text-[10px] font-black uppercase opacity-80 mt-1">Trust</div>
                  </div>
                  <button onClick={() => setShowPdfModal(true)} className="flex flex-col items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition-all font-bold text-xs gap-1">
                    <FileText size={20} className="text-slate-500" /> Xem CV Gốc
                  </button>
                </div>
              </div>

              {/* Khối AI Đề Xuất Chi Tiết */}
              {aiData?.recommendation && (
                <div className="mt-6 mb-8">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🤖</span> AI Đề Xuất Tuyển Dụng
                  </h4>
                  <div className={`p-4 border-l-4 rounded-r-md font-medium italic text-sm leading-relaxed shadow-sm ${aiData.recommendation.toLowerCase().includes('loại')
                    ? 'bg-rose-50/80 border-rose-500 text-rose-900'
                    : 'bg-emerald-50/80 border-emerald-500 text-emerald-900'
                    }`}>
                    {aiData.recommendation}
                  </div>
                </div>
              )}

              {aiData ? (
                <>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-8">
                      <section>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle2 size={16} /> Phân tích Evidence</h4>
                        <div className="space-y-3">
                          {evidenceData && evidenceData.length > 0 ? evidenceData.map((ev, i) => (
                            <div key={i} className={`p-3.5 rounded-xl border text-xs font-medium transition-all hover:-translate-y-1 hover:shadow-md ${ev.type === 'red_flag' ? 'bg-rose-50/80 border-rose-200 text-rose-700 hover:shadow-rose-100' : 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:shadow-emerald-100'}`}>
                              {ev.type === 'red_flag' ? <AlertCircle size={14} className="inline mb-0.5 mr-1.5" /> : <CheckCircle size={14} className="inline mb-0.5 mr-1.5" />}
                              {ev.content}
                            </div>
                          )) : <p className="text-xs text-slate-400 italic">Không có evidence nổi bật.</p>}
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><GraduationCap size={16} /> Học vấn</h4>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                          <p className="text-sm font-black text-slate-800">{aiData.education?.school || "Không rõ"}</p>
                          <p className="text-xs text-slate-500 font-bold mt-1 italic">{aiData.education?.major || "Không rõ chuyên ngành"}</p>
                          {aiData.education?.gpa && <div className="mt-3 text-[11px] font-black text-blue-600">GPA: {aiData.education.gpa}</div>}
                        </div>
                      </section>
                      <section>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BrainCircuit size={16} /> Kỹ năng lõi (AI)</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiData.skills && Array.isArray(aiData.skills) && aiData.skills.length > 0 ? (
                            aiData.skills.map((s, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-xl uppercase">{s}</span>
                            ))
                          ) : (
                            <span className="text-sm italic text-slate-400">Không phân tích được kỹ năng.</span>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={16} /> Kinh nghiệm làm việc</h4>
                      <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {aiData.workHistory && Array.isArray(aiData.workHistory) && aiData.workHistory.length > 0 ? aiData.workHistory.map((work, idx) => (
                          <div key={idx} className="pl-8 relative">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-blue-500 shadow-sm"></div>
                            <h5 className="font-black text-slate-800 text-lg leading-none">{work.role}</h5>
                            <p className="text-sm font-bold text-blue-600 my-2">{work.company} • <span className="text-slate-400">{work.duration}</span></p>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">{work.description}</p>
                          </div>
                        )) : <p className="pl-8 italic text-slate-400 text-sm">Chưa có kinh nghiệm hoặc AI không thể trích xuất.</p>}
                      </div>

                      {/* Hiển thị Văn bản OCR - Business Premium Style */}
                      {aiData.ocrText && (
                        <div className="mt-10">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={16} /> BẢN TRÍCH XUẤT VĂN BẢN (OCR)
                          </h4>
                          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                <Sparkles size={14} className="text-blue-500" />
                                Dữ liệu được số hóa tự động bởi AI
                              </div>
                              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">READ-ONLY</span>
                            </div>
                            <div className="relative p-8 max-h-[450px] overflow-y-auto custom-scrollbar bg-[#FCFCFD]">
                              <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100/50 w-64 h-64 pointer-events-none" />
                              <div className="relative z-10 text-[14px] leading-loose text-slate-700 font-medium whitespace-pre-wrap selection:bg-blue-100">
                                {aiData.ocrText}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center text-slate-400">
                  <Sparkles size={48} className="mb-4 text-slate-200" />
                  <p className="font-bold">Ứng viên chưa được AI quét hoặc lỗi dữ liệu hệ thống.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB ĐÁNH GIÁ TIÊU CHÍ */}
          {viewMode === 'criteria' && (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in slide-in-from-right-4 duration-300">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <Award className="text-violet-500" size={24} /> Bảng Tiêu Chí Đánh Giá (Criteria Matrix)
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">Đánh giá ứng viên chi tiết theo các tiêu chí của Job Description</p>
                  </div>
                  {criteriaMatrix && status === 'interviewing' && (
                    <button
                      onClick={handleSaveCriteria}
                      disabled={savingCriteria}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                    >
                      <CheckCircle size={14} /> {savingCriteria ? "Đang lưu..." : "LƯU ĐÁNH GIÁ"}
                    </button>
                  )}
                </div>

                {/* Khối nhập lương ứng viên đề xuất */}
                <div className="mt-4 mb-8 p-5 bg-slate-50 border border-slate-200 rounded-3xl w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" /> Mức lương ứng viên đề xuất
                    </h4>
                    {expectedSalary && (
                      <button
                        type="button"
                        onClick={handleSaveSalary}
                        disabled={savingSalary}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1 shadow-sm"
                      >
                        {savingSalary ? "Đang lưu..." : "CẬP NHẬT LƯƠNG"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Số tiền đề xuất</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Nhập mức lương (VD: 15)"
                          value={expectedSalary}
                          onChange={(e) => setExpectedSalary(e.target.value)}
                          className="w-full pl-4 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Triệu VNĐ</span>
                      </div>
                    </div>

                    {expectedSalary && parseFloat(expectedSalary) > 0 && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Chuẩn lương & Quy đổi</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSalaryType('Gross')}
                            className={`py-2 px-3 rounded-xl border text-left transition-all ${salaryType === 'Gross'
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <div className="text-[10px] font-black text-slate-700">GROSS</div>
                            <div className="text-[10px] text-blue-700 font-bold mt-0.5">Net: ~{Math.round(parseFloat(expectedSalary) * 0.895 * 10) / 10}tr</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSalaryType('Net')}
                            className={`py-2 px-3 rounded-xl border text-left transition-all ${salaryType === 'Net'
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-100'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                          >
                            <div className="text-[10px] font-black text-slate-700">NET</div>
                            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Gross: ~{Math.round(parseFloat(expectedSalary) / 0.895 * 10) / 10}tr</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!expectedSalary && (
                    <p className="text-[10px] text-slate-400 mt-2 italic">* Hiện chưa có dữ liệu đề xuất lương. Nhập vào để AI phân tích khi viết offer.</p>
                  )}
                </div>

                {!criteriaMatrix && !loadingCriteria && (
                  <div className="py-16 text-center bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                    <Award size={48} className="mx-auto text-slate-300 mb-4" />
                    <h4 className="text-base font-bold text-slate-700 mb-2">Chưa khởi tạo bảng tiêu chí</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">Hệ thống sẽ đối chiếu CV của ứng viên với mô tả công việc để tự động trích xuất các tiêu chí đánh giá phù hợp.</p>
                    <button onClick={handleGenerateCriteria} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl text-xs hover:-translate-y-0.5 transition-all shadow-lg shadow-violet-200 flex items-center gap-2 mx-auto">
                      <Sparkles size={14} /> KHỞI TẠO BẢNG TIÊU CHÍ (AI)
                    </button>
                  </div>
                )}

                {loadingCriteria && (
                  <div className="py-16 flex flex-col items-center justify-center bg-violet-50/50 rounded-3xl border border-violet-100">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-bold text-violet-600">Đang phân tích bảng tiêu chí dựa trên JD...</p>
                    <p className="text-xs text-violet-400 mt-1">Quá trình này có thể mất vài giây.</p>
                  </div>
                )}

                {criteriaMatrix && (
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/3">Tiêu chí</th>
                              <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/6 text-center">Trọng số</th>
                              <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/6 text-center">Điểm số</th>
                              <th className="p-4 font-black text-slate-600 border-b border-slate-200">Nhận xét</th>
                              {status === 'interviewing' && <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-12 text-center"></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {criteriaMatrix.criteria && criteriaMatrix.criteria.map((c, i) => (
                              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="p-4">
                                  {status === 'interviewing' ? (
                                    <input
                                      type="text"
                                      value={c.name}
                                      onChange={(e) => handleUpdateCriteriaItem(i, 'name', e.target.value)}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                                    />
                                  ) : (
                                    <span className="font-bold text-slate-700">{c.name}</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {status === 'interviewing' ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={c.weight}
                                        onChange={(e) => handleUpdateCriteriaItem(i, 'weight', e.target.value)}
                                        className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center font-medium text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                                      />
                                      <span className="text-xs font-bold text-slate-400">%</span>
                                    </div>
                                  ) : (
                                    <span className="font-medium text-slate-500">{c.weight}%</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {status === 'interviewing' ? (
                                    <select
                                      value={c.score}
                                      onChange={(e) => handleUpdateCriteriaItem(i, 'score', e.target.value)}
                                      className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                                    >
                                      {[...Array(11).keys()].map(val => (
                                        <option key={val} value={val}>{val}/10</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black ${c.score >= 8 ? "bg-emerald-100 text-emerald-700" : c.score >= 5 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                      {c.score}/10
                                    </span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {status === 'interviewing' ? (
                                    <input
                                      type="text"
                                      value={c.comment || ''}
                                      onChange={(e) => handleUpdateCriteriaItem(i, 'comment', e.target.value)}
                                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                                      placeholder="Nhập nhận xét..."
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-slate-600">{c.comment}</span>
                                  )}
                                </td>
                                {status === 'interviewing' && (
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => handleDeleteCriteriaItem(i)}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Xóa tiêu chí"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold">
                            <tr className="border-b border-slate-200">
                              <td className="p-4 text-right font-black text-slate-700">TỔNG TRỌNG SỐ:</td>
                              <td className="p-4 text-center">
                                <span className={`text-base font-black ${totalWeight === 100 ? "text-emerald-600" : "text-rose-500"}`}>
                                  {totalWeight}%
                                </span>
                              </td>
                              <td colSpan={status === 'interviewing' ? 3 : 2}>
                                {status === 'interviewing' && totalWeight !== 100 && (
                                  <span className="text-xs font-black text-rose-500 animate-pulse">
                                    (Cần điều chỉnh tổng trọng số về đúng 100%)
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="2" className="p-4 text-right font-black text-slate-700">TỔNG ĐIỂM BÌNH QUÂN GIA QUYỀN:</td>
                              <td className="p-4 text-center">
                                <span className="text-lg font-black text-blue-600">{criteriaMatrix.overallScore}/10</span>
                              </td>
                              <td colSpan={status === 'interviewing' ? 2 : 1}></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {status === 'interviewing' && (
                      <button
                        onClick={handleAddCriteriaItem}
                        className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold border border-violet-200 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus size={14} /> Thêm tiêu chí mới
                      </button>
                    )}

                    {/* QUYẾT ĐỊNH ĐÁNH GIÁ */}
                    {status === 'interviewing' && (
                      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-violet-500" /> QUYẾT ĐỊNH KẾT QUẢ PHỎNG VẤN
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <button
                            type="button"
                            onClick={() => setDecision('pass')}
                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${decision === 'pass' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                          >
                            {decision === 'pass' && <div className="absolute top-3 right-3 text-emerald-500"><CheckCircle2 size={18} /></div>}
                            <div className={`p-3 rounded-full ${decision === 'pass' ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                              <ThumbsUp size={28} className={decision === 'pass' ? 'text-emerald-600' : 'text-slate-400'} />
                            </div>
                            <span className="font-black uppercase tracking-widest text-sm">Đạt phỏng vấn (Pass)</span>
                            <span className="text-[10px] font-medium text-slate-400">Chuyển sang bước Đề xuất Offer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDecision('fail')}
                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${decision === 'fail' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                          >
                            {decision === 'fail' && <div className="absolute top-3 right-3 text-rose-500"><XCircle size={18} /></div>}
                            <div className={`p-3 rounded-full ${decision === 'fail' ? 'bg-rose-100' : 'bg-slate-50'}`}>
                              <ThumbsDown size={28} className={decision === 'fail' ? 'text-rose-600' : 'text-slate-400'} />
                            </div>
                            <span className="font-black uppercase tracking-widest text-sm">Không đạt (Fail)</span>
                            <span className="text-[10px] font-medium text-slate-400">Chuyển sang bước Gửi thư báo trượt</span>
                          </button>
                        </div>

                        <button
                          onClick={handleSubmitEvaluation}
                          disabled={submittingDecision}
                          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${decision === 'pass' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'}`}
                        >
                          <CheckCircle size={18} />
                          {submittingDecision ? "Đang xử lý..." : "HOÀN TẤT ĐÁNH GIÁ & SUBMIT"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB XEM PDF */}
          {viewMode === 'pdf' && (
            <div className="flex-1 bg-slate-100 p-4 flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-white rounded-2xl shadow-inner flex-1 overflow-hidden relative">
                {candidate.cvUrl ? (
                  <iframe
                    src={candidate.cvUrl}
                    className="w-full h-full border-none"
                    title="Original CV"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400">
                    <AlertCircle size={48} className="mb-4 text-slate-300" />
                    <p className="font-bold">Ứng viên chưa tải lên CV dạng file hệ thống.</p>
                  </div>
                )}
                {candidate.cvUrl && (
                  <div className="absolute bottom-6 right-6">
                    <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl hover:scale-105 transition-all font-black text-xs uppercase tracking-widest">
                      <Download size={18} /> Mở / Tải xuống
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB ĐỀ XUẤT OFFER */}
          {viewMode === 'offer' && (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in slide-in-from-right-4 duration-300">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">AI Agent - Gợi Ý Đãi Ngộ</h3>
                  <p className="text-slate-500 font-medium mt-2">Dựa trên JD, ngân sách công ty và điểm số của ứng viên</p>
                </div>

                {!offerSuggestion && !loadingOffer && (
                  <>
                    {candidate.expectedSalary && (
                      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-6 flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0"><DollarSign size={24} /></div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Mức lương ứng viên đề xuất</p>
                          <p className="text-xl font-black text-slate-800">{new Intl.NumberFormat('vi-VN').format(candidate.expectedSalary)} VNĐ <span className="text-sm font-bold text-slate-500">({candidate.salaryType || 'Gross'})</span></p>
                          <div className="text-xs font-medium text-emerald-700 mt-2 pt-2 border-t border-emerald-100">
                            {candidate.salaryType === 'Net' ? (
                              <span>Quy đổi Gross tương đương: <strong>{new Intl.NumberFormat('vi-VN').format(Math.round(candidate.expectedSalary / 0.895))} VNĐ</strong></span>
                            ) : (
                              <span>Quy đổi Net tương đương: <strong>{new Intl.NumberFormat('vi-VN').format(Math.round(candidate.expectedSalary * 0.895))} VNĐ</strong></span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 mt-1">Dữ liệu này sẽ được AI tham khảo khi đề xuất mức lương cuối cùng.</p>
                        </div>
                      </div>
                    )}
                    <button onClick={handleSuggestOffer} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                      <Sparkles size={18} /> PHÂN TÍCH VÀ ĐỀ XUẤT NGAY
                    </button>
                  </>
                )}

                {loadingOffer && (
                  <div className="py-12 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-amber-600">Đang thu thập dữ liệu ngân sách và tính toán...</p>
                  </div>
                )}

                {offerSuggestion && (
                  <div className="space-y-6">
                    {/* Refresh button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setOfferSuggestion(null)}
                        className="text-xs font-bold text-slate-400 hover:text-amber-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all"
                      >
                        <Edit3 size={12} /> Phân tích lại
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ phù hợp</p>
                        <p className="text-xl font-black text-blue-600">{offerSuggestion.suggestedLevel}</p>
                      </div>
                      <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">Mức lương đề xuất</p>
                        <p className="text-xl font-black text-amber-700">{offerSuggestion.suggestedSalary}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Loại Hợp Đồng & Thưởng</h4>
                      <p className="text-sm font-bold text-slate-700 mb-2">• {offerSuggestion.contractType}</p>
                      <p className="text-sm font-bold text-slate-700">• {offerSuggestion.bonus}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Lý do đề xuất (AI Reasoning)</h4>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed">{offerSuggestion.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>

        {showPdfModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl flex flex-col w-full max-w-6xl h-[95vh] animate-in zoom-in-95">
              <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-50 rounded-t-[2rem]">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> CV Gốc: {candidateName}</h3>
                <button onClick={() => setShowPdfModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex-1 bg-slate-100 p-4 relative">
                {candidate.cvUrl ? (
                  <iframe src={candidate.cvUrl} className="w-full h-full border-none rounded-xl" title="Original CV" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <AlertCircle size={48} className="mb-4" />
                    <p>Chưa có file CV gốc</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-3 ml-auto">
            <button onClick={closeCvModal} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all">Đóng</button>
            <button
              onClick={() => { closeCvModal(); openEmailModal(candidate); }}
              className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 flex items-center gap-2"
            >
              <Mail size={18} /> LIÊN HỆ NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. EMAIL MODAL
// ==========================================
export const EmailModal = ({ emailModal, closeEmailModal, emailForm, setEmailForm, handleSendEmailSubmit }) => {
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => {
    if (emailModal.isOpen && emailModal.candidate) {
      const pref = emailModal.candidate.interviewPreference;
      const isOverridden = emailModal.candidate.interviewPreferenceOverride || false;

      setEmailForm(prev => {
        let loc = prev.locationOrLink;
        // Chỉ ghi đè khi chưa lưu override và có lựa chọn
        if (!isOverridden && pref) {
          if (pref === 'online') {
            loc = "https://meet.google.com/abc-xyz-123 (Google Meet)";
          } else if (pref === 'offline') {
            loc = "Văn phòng JobAI - Tầng 5, Tòa nhà Innovation, Hà Nội";
          }
        }
        return {
          ...prev,
          interviewPreference: pref || 'online',
          interviewPreferenceOverride: isOverridden,
          locationOrLink: loc || ''
        };
      });
    }
  }, [emailModal.isOpen, emailModal.candidate, setEmailForm]);

  if (!emailModal.isOpen) return null;
  const candidateName = emailModal.candidate?.fullName || emailModal.candidate?.name || "Ứng viên";

  const renderEmailPreview = () => {
    if (emailForm.type === 'interview') {
      return (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <div>
            <p className="text-lg text-slate-800">Thân gửi <strong className="font-black text-blue-600">{candidateName}</strong>,</p>
            <p className="mt-2">Lời đầu tiên, <strong className="font-bold text-slate-900">JobAI</strong> xin chân thành cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vào đội ngũ của chúng tôi.</p>
            <p className="mt-2">Ban Tuyển Dụng trân trọng kính mời bạn tham gia buổi phỏng vấn để chúng ta có cơ hội trao đổi chi tiết hơn.</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1 rounded-2xl shadow-sm border border-blue-100">
            <div className="bg-white rounded-xl p-6 relative overflow-hidden">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={16} /> Thông tin lịch hẹn
              </h4>
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Thời gian dự kiến</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {emailForm.datetime ? new Date(emailForm.datetime).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' }) : "Chưa cập nhật thời gian"}
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <MapPin size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Hình thức / Địa điểm</p>
                    <p className="text-base font-bold text-blue-600 mt-0.5 break-words">
                      {emailForm.locationOrLink || "Chưa cập nhật địa điểm"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (emailForm.type === 'offer') {
      return (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <div>
            <p className="text-lg text-slate-800">Thân gửi <strong className="font-black text-emerald-600">{candidateName}</strong>,</p>
            <p className="mt-2">Chúng tôi rất vui mừng thông báo bạn đã <strong>TRÚNG TUYỂN</strong> sau vòng phỏng vấn vừa qua tại <strong className="font-bold text-slate-900">JobAI</strong>.</p>
            <p className="mt-2">Dưới đây là chi tiết về Thư mời nhận việc (Offer) của bạn:</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-1 rounded-2xl shadow-sm border border-emerald-100">
            <div className="bg-white rounded-xl p-6 relative overflow-hidden">
              <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} /> Thông tin Nhận Việc
              </h4>
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Ngày bắt đầu làm việc</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">
                      {emailForm.startDate ? emailForm.startDate : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                    <DollarSign size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Mức lương đề xuất / Cấp bậc</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5 break-words">
                      {emailForm.salary || "Thỏa thuận"} • {emailForm.level || "Nhân viên"}
                    </p>
                  </div>
                </div>
                <div className="w-full h-px bg-slate-100"></div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <MapPin size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Địa điểm làm việc</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5 break-words">
                      {emailForm.workAddress || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5 text-slate-700 leading-relaxed">
        <p className="text-lg text-slate-800">Thân gửi <strong className="font-black text-rose-600">{candidateName}</strong>,</p>
        <p>Cảm ơn bạn đã quan tâm và ứng tuyển cơ hội nghề nghiệp tại <strong className="font-bold text-slate-900">JobAI</strong>.</p>
        <p>Chúng tôi rất ấn tượng với những kinh nghiệm của bạn. Tuy nhiên, sau quá trình sàng lọc và phỏng vấn, chúng tôi rất tiếc phải thông báo rằng bạn chưa hoàn toàn phù hợp với tiêu chí cốt lõi của vị trí này ở thời điểm hiện tại.</p>
        <div className="p-5 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl shadow-sm text-rose-900">
          <p className="font-bold mb-2 uppercase text-[11px] tracking-widest text-rose-500">Ghi chú từ Hội đồng Tuyển dụng:</p>
          <p className="text-sm italic">"{emailForm.rejectReason}"</p>
          {emailForm.customNote && <p className="text-sm mt-3 pt-3 border-t border-rose-100">{emailForm.customNote}</p>}
        </div>
        <p className="mt-4">Chúng tôi tin rằng với khả năng của mình, bạn sẽ sớm tìm được một môi trường phù hợp để phát triển sự nghiệp. Chúng tôi sẽ lưu giữ hồ sơ của bạn và liên hệ lại khi có cơ hội phù hợp trong tương lai.</p>
        <p>Chúc bạn nhiều sức khỏe và thành công!</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${showPreview ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600'}`}>
              {showPreview ? <Eye size={24} /> : <Mail size={24} />}
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">
                {showPreview ? "Xem trước Thư mời" : "Thiết lập Thông báo"}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Đến: <span className="text-blue-500">{candidateName}</span>
              </p>
            </div>
          </div>
          <button onClick={() => { closeEmailModal(); setShowPreview(false); }} className="p-2.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-full text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {!showPreview ? (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">1. Chọn loại thông báo</label>
                <div className="grid grid-cols-2 gap-4">
                  {emailModal.candidate?.localStatus !== 'interviewing' && (
                    <button
                      type="button"
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${emailForm.type === 'interview' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                      onClick={() => setEmailForm({ ...emailForm, type: 'interview' })}
                    >
                      {emailForm.type === 'interview' && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 size={18} /></div>}
                      <div className={`p-3 rounded-full ${emailForm.type === 'interview' ? 'bg-blue-100' : 'bg-slate-50'}`}>
                        <ThumbsUp size={28} />
                      </div>
                      <p className="font-black uppercase tracking-widest text-sm">Mời Phỏng Vấn</p>
                    </button>
                  )}
                  <button
                    type="button"
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${emailForm.type === 'reject' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                    onClick={() => setEmailForm({ ...emailForm, type: 'reject' })}
                  >
                    {emailForm.type === 'reject' && <div className="absolute top-3 right-3 text-rose-500"><CheckCircle2 size={18} /></div>}
                    <div className={`p-3 rounded-full ${emailForm.type === 'reject' ? 'bg-rose-100' : 'bg-slate-50'}`}>
                      <ThumbsDown size={28} />
                    </div>
                    <p className="font-black uppercase tracking-widest text-sm">Từ Chối</p>
                  </button>
                  {(emailModal.candidate?.localStatus === 'interviewing' || emailForm.type === 'offer') && (
                    <button
                      type="button"
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${emailForm.type === 'offer' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md scale-[1.02]' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                      onClick={() => setEmailForm({ ...emailForm, type: 'offer' })}
                    >
                      {emailForm.type === 'offer' && <div className="absolute top-3 right-3 text-emerald-500"><CheckCircle2 size={18} /></div>}
                      <div className={`p-3 rounded-full ${emailForm.type === 'offer' ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                        <Sparkles size={28} />
                      </div>
                      <p className="font-black uppercase tracking-widest text-sm text-center leading-tight">Offer<br />Trúng Tuyển</p>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">2. Chi tiết thông tin</h4>
                {emailForm.type === 'interview' ? (
                  <>
                    {/* BẢN TIN LỰA CHỌN CỦA ỨNG VIÊN */}
                    {emailModal.candidate?.interviewPreference ? (
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-wider">
                            <Info size={14} />
                            <span>Ứng viên mong muốn phỏng vấn: <span className="underline">{emailModal.candidate.interviewPreference === 'online' ? 'Online' : 'Trực tiếp (Offline)'}</span></span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-black text-blue-800 uppercase tracking-widest">Đề xuất</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="overridePreference"
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            checked={emailForm.interviewPreferenceOverride || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              let newLoc = emailForm.locationOrLink;
                              let newPref = emailForm.interviewPreference;
                              if (!checked) {
                                newPref = emailModal.candidate.interviewPreference;
                                newLoc = newPref === 'online'
                                  ? "https://meet.google.com/abc-xyz-123 (Google Meet)"
                                  : "Văn phòng JobAI - Tầng 5, Tòa nhà Innovation, Hà Nội";
                              }
                              setEmailForm({
                                ...emailForm,
                                interviewPreferenceOverride: checked,
                                interviewPreference: newPref,
                                locationOrLink: newLoc
                              });
                            }}
                          />
                          <label htmlFor="overridePreference" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                            Bỏ qua lựa chọn của ứng viên (Ghi đè hình thức của công ty)
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Info size={14} /> Ứng viên chưa chọn hình thức phỏng vấn mong muốn.
                      </div>
                    )}

                    {/* LỰA CHỌN THỦ CÔNG KHI CHƯA CÓ LỰA CHỌN HOẶC KHI GHI ĐÈ */}
                    {(!emailModal.candidate?.interviewPreference || emailForm.interviewPreferenceOverride) && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chọn hình thức phỏng vấn</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setEmailForm({ ...emailForm, interviewPreference: 'online', locationOrLink: "https://meet.google.com/abc-xyz-123 (Google Meet)" })}
                            className={`py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all ${emailForm.interviewPreference === 'online' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                          >
                            Online (Google Meet)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEmailForm({ ...emailForm, interviewPreference: 'offline', locationOrLink: "Văn phòng JobAI - Tầng 5, Tòa nhà Innovation, Hà Nội" })}
                            className={`py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all ${emailForm.interviewPreference === 'offline' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                          >
                            Trực tiếp (Offline)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TRƯỜNG DỮ LIỆU TƯƠNG ỨNG */}
                    {((emailModal.candidate?.interviewPreference === 'online' && !emailForm.interviewPreferenceOverride) || emailForm.interviewPreference === 'online') ? (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Link phòng họp trực tuyến (Google Meet/Zoom)</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                            <LinkIcon size={14} />
                          </div>
                          <input
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                            placeholder="Nhập link Google Meet / Zoom..."
                            value={emailForm.locationOrLink || ''}
                            onChange={(e) => setEmailForm({ ...emailForm, locationOrLink: e.target.value })}
                            disabled={emailModal.candidate?.interviewPreference === 'online' && !emailForm.interviewPreferenceOverride}
                          />
                        </div>
                        {emailModal.candidate?.interviewPreference === 'online' && !emailForm.interviewPreferenceOverride && (
                          <p className="text-[10px] text-amber-600 font-bold">🔒 Khóa tự động theo yêu cầu Online của ứng viên. Chọn "Bỏ qua lựa chọn" để thay đổi.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Địa điểm phỏng vấn trực tiếp</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                            <MapPin size={14} />
                          </div>
                          <input
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                            placeholder="Nhập địa chỉ văn phòng..."
                            value={emailForm.locationOrLink || ''}
                            onChange={(e) => setEmailForm({ ...emailForm, locationOrLink: e.target.value })}
                            disabled={emailModal.candidate?.interviewPreference === 'offline' && !emailForm.interviewPreferenceOverride}
                          />
                        </div>
                        {emailModal.candidate?.interviewPreference === 'offline' && !emailForm.interviewPreferenceOverride && (
                          <p className="text-[10px] text-amber-600 font-bold">🔒 Khóa tự động theo yêu cầu Trực tiếp của ứng viên. Chọn "Bỏ qua lựa chọn" để thay đổi.</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thời gian diễn ra</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                          <Calendar size={14} />
                        </div>
                        <input type="datetime-local" className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" value={emailForm.datetime || ''} onChange={(e) => setEmailForm({ ...emailForm, datetime: e.target.value })} />
                      </div>
                    </div>
                  </>
                ) : emailForm.type === 'offer' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày nhận việc</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Calendar size={14} /></div>
                          <input type="date" className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" value={emailForm.startDate || ''} onChange={(e) => setEmailForm({ ...emailForm, startDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mức lương đề xuất</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><DollarSign size={14} /></div>
                          <input className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" placeholder="VD: 15,000,000 VNĐ" value={emailForm.salary || ''} onChange={(e) => setEmailForm({ ...emailForm, salary: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Vị trí / Cấp bậc</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><Briefcase size={14} /></div>
                        <input className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" placeholder="VD: Senior Frontend Developer" value={emailForm.level || ''} onChange={(e) => setEmailForm({ ...emailForm, level: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Địa điểm làm việc</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><MapPin size={14} /></div>
                        <input className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-700" placeholder="Nhập địa chỉ công ty để hiển thị bản đồ..." value={emailForm.workAddress || ''} onChange={(e) => setEmailForm({ ...emailForm, workAddress: e.target.value })} />
                      </div>
                      {emailForm.workAddress && (
                        <div className="mt-3 rounded-2xl overflow-hidden border-2 border-slate-100 h-48 w-full shadow-inner relative">
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 -z-10 animate-pulse"><MapPin size={32} /></div>
                          <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps?q=${encodeURIComponent(emailForm.workAddress)}&output=embed`}></iframe>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lý do từ chối (Mẫu)</label>
                      <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-rose-500 font-bold text-slate-700" value={emailForm.rejectReason || ''} onChange={(e) => setEmailForm({ ...emailForm, rejectReason: e.target.value })}>
                        <option value="Kinh nghiệm chuyên môn chưa đáp ứng đủ yêu cầu của vị trí này.">Chưa đủ kinh nghiệm chuyên môn</option>
                        <option value="Công ty đã tìm được ứng viên khác phù hợp hơn cho vị trí hiện tại.">Đã tuyển đủ số lượng / Có ứng viên khác</option>
                        <option value="Mức lương kỳ vọng chưa phù hợp với ngân sách dự kiến của công ty.">Ngân sách chưa phù hợp</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhận xét thêm / Trích xuất từ AI (Tùy chọn)</label>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const aiData = JSON.parse(emailModal.candidate?.aiSummary || '{}');
                              const aiFeedback = aiData.evidence?.map(e => e.detail).join(' ') || "Chưa có nhận xét AI cụ thể.";
                              setEmailForm({ ...emailForm, customNote: "Nhận xét AI: " + aiFeedback });
                            } catch (e) {
                              setEmailForm({ ...emailForm, customNote: "Hệ thống AI chưa phân tích xong CV này." });
                            }
                          }}
                          className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors font-bold"
                        >
                          Fill AI Summary
                        </button>
                      </div>
                      <textarea
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-rose-500 font-medium text-slate-700 resize-none min-h-[100px]"
                        placeholder="Nhập thêm nhận xét chi tiết, hoặc dùng nút Fill AI Summary để tự động điền đánh giá từ AI vào đây..."
                        value={emailForm.customNote || ''}
                        onChange={(e) => setEmailForm({ ...emailForm, customNote: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Tuyển dụng JobAI</h4>
                      <p className="text-[11px] text-slate-500 font-medium">hr@jobai.vn • Tới: {candidateName}</p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 bg-slate-200/50 rounded-lg">
                    {emailForm.type === 'interview' ? 'Thư Mời' : emailForm.type === 'offer' ? 'Offer Letter' : 'Thư Cảm Ơn'}
                  </div>
                </div>
                <div className="p-10 bg-white">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Layout size={16} /></div>
                    <span className="text-blue-600 font-black text-2xl tracking-tighter uppercase">JobAI.</span>
                  </div>
                  {renderEmailPreview()}
                  <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Trân trọng,</p>
                      <p className="font-black text-slate-800 text-lg">Ban Tuyển Dụng JobAI</p>
                      <p className="text-sm text-blue-600 font-bold mt-0.5">https://jobai.vn</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
          {!showPreview ? (
            <>
              <button onClick={() => { closeEmailModal(); setShowPreview(false); }} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
                Hủy bỏ
              </button>
              <button onClick={() => setShowPreview(true)} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Eye size={18} /> XEM TRƯỚC BẢN NHÁP
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowPreview(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all flex items-center gap-2">
                <Edit3 size={18} /> QUAY LẠI CHỈNH SỬA
              </button>
              <button onClick={handleSendEmailSubmit} className={`px-8 py-3 text-white font-black rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 ${emailForm.type === 'interview' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}>
                <Mail size={18} /> GỬI EMAIL NGAY
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. OFFER MODAL
// ==========================================
export const OfferModal = ({ isOpen, onClose, candidate, offerForm, setOfferForm, handleAiSuggestSalary, loadingAi, handleSubmitOffer, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <h3 className="text-xl font-bold">Tạo Offer Tuyển Dụng</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">Ứng viên: <strong className="text-white text-lg">{candidate?.fullName}</strong></p>
            {candidate?.expectedSalary && (
              <div className="mt-1 text-xs bg-white/20 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-bold">
                <DollarSign size={12} /> Đề xuất: {new Intl.NumberFormat('vi-VN').format(candidate.expectedSalary)} VNĐ ({candidate.salaryType || 'Gross'})
              </div>
            )}
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white hover:rotate-90 transition-all bg-white/10 p-1.5 rounded-full"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmitOffer} className="p-6 space-y-5 bg-slate-50">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><Briefcase size={16} className="text-blue-500" /> Phòng ban nhận việc</label>
            <input type="text" required value={offerForm.department} onChange={e => setOfferForm({ ...offerForm, department: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm" placeholder="VD: Phòng IT, Kế toán..." />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><MapPin size={16} className="text-emerald-500" /> Địa điểm làm việc</label>
            <input type="text" required value={offerForm.workAddress} onChange={e => setOfferForm({ ...offerForm, workAddress: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow shadow-sm" placeholder="Tòa nhà A, Quận 1..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><Calendar size={16} className="text-orange-500" /> Ngày đi làm</label>
              <input type="date" required value={offerForm.startDate} onChange={e => setOfferForm({ ...offerForm, startDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-shadow shadow-sm" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><DollarSign size={16} className="text-violet-500" /> Mức lương chốt</label>
                {candidate?.expectedSalary && (
                  <button
                    type="button"
                    onClick={() => {
                      const formatted = new Intl.NumberFormat('vi-VN').format(candidate.expectedSalary) + " VNĐ (" + (candidate.salaryType || 'Gross') + ")";
                      setOfferForm({ ...offerForm, salary: formatted });
                    }}
                    className="text-[10px] font-black text-emerald-600 hover:underline"
                  >
                    Dùng mức đề xuất
                  </button>
                )}
              </div>
              <div className="relative group">
                <input type="text" required value={offerForm.salary} onChange={e => setOfferForm({ ...offerForm, salary: e.target.value })} className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-shadow shadow-sm font-bold text-violet-700 bg-white" placeholder="VD: 15,000,000 VNĐ" />

                <button type="button" onClick={handleAiSuggestSalary} disabled={loadingAi} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-violet-100 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow-sm hover:shadow-md" title="AI Đề xuất lương dựa trên JD và CV">
                  {loadingAi ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-70 mt-4 active:scale-95">
            {isSubmitting ? 'Đang xử lý...' : <><Mail size={18} /> Xác nhận & Gửi Offer</>}
          </button>
        </form>
      </div>
    </div>
  );
};