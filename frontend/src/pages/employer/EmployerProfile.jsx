import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Building, MapPin, Globe, FileText, ShieldAlert,
  CheckCircle, Save, Image as ImageIcon, UploadCloud,
  File as FileIcon, X, Users, ChevronDown, Loader2, ArrowLeft
} from 'lucide-react';

const EmployerProfile = () => {
  const navigate = useNavigate();

  // 1. LẤY THÔNG TIN ACCOUNT TỪ STORAGE
  const getSessionUser = () => {
    const sessionUser = sessionStorage.getItem('userAccount');
    if (sessionUser) return JSON.parse(sessionUser);
    return JSON.parse(localStorage.getItem('lastLogin_userAccount') || '{}');
  };

  const userAccount = getSessionUser();
  const userId = userAccount.userId;
  const userRole = userAccount.role || userAccount.userRole;

  const logoInputRef = useRef(null);
  const licenseInputRef = useRef(null);

  // 2. STATE QUẢN LÝ DỮ LIỆU
  const [formData, setFormData] = useState({
    companyName: '',
    taxCode: '',
    address: '',
    website: '',
    companySize: '10 - 50 nhân viên',
    description: ''
  });

  const [isVerified, setIsVerified] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [businessLicense, setBusinessLicense] = useState(null);
  const [existingLicenseUrl, setExistingLicenseUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // 3. HIỆU ỨNG TỰ ĐỘNG CẬP NHẬT THEO USER ID (AUTO-SWITCH DATA)
  useEffect(() => {
    // Nếu không có userId (chưa đăng nhập), dừng tải
    if (!userId || userRole !== 'ntd') {
      setIsFetching(false);
      return;
    }

    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        const response = await axios.get(`http://localhost:8081/api/employer-profiles/${userId}`);

        if (response.data) {
          const data = response.data;
          setFormData({
            companyName: data.companyName || '',
            taxCode: data.taxCode || '',
            address: data.address || '',
            website: data.website || '',
            companySize: data.companySize || '10 - 50 nhân viên',
            description: data.description || ''
          });

          setIsVerified(data.verificationStatus === 'APPROVED' || data.verificationStatus === 'VERIFIED');

          // ĐÃ SỬA: Map đúng URL API serve ảnh từ Backend
          if (data.companyLogo) {
            const fileName = data.companyLogo.split('/').pop();
            setLogoPreview(`http://localhost:8081/api/employer-profiles/images/${fileName}`);
          } else {
            setLogoPreview(null);
          }

          // ĐÃ SỬA: Map đúng URL API serve file giấy phép từ Backend
          if (data.businessLicenseFile) {
            const fileName = data.businessLicenseFile.split('/').pop() || 'Giay_phep_kinh_doanh.pdf';
            setExistingLicenseUrl(`http://localhost:8081/api/employer-profiles/images/${fileName}`);
            setBusinessLicense({ name: fileName, isFromServer: true });
          } else {
            setBusinessLicense(null);
            setExistingLicenseUrl(null);
          }
        } else {
          // TRƯỜNG HỢP: ID hợp lệ nhưng chưa bao giờ tạo Profile (NTD mới)
          resetForm();
        }
      } catch (error) {
        // User chua co ho so hoac loi ket noi, reset form rong
        resetForm();
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [userId, userRole]); // QUAN TRỌNG: Tự động chạy lại khi đổi ID tài khoản

  const resetForm = () => {
    setFormData({
      companyName: '', taxCode: '', address: '',
      website: '', companySize: '10 - 50 nhân viên', description: ''
    });
    setLogoPreview(null);
    setLogoFile(null);
    setBusinessLicense(null);
    setExistingLicenseUrl(null);
    setIsVerified(false);
  };

  // 4. XỬ LÝ SỰ KIỆN FORM
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
    e.target.value = null;
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleLicenseChange = (e) => {
    const file = e.target.files[0];
    if (file) setBusinessLicense(file);
    e.target.value = null;
  };

  const handleRemoveLicense = (e) => {
    e.stopPropagation();
    setBusinessLicense(null);
    setExistingLicenseUrl(null);
  };

  // 5. GỬI DỮ LIỆU (LUÔN GỬI THEO ID HIỆN TẠI)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    if (logoFile) submitData.append('logoFile', logoFile);
    if (businessLicense instanceof File) submitData.append('licenseFile', businessLicense);

    try {
      await axios.post(`http://localhost:8081/api/employer-profiles/${userId}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Cập nhật thành công hồ sơ của ID: ' + userId);

      // Đồng bộ tên mới vào Storage và kích hoạt cập nhật Navbar
      const acc = JSON.parse(localStorage.getItem('userAccount') || sessionStorage.getItem('userAccount') || '{}');
      if (acc.userId) {
        acc.fullName = formData.companyName;
        if (localStorage.getItem('userAccount')) localStorage.setItem('userAccount', JSON.stringify(acc));
        if (sessionStorage.getItem('userAccount')) sessionStorage.setItem('userAccount', JSON.stringify(acc));

        if (localStorage.getItem('userName')) localStorage.setItem('userName', formData.companyName);
        if (sessionStorage.getItem('userName')) sessionStorage.setItem('userName', formData.companyName);
      }

      window.dispatchEvent(new Event('authChange'));

      if (userRole === 'ntd') navigate('/employer');
    } catch (error) {
      alert('Gửi thông tin thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="font-bold text-slate-500 animate-pulse text-xs tracking-widest">ĐANG ĐỒNG BỘ DỮ LIỆU ID {userId}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="max-w-4xl mx-auto px-4">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={18} /> QUAY LẠI
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          <div className="px-8 py-10 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ Nhà tuyển dụng</h2>
              <p className="text-slate-400 font-medium text-sm">Quản lý định danh cho tài khoản #{userId}</p>
            </div>
            {isVerified ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100 font-black text-xs uppercase">
                <CheckCircle size={18} /> Đã xác thực
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-5 py-2.5 rounded-2xl border border-slate-200 font-black text-xs uppercase">
                <Loader2 size={18} className="animate-spin" /> Chờ duyệt
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">

            {/* LOGO SECTION */}
            <div className="flex flex-col md:flex-row items-center gap-10 p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100">
              <div
                onClick={() => logoInputRef.current.click()}
                className="relative h-40 w-40 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 transition-all overflow-hidden group/logo"
              >
                {logoPreview ? (
                  <div className="relative w-full h-full p-4">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all">
                      <button type="button" onClick={handleRemoveLogo} className="p-3 bg-white text-rose-500 rounded-2xl shadow-xl"><X size={24} strokeWidth={3} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Tải Logo</p>
                  </div>
                )}
                <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-black text-slate-800 text-xl">Hình ảnh thương hiệu</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">Định dạng hỗ trợ: PNG, JPG (Dưới 2MB). Logo chuẩn giúp tin tuyển dụng chuyên nghiệp hơn.</p>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên pháp lý công ty</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:bg-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã số thuế</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quy mô công ty</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <select name="companySize" value={formData.companySize} onChange={handleChange} className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer">
                    <option>Dưới 10 nhân viên</option>
                    <option>10 - 50 nhân viên</option>
                    <option>50 - 150 nhân viên</option>
                    <option>150 - 500 nhân viên</option>
                    <option>Trên 500 nhân viên</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ trụ sở</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Website chính thức</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới thiệu tổng quan</label>
                <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-slate-800 font-medium focus:bg-white focus:border-blue-500 outline-none transition-all resize-none leading-relaxed" placeholder="Chia sẻ về văn hóa và môi trường làm việc..."></textarea>
              </div>
            </div>

            {/* LICENSE UPLOAD */}
            <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 space-y-6">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-indigo-600" />
                <h3 className="font-black text-indigo-900 uppercase tracking-widest text-xs">Giấy phép kinh doanh</h3>
              </div>
              <input type="file" ref={licenseInputRef} accept=".pdf,image/*" className="hidden" onChange={handleLicenseChange} />

              {!businessLicense ? (
                <div onClick={() => licenseInputRef.current.click()} className="py-12 border-2 border-dashed border-indigo-200 rounded-[1.5rem] bg-white/60 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer text-center group">
                  <UploadCloud size={40} className="mx-auto mb-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                  <p className="font-black text-indigo-900">Nhấp để tải lên tài liệu xác thực</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mt-2">Hỗ trợ PDF, JPG, PNG</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <FileText size={24} className="text-indigo-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-indigo-900 truncate pr-4">{businessLicense.name}</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">{businessLicense.isFromServer ? "Dữ liệu máy chủ" : "Tệp mới chọn"}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleRemoveLicense} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={20} strokeWidth={3} /></button>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto bg-slate-900 hover:bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-500 shadow-xl hover:-translate-y-2 disabled:opacity-50 group"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                {isLoading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT HỒ SƠ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployerProfile;