import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building, Briefcase, AlertTriangle, 
  TrendingUp, Building2, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const OverviewTab = ({ users = [], jobs = [], reports = [], setActiveTab }) => {
  
  // 1. TÍNH TOÁN CÁC CHỈ SỐ THỰC TẾ
  const stats = useMemo(() => {
    const totalUsers = users.length;
    
    // Đếm số lượng nhà tuyển dụng duy nhất (Hỗ trợ cả camelCase và snake_case)
    const totalEmployers = [...new Set(jobs.map(job => job.employerId || job.employer_id))].filter(id => id).length 
      || users.filter(u => ['ntd', 'employer', 'nhà tuyển dụng'].includes(u.role?.toLowerCase())).length;
    
    // Chỉ đếm những việc làm đang thực sự "Đang hiển thị" (Active)
    const activeJobsCount = jobs.filter(j => j.status === 'Đang hiển thị' || j.status === 'Active').length || jobs.length;

    return [
      { label: 'Tổng người dùng', value: totalUsers, icon: Users, theme: 'blue' },
      { label: 'Doanh nghiệp', value: totalEmployers, icon: Building, theme: 'purple' },
      { label: 'Việc làm đang mở', value: activeJobsCount, icon: Briefcase, theme: 'emerald' },
      { label: 'Báo cáo hệ thống', value: reports.length, icon: AlertTriangle, theme: 'rose' },
    ];
  }, [users, jobs, reports]);

  // 2. DỮ LIỆU BIỂU ĐỒ ĐỘNG
  const dynamicChartData = useMemo(() => [
    { name: 'Người dùng', count: users.length, color: '#3b82f6' },
    { name: 'Việc làm', count: jobs.length, color: '#10b981' },
    { name: 'Báo cáo', count: reports.length, color: '#f43f5e' }
  ], [users, jobs, reports]);

  // 3. LOGIC LỌC VIỆC LÀM LƯƠNG CAO
  const sortedJobs = useMemo(() => {
    const parseSalary = (salaryStr) => {
      if (!salaryStr) return 0;
      const numbers = salaryStr.match(/\d+/g);
      return numbers ? Math.max(...numbers.map(Number)) : 0;
    };

    return [...jobs]
      .sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary))
      .slice(0, 10);
  }, [jobs]);

  return (
    <div className="space-y-8 pb-10">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const themes = {
            blue: 'bg-blue-50 text-blue-600',
            purple: 'bg-purple-50 text-purple-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            rose: 'bg-rose-50 text-rose-600'
          };
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-[24px] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${themes[stat.theme]}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BIỂU ĐỒ TỔNG QUAN */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col min-h-[480px]">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Tương quan hệ thống</h3>
              <p className="text-sm font-medium text-slate-500">Dữ liệu thực tế từ cơ sở dữ liệu</p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold text-emerald-600 uppercase tracking-tighter border border-emerald-100">
              Live Data
            </div>
          </div>
          
          {/* === CỐ ĐỊNH h-[300px] TRỰC TIẾP === */}
          <div className="w-full h-[300px] flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                  {dynamicChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP VIỆC LÀM LƯƠNG CAO */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col h-[525px]">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Việc làm thu nhập cao</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {sortedJobs.map((job, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-white transition-all group cursor-default">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-100 transition-colors">
                    <Building2 size={18} className="text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{job.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">{job.skills?.split(',')[0] || 'IT'}</p>
                  </div>
                </div>
                <span className="shrink-0 ml-2 text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tighter">
                  {job.salary}
                </span>
              </div>
            ))}
            {sortedJobs.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10 italic">
                Chưa có dữ liệu việc làm
              </div>
            )}
          </div>

          {/* === GỌI HÀM AN TOÀN TRÁNH CRASH === */}
          <button 
            onClick={() => setActiveTab && setActiveTab('jobs')}
            className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
          >
            XEM TẤT CẢ VIỆC LÀM <ArrowUpRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;