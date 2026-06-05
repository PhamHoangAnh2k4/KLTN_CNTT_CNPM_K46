import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// MỚI: Thêm icon Loader2 cho hiệu ứng tải trang
import { Search, Eye, Ban, CheckCircle2, X, Users, Clock, Activity, Mail, Phone, Shield, Unlock, Calendar, FileText, Bell, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

const UserTab = ({ users, setUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Lấy adminId của admin hiện tại
  const getAdminId = () => {
    const acc = JSON.parse(sessionStorage.getItem('userAccount') || localStorage.getItem('lastLogin_userAccount') || '{}');
    return acc?.userId ? String(acc.userId) : null;
  };

  // Helper chuyển đổi URL tài liệu sạch sẽ, xử lý backslash và dấu gạch chéo đầu
  const getDocumentUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let cleanPath = url.replace(/\\/g, '/');
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    return `http://localhost:8081${cleanPath}`;
  };

  // Helper kiểm tra xem tệp đính kèm có phải là hình ảnh không
  const isImageFile = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');
  };

  // ==========================================
  // STATE MỚI LƯU LỊCH SỬ HOẠT ĐỘNG
  // ==========================================
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Hàm xử lý khi ảnh đại diện bị lỗi
  const handleImageError = (e, name) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;
  };

  // Lọc người dùng an toàn
  const filteredUsers = users.filter(user => {
    const nameStr = user.name || '';
    const emailStr = user.email || '';
    const idStr = String(user.id || '');

    return nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Cập nhật trạng thái khóa/mở khóa
  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await axios.put(`http://localhost:8081/api/admin/users/${userId}/status`, {
        status: newStatus,
        adminId: getAdminId()
      });

      const updatedUsers = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
      setUsers(updatedUsers);

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
        fetchActivities(userId);
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Không thể cập nhật trạng thái người dùng!");
    }
  };

  // API Xử lý Duyệt GPKD
  const handleVerifyLicense = async (userId, status) => {
    try {
      await axios.put(`http://localhost:8081/api/admin/users/${userId}/verify-license`, {
        status,
        adminId: getAdminId()
      });
      const updatedUsers = users.map(u => u.id === userId ? { ...u, verificationStatus: status } : u);
      setUsers(updatedUsers);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, verificationStatus: status });
        fetchActivities(userId);
      }
      alert(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} GPKD thành công!`);
    } catch (error) {
      console.error("Lỗi cập nhật GPKD:", error);
      alert("Lỗi khi cập nhật trạng thái GPKD!");
    }
  };

  // API Gửi nhắc nhở cập nhật GPKD
  const handleRemindLicense = async (userId) => {
    try {
      const res = await axios.post(`http://localhost:8081/api/admin/users/${userId}/remind-license`);
      alert(res.data.message);
      fetchActivities(userId); // Refresh lại lịch sử
    } catch (error) {
      console.error("Lỗi gửi nhắc nhở:", error);
      alert("Lỗi khi gửi nhắc nhở!");
    }
  };

  // ==========================================
  // HÀM LẤY LỊCH SỬ HOẠT ĐỘNG
  // ==========================================
  const fetchActivities = async (userId) => {
    setLoadingActivities(true);
    try {
      const response = await axios.get(`http://localhost:8081/api/admin/users/${userId}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử hoạt động:", error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Tự động lấy lịch sử khi click xem 1 user
  useEffect(() => {
    if (selectedUser && selectedUser.id) {
      fetchActivities(selectedUser.id);
    }
  }, [selectedUser?.id]); // Chỉ chạy lại nếu mở user có ID khác

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col h-full">

      {/* Header & Search */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-blue-500" size={28} /> Quản lý Người dùng
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý tài khoản ứng viên và nhà tuyển dụng</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên, ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Hồ sơ người dùng</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Vai trò</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Thông tin liên hệ</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="p-5 font-black text-xs text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center opacity-60">
                      <Search size={48} className="text-slate-300 mb-4" />
                      <p className="text-slate-600 font-bold text-lg">Không tìm thấy người dùng</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/80 group transition-colors"
                  >
                    <td className="p-5 flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:8081${user.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          onError={(e) => handleImageError(e, user.name)}
                          className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200 bg-slate-100"
                          alt="Avatar"
                        />
                        {user.status === 'Bị khóa' && (
                          <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full border-2 border-white">
                            <Ban size={10} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-base transition-colors ${user.status === 'Bị khóa' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 group-hover:text-blue-600'}`}>{user.name}</p>
                        <p className="text-xs font-black text-slate-400 tracking-wider mt-0.5">ID: {user.id}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${user.role === 'Nhà tuyển dụng'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Mail size={14} className="text-slate-400" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                          <Phone size={14} className="text-slate-400" /> {user.phone || "Chưa cập nhật"}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${user.status === 'Hoạt động' || !user.status
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                        {user.status === 'Bị khóa' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        {user.status || 'Hoạt động'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-2 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Eye size={16} /> Xem
                        </button>
                        {user.status === 'Bị khóa' ? (
                          <button
                            onClick={() => handleUpdateUserStatus(user.id, 'Hoạt động')}
                            className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Unlock size={16} /> Mở khóa
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUserStatus(user.id, 'Bị khóa')}
                            className="px-3 py-2 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Ban size={16} /> Khóa
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modal Profile */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20"></div>

              <div className="px-8 py-5 flex items-center justify-between bg-transparent relative z-10 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-slate-100">
                  <Shield className="text-slate-700" size={16} />
                  <span className="text-sm font-black text-slate-800">Hồ sơ chi tiết</span>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/80 rounded-full text-slate-500 hover:text-rose-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 pb-8 overflow-y-auto flex-1 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-10 -mt-4">
                  <div className="relative">
                    <img
                      src={selectedUser.avatar ? (selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `http://localhost:8081${selectedUser.avatar}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random`}
                      onError={(e) => handleImageError(e, selectedUser.name)}
                      alt="Avatar"
                      className="w-32 h-32 rounded-[2rem] object-cover shadow-xl border-4 border-white bg-white"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-3xl font-black text-slate-900">{selectedUser.name}</h4>
                    <p className="text-slate-500 font-bold">{selectedUser.role}</p>
                  </div>
                </div>

                {/* ======================================================= */}
                {/* HIỂN THỊ KHU VỰC XÁC THỰC GPKD CHỈ DÀNH CHO NTD */}
                {/* ======================================================= */}
                {selectedUser.role === 'Nhà tuyển dụng' && (
                  <div className="mb-8 border-b border-slate-100 pb-8">
                    <h5 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <FileText className="text-indigo-600" size={20} /> Giấy phép Kinh doanh (GPKD)
                    </h5>
                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between gap-4">
                      {selectedUser.businessLicenseUrl ? (
                        <>
                          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
                            <div>
                              <p className="font-bold text-slate-800">Tệp tài liệu đính kèm</p>
                              <a
                                href={getDocumentUrl(selectedUser.businessLicenseUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                              >
                                <Eye size={14} /> Nhấn để xem tài liệu ở tab mới
                              </a>
                            </div>
                            {selectedUser.verificationStatus === 'APPROVED' ? (
                              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-xl flex items-center gap-2 border border-emerald-200">
                                <CheckCircle2 size={18} /> Đã Xác Thực
                              </span>
                            ) : (
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleVerifyLicense(selectedUser.id, 'APPROVED')}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                                >
                                  <Check size={18} className="inline mr-1" /> Duyệt
                                </button>
                                <button
                                  onClick={() => handleVerifyLicense(selectedUser.id, 'REJECTED')}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-600 font-black rounded-xl hover:bg-rose-50"
                                >
                                  <Ban size={18} className="inline mr-1" /> Từ chối
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Xem trước tài liệu GPKD trực tiếp nếu là ảnh */}
                          {isImageFile(selectedUser.businessLicenseUrl) ? (
                            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-white max-w-md">
                              <p className="text-[11px] font-bold text-slate-400 px-3 py-1.5 bg-slate-50 border-b border-slate-100">Bản xem trước ảnh GPKD:</p>
                              <img
                                src={getDocumentUrl(selectedUser.businessLicenseUrl)}
                                alt="GPKD Preview"
                                className="w-full h-auto max-h-[250px] object-contain hover:scale-[1.02] transition-transform duration-300 cursor-pointer p-2"
                                onClick={() => window.open(getDocumentUrl(selectedUser.businessLicenseUrl), '_blank')}
                              />
                            </div>
                          ) : (
                            <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 max-w-md">
                              <FileText className="text-red-500 shrink-0" size={24} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 truncate">Giấy phép kinh doanh (PDF)</p>
                                <p className="text-xs text-slate-400 font-medium">Bấm vào liên kết ở trên để mở file PDF trong tab mới</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full text-center py-4">
                          <p className="text-slate-500 font-medium mb-4">Nhà tuyển dụng chưa cập nhật Giấy phép kinh doanh.</p>
                          <button
                            onClick={() => handleRemindLicense(selectedUser.id)}
                            className="px-6 py-3 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 mx-auto"
                          >
                            <Bell size={18} /> Gửi thông báo nhắc nhở
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <h5 className="font-black text-slate-800 text-lg border-b border-slate-100 pb-2">Liên hệ</h5>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={18} /></div>
                        <div><p className="text-xs font-bold text-slate-400">Email</p><p className="text-sm font-bold text-slate-700 break-all">{selectedUser.email}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Phone size={18} /></div>
                        <div><p className="text-xs font-bold text-slate-400">Số điện thoại</p><p className="text-sm font-bold text-slate-700">{selectedUser.phone || "N/A"}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* MỚI: KHU VỰC HIỂN THỊ TIMELINE LỊCH SỬ HOẠT ĐỘNG */}
                  {/* ======================================================= */}
                  <div className="lg:col-span-2">
                    <h5 className="font-black text-slate-800 text-lg border-b border-slate-100 pb-2 mb-4">Hoạt động</h5>

                    {loadingActivities ? (
                      <div className="flex flex-col justify-center items-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                        <span className="text-slate-500 font-medium">Đang tải lịch sử...</span>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Activity className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 font-medium text-sm">Người dùng này chưa có hoạt động nào.</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 max-h-[350px] overflow-y-auto">
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                          {activities.map((log) => (
                            <div key={log.id} className="relative pl-6">
                              {/* Chấm tròn trên dòng thời gian */}
                              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>

                              {/* Thẻ nội dung */}
                              <div className="bg-white hover:bg-slate-50 transition-colors rounded-xl p-4 border border-slate-100 shadow-sm">
                                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                  <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                                    {log.actionType}
                                  </span>
                                  <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">
                                  {log.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* ======================================================= */}

                </div>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
                {selectedUser.status === 'Bị khóa' ? (
                  <button
                    onClick={() => handleUpdateUserStatus(selectedUser.id, 'Hoạt động')}
                    className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <Unlock size={18} /> Mở khóa tài khoản
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateUserStatus(selectedUser.id, 'Bị khóa')}
                    className="px-6 py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2"
                  >
                    <Ban size={18} /> Khóa tài khoản
                  </button>
                )}
                <button onClick={() => setSelectedUser(null)} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl">Đóng</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserTab;