import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  UploadCloud, FileText, Image as ImageIcon,
  Trash2, Eye, Sparkles, Loader2, FileWarning
} from 'lucide-react';

const CVLibrary = () => {
  const [cvList, setCvList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = "http://localhost:8081";

  // Lấy userId từ localStorage
  const userAccount = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount')) || {};
  const userId = userAccount.userId || 1;

  // 1. GỌI API LẤY DANH SÁCH CV
  const fetchCVs = async () => {
    setIsLoading(true);
    try {
      // Yêu cầu BE viết API GET: /api/candidate-cvs/{userId}
      const response = await axios.get(`${API_BASE_URL}/api/candidate-cvs/${userId}`);
      setCvList(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách CV:", error);
      // Dữ liệu mẫu (Mock data) để bạn xem UI khi BE chưa làm xong
      setCvList([
        { id: 1, originalName: "CV_Frontend_Dev.pdf", cvFile: "/uploads/cv1.pdf", fileType: "application/pdf", uploadedAt: "2026-04-28" },
        { id: 2, originalName: "Chung_chi_Design.png", cvFile: "/uploads/cv2.png", fileType: "image/png", uploadedAt: "2026-04-27" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, [userId]);

  // Hàm xử lý URL file
  const getFullUrl = (path) => {
    if (!path) return null;
    return path.startsWith('/') ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
  };

  // 2. XỬ LÝ CHỌN FILE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert("Chỉ hỗ trợ file PDF hoặc Hình ảnh (JPG, PNG)!");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB
        alert("Dung lượng file tối đa là 5MB!");
        return;
      }
      setSelectedFile(file);
    }
  };

  // 3. UPLOAD FILE LÊN SERVER
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    // Có thể truyền thêm userId nếu BE yêu cầu form-data, hoặc truyền qua URL

    try {
      // Yêu cầu BE viết API POST: /api/candidate-cvs/{userId}/upload
      await axios.post(`${API_BASE_URL}/api/candidate-cvs/${userId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("Tải lên CV thành công!");
      setSelectedFile(null);
      // Reset input file
      document.getElementById('cv-upload-input').value = "";
      fetchCVs(); // Gọi lại danh sách mới
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Lỗi khi tải CV lên server!");
    } finally {
      setIsUploading(false);
    }
  };

  // 4. XÓA CV
  const handleDelete = async (cvId, fileName) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa "${fileName}"?`);
    if (!isConfirm) return;

    try {
      // Yêu cầu BE viết API DELETE: /api/candidate-cvs/{cvId}
      await axios.delete(`${API_BASE_URL}/api/candidate-cvs/${cvId}`);
      setCvList(cvList.filter(cv => cv.id !== cvId));
      alert("Đã xóa CV!");
    } catch (error) {
      console.error("Lỗi xóa CV:", error);
      alert("Lỗi khi xóa CV!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[80vh]">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Quản lý kho CV</h2>

      {/* KHU VỰC UPLOAD */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-8 hover:border-blue-400 transition-colors">
        <UploadCloud size={40} className="mx-auto text-blue-500 mb-3" />
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Tải lên CV mới</h3>
        <p className="text-xs text-slate-500 mb-4">Hỗ trợ định dạng PDF, JPG, PNG (Tối đa 5MB)</p>

        <div className="flex flex-col items-center gap-3">
          <input
            type="file"
            id="cv-upload-input"
            accept=".pdf, .jpg, .jpeg, .png"
            onChange={handleFileChange}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              {isUploading ? "Đang tải lên..." : "Xác nhận tải lên"}
            </button>
          )}
        </div>
      </div>

      {/* DANH SÁCH CV */}
      <h3 className="text-lg font-bold text-slate-800 mb-4">Danh sách CV của bạn ({cvList.length})</h3>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : cvList.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
          <FileWarning size={48} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">Bạn chưa tải lên CV nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cvList.map((cv) => {
            const isPDF = cv.fileType?.includes('pdf') || cv.originalName?.toLowerCase().endsWith('.pdf');

            return (
              <motion.div
                key={cv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow group"
              >
                {/* Icon File */}
                <div className={`p-3 rounded-lg flex-shrink-0 ${isPDF ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                  {isPDF ? <FileText size={24} /> : <ImageIcon size={24} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate" title={cv.originalName}>
                    {cv.originalName || "Thong_tin_CV"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ngày tải lên: {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <a
                      href={getFullUrl(cv.cvFile)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded hover:bg-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <Eye size={14} /> Xem
                    </a>

                    <button
                      onClick={() => alert("Tính năng này sẽ được code sau!")}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles size={14} /> Quét AI
                    </button>

                    <button
                      onClick={() => handleDelete(cv.id, cv.originalName)}
                      className="px-3 py-1.5 text-red-500 text-xs font-semibold rounded hover:bg-red-50 flex items-center gap-1 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CVLibrary;