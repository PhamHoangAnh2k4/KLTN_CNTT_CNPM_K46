import re

with open("d:/DA_KHOALUAN/frontend/src/pages/employer/CandidateModals.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states for criteria matrix and pdf modal
state_additions = """
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [criteriaMatrix, setCriteriaMatrix] = useState(null);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
"""
content = re.sub(r"(const \[loadingText, setLoadingText\] = useState\(false\);)", r"\1\n" + state_additions, content)

# 2. Add effect to load criteria matrix
effect_additions = """
      if (candidate.criteriaMatrix) {
        try { setCriteriaMatrix(JSON.parse(candidate.criteriaMatrix)); } catch(e) { setCriteriaMatrix(null); }
      } else {
        setCriteriaMatrix(null);
      }
"""
content = re.sub(r"(if \(candidate.interviewFeedback\) \{.*?\} else \{.*?\})", r"\1\n" + effect_additions, content, flags=re.DOTALL)

# 3. Add handleGenerateCriteria
func_additions = """
  const handleGenerateCriteria = async () => {
    setLoadingCriteria(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/employer-ai/generate-criteria`, {
        jobId: parseInt(jobIdParam),
        userId: candidate.id
      });
      setCriteriaMatrix(res.data);
    } catch (error) {
      alert("Lỗi khi tạo Bảng tiêu chí!");
    } finally {
      setLoadingCriteria(false);
    }
  };
"""
content = re.sub(r"(const handleTextAnalyze = async \(\) => \{.*?\n  \};\n)", r"\1\n" + func_additions, content, flags=re.DOTALL)

# 4. Remove pdf and audio buttons from the tab header
content = re.sub(r"<button\s+onClick=\{\(\) => setViewMode\('pdf'\)\}.*?</button>", "", content, flags=re.DOTALL)
content = re.sub(r"<button\s+onClick=\{\(\) => setViewMode\('audio'\)\}.*?</button>", "", content, flags=re.DOTALL)

# 5. Add "Xem CV Gốc" button in Summary tab
xem_cv_goc_btn = """
                  <button onClick={() => setShowPdfModal(true)} className="flex flex-col items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border border-slate-200 transition-all font-bold text-xs gap-1">
                    <FileText size={20} className="text-slate-500" /> Xem CV Gốc
                  </button>
"""
content = re.sub(r"(<div className=\"flex gap-4\">)", r"\1\n" + xem_cv_goc_btn, content)

# 6. Add Criteria Matrix UI in Summary Tab
criteria_matrix_ui = """
              {/* CRITERIA MATRIX */}
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Award size={18} className="text-violet-500"/> Bảng Tiêu Chí Đánh Giá (Criteria Matrix)
                  </h4>
                  {!criteriaMatrix && !loadingCriteria && (
                    <button onClick={handleGenerateCriteria} className="px-4 py-2 bg-violet-100 text-violet-700 font-bold rounded-xl text-xs hover:bg-violet-200 flex items-center gap-2 transition-all">
                      <Sparkles size={14}/> Khởi tạo đánh giá
                    </button>
                  )}
                </div>
                {loadingCriteria && (
                  <div className="py-8 flex flex-col items-center justify-center bg-violet-50 rounded-3xl border border-violet-100">
                    <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-bold text-violet-600">Đang phân tích bảng tiêu chí dựa trên JD...</p>
                  </div>
                )}
                {criteriaMatrix && (
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/3">Tiêu chí</th>
                            <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/6 text-center">Trọng số</th>
                            <th className="p-4 font-black text-slate-600 border-b border-slate-200 w-1/6 text-center">Điểm số</th>
                            <th className="p-4 font-black text-slate-600 border-b border-slate-200">Nhận xét</th>
                          </tr>
                        </thead>
                        <tbody>
                          {criteriaMatrix.criteria && criteriaMatrix.criteria.map((c, i) => (
                            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-700">{c.name}</td>
                              <td className="p-4 text-center font-medium text-slate-500">{c.weight}%</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black ${c.score >= 8 ? "bg-emerald-100 text-emerald-700" : c.score >= 5 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                  {c.score}/10
                                </span>
                              </td>
                              <td className="p-4 text-xs font-medium text-slate-600">{c.comment}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan="2" className="p-4 text-right font-black text-slate-700">TỔNG ĐIỂM BÌNH QUÂN GIA QUYỀN:</td>
                            <td className="p-4 text-center">
                              <span className="text-lg font-black text-blue-600">{criteriaMatrix.overallScore}/10</span>
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
"""
content = re.sub(r"(<div className=\"grid grid-cols-1 md:grid-cols-3 gap-10\">)", r"<>\n" + criteria_matrix_ui + r"\n              \1", content)
content = re.sub(r"(</div>\s*)\) : \(\s*<div className=\"py-20", r"\1</>\n              ) : (\n                <div className=\"py-20", content)

# 7. Add PDF Modal to the return JSX of CvModal
pdf_modal_jsx = """
        {showPdfModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl flex flex-col w-full max-w-6xl h-[95vh] animate-in zoom-in-95">
              <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-50 rounded-t-[2rem]">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18}/> CV Gốc: {candidateName}</h3>
                <button onClick={() => setShowPdfModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 bg-slate-100 p-4 relative">
                {candidate.cvUrl ? (
                  <iframe src={candidate.cvUrl} className="w-full h-full border-none rounded-xl" title="Original CV"/>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <AlertCircle size={48} className="mb-4"/>
                    <p>Chưa có file CV gốc</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
"""
content = re.sub(r"(\{\/\* Footer \*\/\})", pdf_modal_jsx + r"\n        \1", content)

# 8. Remove the old PDF and Audio blocks completely!
# PDF block:
pdf_tab_regex = r"\{\/\* TAB XEM PDF \*\/\}\s*\{viewMode === \'pdf\' && \([\s\S]*?\{\/\* TAB ĐỀ XUẤT OFFER \*\/\}"
content = re.sub(pdf_tab_regex, r"{/* TAB ĐỀ XUẤT OFFER */}", content)

# Audio block:
audio_tab_regex = r"\{\/\* TAB GHI ÂM PHỎNG VẤN \*\/\}\s*\{viewMode === \'audio\' && \([\s\S]*?(?=\{\/\* Footer \*\/\})"
content = re.sub(audio_tab_regex, "", content)

# Clean up any leftover audio state variables we don't need
content = re.sub(r"  const \[audioFile, setAudioFile\].*?\n", "", content)
content = re.sub(r"  const \[audioResult, setAudioResult\].*?\n", "", content)
content = re.sub(r"  const \[loadingAudio, setLoadingAudio\].*?\n", "", content)
content = re.sub(r"  const \[interviewInputMode, setInterviewInputMode\].*?\n", "", content)
content = re.sub(r"  const \[interviewNotes, setInterviewNotes\].*?\n", "", content)
content = re.sub(r"  const \[loadingText, setLoadingText\].*?\n", "", content)
# Wait, I shouldn't remove loadingText because I used it above in state_additions replacing it.
# Let's restore the original backup, then apply this script to make sure it's fully clean.

with open("d:/DA_KHOALUAN/frontend/src/pages/employer/CandidateModals.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
