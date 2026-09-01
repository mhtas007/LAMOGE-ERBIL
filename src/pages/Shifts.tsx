import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Search, 
  Clock, 
  CalendarDays, 
  User, 
  UserCircle, 
  Banknote, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Timer, 
  Coins, 
  ShieldCheck, 
  TrendingUp,
  Award,
  ChevronRight,
  Filter,
  UserCheck,
  Calendar,
  Briefcase,
  Layers,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import { Shift } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const Shifts: React.FC = () => {
  const { t, isRtl, shifts, language, users } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Filter shifts based on multiple inputs
  const filteredShifts = useMemo(() => {
    return shifts
      .filter(shift => {
        const matchesSearch = shift.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              shift.userRole.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesUser = selectedUserId === 'all' || shift.userId === selectedUserId;

        let matchesDate = true;
        if (filterDate) {
          const shiftDate = new Date(shift.clockInTime).toISOString().split('T')[0];
          matchesDate = shiftDate === filterDate;
        }
        
        return matchesSearch && matchesDate && matchesUser;
      })
      .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
  }, [shifts, searchTerm, filterDate, selectedUserId]);

  // Dynamic Shift Statistics - filtered by selected employee
  const metrics = useMemo(() => {
    const targetShifts = selectedUserId === 'all' 
      ? shifts 
      : shifts.filter(s => s.userId === selectedUserId);

    const active = targetShifts.filter(s => !s.clockOutTime).length;
    const completed = targetShifts.filter(s => !!s.clockOutTime);
    const totalHours = completed.reduce((sum, s) => sum + (s.totalHours || 0), 0);
    const totalSales = completed.reduce((sum, s) => sum + (s.totalSales || 0), 0);
    const totalOrders = targetShifts.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
    
    const reconciliations = completed.filter(s => s.userRole !== 'waiter');
    const perfectReconciliations = reconciliations.filter(s => (s.discrepancy || 0) === 0).length;
    const reconciliationRate = reconciliations.length > 0 
      ? Math.round((perfectReconciliations / reconciliations.length) * 100) 
      : 100;

    // Additional premium calculated metadata
    const avgShiftDuration = completed.length > 0 ? totalHours / completed.length : 0;
    const avgSalesPerShift = completed.length > 0 ? totalSales / completed.length : 0;
    
    // Check if user currently has an active shift
    const isOnDuty = targetShifts.some(s => !s.clockOutTime);

    return { 
      active, 
      totalHours, 
      totalSales, 
      totalOrders,
      reconciliationRate, 
      avgShiftDuration, 
      avgSalesPerShift,
      isOnDuty,
      totalCount: targetShifts.length
    };
  }, [shifts, selectedUserId]);

  // Find info of currently selected user if any
  const selectedUserObj = useMemo(() => {
    if (selectedUserId === 'all') return null;
    return users.find(u => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'ar' ? 'ar-IQ' : language === 'ku' ? 'ku-IQ' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatHours = (hours?: number) => {
    if (hours === undefined) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (language === 'ku') {
      return `${h} کاتژمێر ${m} خولەک`;
    } else if (language === 'ar') {
      return `${h} ساعة ${m} دقيقة`;
    }
    return `${h}h ${m}m`;
  };

  // Kurdish Localization helpers for roles
  const getRoleLabel = (role: string) => {
    if (role === 'super_admin') return isRtl ? 'سەرپەرشتیار' : 'Super Admin';
    if (role === 'admin') return isRtl ? 'بەڕێوبەر' : 'Admin';
    if (role === 'cashier') return isRtl ? 'کاشێر' : 'Cashier';
    return isRtl ? 'گارسۆن' : 'Waiter';
  };

  return (
    <div className="space-y-8 pb-16 px-1 max-w-7xl mx-auto font-sans">
      
      {/* 1. Header Hero Banner - High Contrast Deep Royal Slate */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 rounded-[2.5rem] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white">
        {/* Abstract glowing decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
              <Fingerprint size={13} className="text-indigo-400" />
              {isRtl ? 'تایبەت بە کارمەندان' : 'Employee Terminal'}
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {isRtl ? 'دەوام و حیساباتی کارمەند' : 'Shifts & Employee Hub'}
            </h1>
            
            <p className="text-natural-text-tertiary text-sm sm:text-base max-w-2xl font-light leading-relaxed">
              {isRtl 
                ? 'چاودێری و وردبینی دەقیقی دەوامی کارمەندان، کۆنترۆڵکردنی داهاتی شیفت، جیاوازی سندوقی حیساب و ناردنی داتاکان بە شێوەیەکی پرۆفشناڵ.' 
                : 'Advanced real-time control, verification of employee active shifts, shift revenue, automated cash reconciliation and audit reports.'
              }
            </p>
          </div>
          
          {/* Real-time sync beacon */}
          <div className="flex items-center gap-3.5 bg-slate-900/80 border border-slate-800 p-5 rounded-[2rem] backdrop-blur-md self-stretch md:self-auto justify-center shadow-lg">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-40 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className="text-[10px] uppercase font-black tracking-widest text-natural-text-secondary">Cloud Fire-Terminal</div>
              <div className="text-xs font-bold text-slate-200">
                {isRtl ? 'سەرچاوەی متمانەپێکراو' : 'Secure Firestore DB'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Advanced Interactive Filter Bar */}
      <div className="bg-natural-surface p-5 rounded-[2rem] border border-natural-border shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Left Search input */}
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4.5' : 'left-4.5'} text-natural-text-tertiary`} size={18} />
          <input
            type="text"
            placeholder={isRtl ? 'بگەڕێ لە نێوان دەوامەکان (ناو، ناونیشان)...' : 'Search shift logs...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-natural-bg border border-natural-border/80 rounded-2xl py-3.5 px-4 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-natural-text placeholder-slate-400 focus:outline-none focus:bg-natural-surface focus:border-slate-300 transition-all font-medium text-sm`}
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Employee selector - Trigger for Spotlight */}
          <div className="relative min-w-[200px]">
            <User className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-indigo-500`} size={16} />
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
              }}
              className={`w-full bg-natural-bg border border-natural-border/80 rounded-2xl py-3.5 ${isRtl ? 'pr-10 pl-6' : 'pl-10 pr-6'} text-natural-text focus:outline-none focus:bg-natural-surface focus:border-slate-300 transition-all text-sm font-black appearance-none cursor-pointer`}
            >
              <option value="all">{isRtl ? '👤 هەموو بەکارهێنەران' : '👤 All Employees'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative min-w-[180px]">
            <CalendarDays className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-natural-text-tertiary`} size={16} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={`w-full bg-natural-bg border border-natural-border/80 rounded-2xl py-3.5 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-natural-text focus:outline-none focus:bg-natural-surface focus:border-slate-300 transition-all text-sm font-bold cursor-pointer`}
            />
          </div>
        </div>
      </div>

      {/* 3. Dynamic Spotlight Card or Aggregated Overview */}
      <AnimatePresence mode="wait">
        {selectedUserObj ? (
          /* Premium Employee Spotlight Profile Card */
          <motion.div
            key={`spotlight-${selectedUserId}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-natural-border rounded-[2.5rem] p-6 sm:p-10 shadow-[0_10px_35px_rgba(0,0,0,0.02)] relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-between relative z-10">
              
              {/* Left Profile details */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-indigo-200 border-4 border-white relative">
                  {selectedUserObj.name.charAt(0).toUpperCase()}
                  
                  {/* Active Beacon */}
                  <span className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${metrics.isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                </div>

                <div className="space-y-2 self-center">
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-natural-text tracking-tight">{selectedUserObj.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                      selectedUserObj.role === 'super_admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      selectedUserObj.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      selectedUserObj.role === 'cashier' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {getRoleLabel(selectedUserObj.role)}
                    </span>
                  </div>
                  
                  <p className="text-natural-text-tertiary text-sm font-medium">
                    {isRtl ? `بەکارهێنەر: @${selectedUserObj.username}` : `Username: @${selectedUserObj.username}`} • {selectedUserObj.email}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                      metrics.isOnDuty 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-natural-bg text-natural-text-secondary border-natural-border'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${metrics.isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {metrics.isOnDuty 
                        ? (isRtl ? 'دەستبەکار / چالاک ئێستا' : 'Currently On-Duty / Active') 
                        : (isRtl ? 'دەرەوەی دەوام' : 'Currently Off-Duty')
                      }
                    </span>
                    
                    {metrics.totalCount > 5 && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                        <Award size={12} />
                        {isRtl ? 'کارمەندی بەئەزموون' : 'Highly Experienced Star'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Performance KPIs (Single clean layout - NO nested cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 lg:max-w-2xl border-t lg:border-t-0 lg:border-l border-natural-border/60 pt-6 lg:pt-0 lg:pl-8 justify-items-stretch">
                
                <div className="p-3 text-center sm:text-left">
                  <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest block mb-1">
                    {isRtl ? 'دەوامەکان' : 'Total Sessions'}
                  </span>
                  <div className="text-2xl font-black text-natural-text">{metrics.totalCount}</div>
                  <span className="text-[10px] text-natural-text-tertiary block mt-1">{isRtl ? 'شیفت لە سەرەتاوە' : 'Shifts on record'}</span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest block mb-1">
                    {isRtl ? 'کۆی کاتژمێر' : 'Total Hours'}
                  </span>
                  <div className="text-2xl font-black text-natural-text">{Math.round(metrics.totalHours)} h</div>
                  <span className="text-[10px] text-natural-text-tertiary block mt-1">
                    {isRtl ? `تێکڕا ${metrics.avgShiftDuration.toFixed(1)} ک/شیفت` : `Avg ${metrics.avgShiftDuration.toFixed(1)} h/shift`}
                  </span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest block mb-1">
                    {isRtl ? 'فرۆشی گشتی' : 'Total Sales'}
                  </span>
                  <div className="text-xl font-black text-indigo-600 truncate">
                    {metrics.totalSales.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-natural-text-tertiary block mt-1">IQD</span>
                </div>

                <div className="p-3 text-center sm:text-left">
                  <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest block mb-1">
                    {isRtl ? 'ڕێژەی ڕێکخستن' : 'Drawer Acc.'}
                  </span>
                  <div className="text-2xl font-black text-emerald-600">{metrics.reconciliationRate}%</div>
                  <span className="text-[10px] text-natural-text-tertiary block mt-1">{isRtl ? 'بێ جیاوازی' : 'Perfect Drawer'}</span>
                </div>

              </div>

            </div>
          </motion.div>
        ) : (
          /* General aggregate stats title */
          <motion.div
            key="general-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-natural-text font-black text-lg sm:text-xl px-1"
          >
            <Layers size={18} className="text-indigo-500" />
            {isRtl ? 'داشبۆردی شیکاری گشتی سەرجەم دەوامەکان' : 'General Shift Intelligence & Overview'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Luxury Bento Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 - Active Sessions */}
        <div className="bg-natural-surface border border-natural-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center">
              <Timer size={20} className="animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50/50 text-emerald-600 border border-emerald-100/30">
              {isRtl ? 'دەستبەجێ' : 'Live'}
            </span>
          </div>
          <div>
            <div className="text-3.5xl font-black text-natural-text mb-1">{metrics.active}</div>
            <div className="text-xs text-natural-text-tertiary font-bold">
              {isRtl ? 'دەوامی چالاکی ئێستا' : 'Active Duty Now'}
            </div>
          </div>
        </div>

        {/* Metric 2 - Total Hours Logged */}
        <div className="bg-natural-surface border border-natural-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50/50 text-indigo-600 border border-indigo-100/30">
              {isRtl ? 'کۆکراوە' : 'Hours'}
            </span>
          </div>
          <div>
            <div className="text-3.5xl font-black text-natural-text mb-1">{formatHours(metrics.totalHours)}</div>
            <div className="text-xs text-natural-text-tertiary font-bold">
              {isRtl ? 'کۆی گشتی کاتژمێر' : 'Total Hours Logged'}
            </div>
          </div>
        </div>

        {/* Metric 3 - Revenue Managed */}
        <div className="bg-natural-surface border border-natural-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center">
              <Coins size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-amber-50/50 text-amber-600 border border-amber-100/30">
              {isRtl ? 'داهات' : 'Sales'}
            </span>
          </div>
          <div>
            <div className="text-3.5xl font-black text-natural-text mb-1">
              {metrics.totalSales.toLocaleString()} <span className="text-xs font-bold text-natural-text-tertiary">IQD</span>
            </div>
            <div className="text-xs text-natural-text-tertiary font-bold">
              {isRtl ? 'فرۆشی گشتی ئەم کارمەندە' : 'Sales Under Command'}
            </div>
          </div>
        </div>

        {/* Metric 4 - Drawer Reconciliation Acc. */}
        <div className="bg-natural-surface border border-natural-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/5 to-transparent rounded-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-rose-50/50 text-rose-600 border border-rose-100/30">
              {isRtl ? 'متمانە' : 'Drawer'}
            </span>
          </div>
          <div>
            <div className="text-3.5xl font-black text-natural-text mb-1">{metrics.reconciliationRate}%</div>
            <div className="text-xs text-natural-text-tertiary font-bold">
              {isRtl ? 'دەوامی بێ کورتهێنان' : 'Zero Discrepancy Rate'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Shift Logs Timeline (List) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-black text-natural-text flex items-center gap-2">
            <Briefcase size={18} className="text-indigo-500" />
            {isRtl ? 'سەرجەم تۆمارەکانی دەوام' : 'Shift Chronology & Logs'}
          </h2>
          <span className="text-xs font-bold text-natural-text-tertiary bg-natural-bg border border-natural-border/80 px-3 py-1 rounded-xl">
            {filteredShifts.length} {isRtl ? 'دەوام تۆمارکراوە' : 'records matched'}
          </span>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="bg-natural-surface rounded-[2rem] border border-natural-border p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-natural-bg text-natural-text-tertiary flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-black text-natural-text mb-1">
              {isRtl ? 'هیچ تۆمارێکی دەوام نەدۆزرایەوە' : 'No shifts match your search'}
            </h3>
            <p className="text-natural-text-tertiary text-sm max-w-sm mx-auto">
              {isRtl 
                ? 'هیچ تۆمارێکی دەوام لەگەڵ فلتەرەکانتدا ناگونجێت. تکایە فلتەرەکان بگۆڕە.' 
                : 'No shifts correspond to your search. Try resetting the filters.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredShifts.map((shift) => {
              const isCompleted = !!shift.clockOutTime;
              const hasDiscrepancy = (shift.discrepancy || 0) !== 0;
              const isWaiterShift = shift.userRole === 'waiter';
              
              return (
                <div 
                  key={shift.id} 
                  className="bg-natural-surface rounded-[2rem] border border-natural-border/80 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden hover:shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:border-natural-border/80 transition-all duration-300 group"
                >
                  {/* Outer flex layout: No nested cards, clean dividers */}
                  <div className="flex flex-col lg:flex-row items-stretch">
                    
                    {/* Left Block - Avatar, Role, Status, and Clock Logs */}
                    <div className="p-6 flex-1 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-natural-border">
                      
                      <div className="flex items-start gap-4">
                        {/* High-class avatar accent */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 border border-natural-border text-natural-text flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-105 transition-transform shrink-0">
                          {shift.userName.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-natural-text tracking-tight">{shift.userName}</h3>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              shift.userRole === 'super_admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              shift.userRole === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              shift.userRole === 'cashier' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {getRoleLabel(shift.userRole)}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-natural-text-tertiary font-medium">
                            ID: {shift.userId.substring(0, 8)}...
                          </p>
                        </div>
                      </div>

                      {/* Timeline clock entries */}
                      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                        <div>
                          <div className="text-[9px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {isRtl ? 'دەستپێک / کلوک ئین' : 'Clock In'}
                          </div>
                          <div className="text-natural-text font-bold text-xs mt-1">
                            {formatDateTime(shift.clockInTime)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            {isRtl ? 'کۆتایی / کلوک ئاوت' : 'Clock Out'}
                          </div>
                          <div className="text-natural-text font-bold text-xs mt-1">
                            {shift.clockOutTime ? formatDateTime(shift.clockOutTime) : '—'}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Middle Block - Live/Finished status indicators & Sales Statistics */}
                    <div className="p-6 flex-1 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-natural-border bg-natural-bg/10">
                      
                      {isCompleted ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                              <Receipt size={11} />
                              {isWaiterShift ? (isRtl ? 'ژمارەی داواکارییەکان' : 'Total Managed Orders') : (isRtl ? 'سەرجەم پسووڵەکان' : 'Total Orders Processed')}
                            </span>
                            <span className="text-sm font-black text-natural-text bg-natural-bg px-2.5 py-0.5 rounded-lg">
                              {shift.totalOrders || 0}
                            </span>
                          </div>

                          {!isWaiterShift && (
                            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                              <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                                <Banknote size={11} />
                                {isRtl ? 'کۆی فرۆشی دەوام' : 'Shift Sales Value'}
                              </span>
                              <span className="text-base font-black text-amber-600">
                                {(shift.totalSales || 0).toLocaleString()} <span className="text-[10px] font-bold text-natural-text-tertiary">IQD</span>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                              <Timer size={11} />
                              {isRtl ? 'کۆی کات' : 'Duration'}
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                              {formatHours(shift.totalHours)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center animate-spin-slow shadow-inner">
                            <Clock size={18} />
                          </div>
                          <div className="text-xs font-black text-natural-text">
                            {isRtl ? 'ئەم دەوامە ئێستا بەردەوامە' : 'Active Duty Session'}
                          </div>
                          <p className="text-[11px] text-natural-text-tertiary max-w-xs leading-normal">
                            {isRtl 
                              ? 'سەرجەم داتای حیسابات لەگەڵ بڕی پارەی سندوق لە کاتی داخستنی شیفت تێکەڵ دەکرێت.' 
                              : 'Reconciliation figures will calculate on terminal closure.'
                            }
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Right Block - Drawer Reconciliation Audit (Only for Admins/Cashiers) */}
                    <div className="p-6 flex-1 flex flex-col justify-center bg-natural-bg/20">
                      
                      {isCompleted && !isWaiterShift ? (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-natural-text-tertiary uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={11} className="text-indigo-500" />
                            {isRtl ? 'ڕاپۆرتی حیسابی سندوق' : 'Cash Drawer Audit'}
                          </h4>

                          <div className="bg-natural-surface border border-natural-border rounded-2xl p-4.5 space-y-2.5">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-natural-text-tertiary block text-[10px] mb-0.5">{isRtl ? 'چاوەڕوانکراو (سیستەم)' : 'Expected Cash'}</span>
                                <span className="font-extrabold text-natural-text">{(shift.expectedCash || 0).toLocaleString()} IQD</span>
                              </div>
                              <div>
                                <span className="text-natural-text-tertiary block text-[10px] mb-0.5">{isRtl ? 'بینراو (کارمەند)' : 'Declared Cash'}</span>
                                <span className="font-extrabold text-natural-text">{(shift.declaredCash || 0).toLocaleString()} IQD</span>
                              </div>
                            </div>

                            <div className="pt-2.5 border-t border-natural-border flex justify-between items-center">
                              <span className="text-[10px] font-bold text-natural-text-secondary">{isRtl ? 'جیاوازی کۆتایی' : 'Drawer Discrepancy'}</span>
                              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                                hasDiscrepancy 
                                  ? (shift.discrepancy! < 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600') 
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {!hasDiscrepancy && <CheckCircle2 size={11} />}
                                {hasDiscrepancy 
                                  ? (shift.discrepancy! > 0 ? `+${shift.discrepancy!.toLocaleString()}` : shift.discrepancy!.toLocaleString()) 
                                  : (isRtl ? 'گونجاوە (بێ کێشە)' : 'Perfect Match (0)')
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isCompleted && isWaiterShift ? (
                        /* Waiters don't manage drawer reconciliations */
                        <div className="flex flex-col items-center justify-center text-center py-4 space-y-1.5 text-natural-text-tertiary">
                          <UserCheck size={20} className="text-natural-text-tertiary" />
                          <div className="text-xs font-bold text-slate-600">
                            {isRtl ? 'دەوامی گارسۆن' : 'Waiter Shift'}
                          </div>
                          <p className="text-[10px] max-w-[200px] leading-relaxed">
                            {isRtl 
                              ? 'کارمەندانی گارسۆن مێز کۆنترۆڵ دەکەن و سندوق بەڕێوە نابەن.' 
                              : 'Waiter accounts do not manage cash drawers directly.'
                            }
                          </p>
                        </div>
                      ) : (
                        /* Not completed shift info */
                        <div className="flex flex-col items-center justify-center text-center py-4 text-natural-text-tertiary">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping mb-2" />
                          <div className="text-xs font-bold text-slate-600">
                            {isRtl ? 'سیستەم چاوەڕوانە' : 'Terminal Idle'}
                          </div>
                          <p className="text-[10px] mt-1 max-w-[220px]">
                            {isRtl ? 'هێشتا شیفت دۆخی چوونە دەرەوەی بۆ نەکراوە.' : 'Reconciliation awaiting shift terminal clock out.'}
                          </p>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
