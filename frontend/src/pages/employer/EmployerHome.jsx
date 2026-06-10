'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Plus, MoreVertical, MapPin, Clock, Briefcase, DollarSign,
  Edit, Trash2, Users, ShieldCheck, ShieldAlert,
  Loader2, XCircle, BarChart3, Eye, Sparkles, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import EditJobModal from './EditJobModal';

const EmployerHome = () => {
  const getSessionData = () => {
    const s = sessionStorage.getItem('userAccount');
    if (s) return JSON.parse(s);
    const l = localStorage.getItem('lastLogin_userAccount');
    return l ? JSON.parse(l) : {};
  };

  const user = getSessionData();
  const employerId = user.userId;
  const API = 'http://localhost:8081';

  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [editingJob, setEditingJob] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('UNVERIFIED');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState(user.fullName || 'Nhà tuyển dụng');
  const location = useLocation();

  const fetchEmployerProfile = async () => {
    if (!employerId) return;
    try {
      const res = await axios.get(`${API}/api/employer-profiles/${employerId}`);
      if (res.data) {
        setVerificationStatus(res.data.verificationStatus || 'UNVERIFIED');
        setCompanyName(res.data.companyName || '');
        const name = res.data.user?.fullName || res.data.fullName;
        if (name) setDisplayName(name);
      }
    } catch (e) { console.error(e); }
  };

  const fetchJobs = async () => {
    if (!employerId) { setIsLoadingJobs(false); return; }
    try {
      setIsLoadingJobs(true);
      const res = await axios.get(`${API}/api/jobs/employer/${employerId}`);
      if (res.data?.length > 0) {
        const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setJobs(sorted.map(j => ({
          id: j.jobId, title: j.title, status: j.status || 'Chờ duyệt',
          location: j.workLocation, salary: j.salary, type: j.jobType,
          views: j.viewCount || 0, applicants: j.applyCount || 0,
          posted: new Date(j.createdAt).toLocaleDateString('vi-VN'), rawJob: j
        })));
      } else setJobs([]);
    } catch (e) { setJobs([]); }
    finally { setIsLoadingJobs(false); }
  };

  useEffect(() => { fetchJobs(); fetchEmployerProfile(); }, [employerId]);
  useEffect(() => {
    if (location.hash === '#job-list') setTimeout(() => document.getElementById('job-list')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [location]);
  useEffect(() => {
    const h = (e) => { if (!e.target.closest('.dropdown-container')) setOpenDropdownId(null); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const deleteJob = async (id) => {
    try { await axios.delete(`${API}/api/jobs/${id}`); setJobs(p => p.filter(j => j.id !== id)); }
    catch { alert('Không thể xóa tin.'); }
  };

  const norm = (s) => s === 'Đã duyệt' ? 'Đang hiển thị' : (s || 'Chờ duyệt');
  const filtered = jobs.filter(j => statusFilter === 'Tất cả' || norm(j.status) === statusFilter);
  const cnt = (s) => s === 'Tất cả' ? jobs.length : jobs.filter(j => norm(j.status) === s).length;
  const totalApp = jobs.reduce((a, j) => a + j.applicants, 0);
  const activeN = jobs.filter(j => norm(j.status) === 'Đang hiển thị').length;

  const cV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const iV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  const sty = {
    'Đang hiển thị': { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', card: 'border-slate-100 hover:border-emerald-200' },
    'Chờ duyệt': { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', card: 'border-amber-100/60 bg-amber-50/20' },
    'Từ chối': { bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', card: 'border-rose-100/60 bg-rose-50/20 opacity-80' },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">

      {/* ═══════════ HERO ═══════════ */}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 md:p-10 text-white shadow-2xl mb-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-15 -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-10 -ml-32 -mb-32 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-blue-200 text-xs font-bold mb-4 border border-white/15">
              <Sparkles size={12} className="text-amber-300 animate-pulse" /> Dashboard Nhà Tuyển Dụng
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex flex-wrap items-center gap-3">
              Chào mừng, {companyName || displayName}! 👋
              {verificationStatus === 'VERIFIED' && <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-200 text-xs font-bold"><ShieldCheck size={13} /> Đã xác thực</span>}
              {verificationStatus === 'PENDING' && <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-200 text-xs font-bold"><Clock size={13} /> Đang chờ duyệt</span>}
              {verificationStatus === 'UNVERIFIED' && <Link to="/employer/profile" className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 border border-rose-400/30 hover:bg-rose-500/40 rounded-xl text-rose-200 text-xs font-bold transition-colors"><ShieldAlert size={13} /> Chưa xác thực</Link>}
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-blue-200/60 text-sm font-medium">Quản lý tin tuyển dụng và theo dõi ứng viên tại đây.</motion.p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}>
            <Link to="/employer/create-job" className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-50 px-7 py-3.5 rounded-2xl font-black text-sm shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-0.5 active:scale-95">
              <Plus size={18} strokeWidth={3} className="text-blue-600" /> Đăng tin mới
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════ STATS ═══════════ */}
      <motion.div variants={cV} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {[
          { label: 'Tin hiển thị', val: activeN, Icon: Briefcase, c: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tổng ứng viên', val: totalApp, Icon: Users, c: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tổng tin đăng', val: jobs.length, Icon: BarChart3, c: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <motion.div key={i} variants={iV} whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center gap-5 group relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${s.bg} opacity-30 rounded-full blur-2xl group-hover:opacity-60 transition-opacity`} />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.bg} ${s.c} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <s.Icon size={26} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-4xl font-black text-slate-800 tracking-tight">{s.val}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════ JOB LIST ═══════════ */}
      <div id="job-list">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Briefcase size={20} /></div>
            Tin tuyển dụng của bạn
          </h3>
          <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            {['Tất cả', 'Chờ duyệt', 'Đang hiển thị', 'Từ chối'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`relative px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors z-10 flex items-center gap-1.5 ${statusFilter === s ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {statusFilter === s && <motion.div layoutId="stab" className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md" transition={{ type: 'spring', stiffness: 400, damping: 30 }} style={{ zIndex: -1 }} />}
                {s}<span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === s ? 'bg-white/20' : 'bg-slate-100'}`}>{cnt(s)}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoadingJobs ? (
            <motion.div key="ld" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-20">
              <Loader2 className="animate-spin text-blue-500 mb-3" size={36} /><p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Đang tải...</p>
            </motion.div>
          ) : jobs.length === 0 ? (
            <motion.div key="em" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-slate-100"><Briefcase size={36} className="text-slate-300" /></div>
              <p className="text-slate-600 font-bold text-lg mb-1">Chưa có tin tuyển dụng nào.</p>
              <p className="text-slate-400 text-sm mb-6">Hãy đăng tin đầu tiên!</p>
              <Link to="/employer/create-job" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all"><Plus size={16} strokeWidth={3} /> Đăng tin</Link>
            </motion.div>
          ) : (
            <motion.div key="ls" variants={cV} initial="hidden" animate="visible" className="space-y-4">
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Briefcase size={28} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500 font-medium">Không có tin ở trạng thái <strong>{statusFilter}</strong>.</p>
                  </motion.div>
                ) : filtered.map((job) => {
                  const ns = norm(job.status);
                  const st = sty[ns] || sty['Đang hiển thị'];
                  const isA = ns === 'Đang hiển thị', isP = ns === 'Chờ duyệt', isR = ns === 'Từ chối';

                  return (
                    <motion.div layout key={job.id} variants={iV} exit={{ opacity: 0, x: -30 }}
                      whileHover={{ y: -4, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.06)' }}
                      className={`relative bg-white rounded-[1.75rem] border ${st.card} shadow-sm transition-all duration-300 overflow-hidden group`}>

                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${st.bar} ${isA ? 'shadow-[3px_0_12px_rgba(16,185,129,0.4)]' : ''}`} />

                      <div className="p-6 pl-8">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 pr-4">
                            {isP || isR
                              ? <h4 className="text-lg font-bold text-slate-600 truncate">{job.title}</h4>
                              : <Link to={`/employer/jobs/${job.id}`} className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors truncate block group-hover:text-blue-600">{job.title}</Link>}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${st.badge}`}>{ns}</span>
                              {isP && <Loader2 size={12} className="text-amber-500 animate-spin" />}
                              {isR && <XCircle size={12} className="text-rose-500" />}
                            </div>
                          </div>
                          <div className="relative dropdown-container shrink-0">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpenDropdownId(openDropdownId === job.id ? null : job.id)}
                              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"><MoreVertical size={18} /></motion.button>
                            <AnimatePresence>
                              {openDropdownId === job.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-30">
                                  {isA && <Link to={`/employer/jobs/${job.id}/candidates`} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-bold flex items-center gap-3 transition-colors"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Users size={13} /></div> Xem ứng viên</Link>}
                                  <button onClick={() => { setEditingJob(job.rawJob || job); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-bold flex items-center gap-3 transition-colors"><div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><Edit size={13} /></div> Sửa tin</button>
                                  <div className="h-px bg-slate-100 my-1 mx-4" />
                                  <button onClick={() => { if (window.confirm('Xóa tin này?')) deleteJob(job.id); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-3 transition-colors"><div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg"><Trash2 size={13} /></div> Xóa tin</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-5">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl"><MapPin size={12} className="text-slate-400" /> {job.location}</span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl"><DollarSign size={12} className="text-emerald-500" /> {job.salary}</span>
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl"><Clock size={12} className="text-slate-400" /> {job.type}</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100"><Eye size={12} className="text-slate-400" /></div>
                              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lượt xem</p><p className="text-sm font-black text-slate-700">{job.views}</p></div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100"><Users size={12} className="text-blue-500" /></div>
                              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ứng tuyển</p><p className="text-sm font-black text-blue-600">{job.applicants}</p></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">Đăng: {job.posted}</p>
                            {isA && <Link to={`/employer/jobs/${job.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 hover:scale-105"><ArrowUpRight size={14} /></Link>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EditJobModal isOpen={editingJob !== null} onClose={() => setEditingJob(null)} jobData={editingJob} onSave={() => { fetchJobs(); setEditingJob(null); }} />
    </div>
  );
};

export default EmployerHome;