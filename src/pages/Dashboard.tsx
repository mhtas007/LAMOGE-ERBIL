import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  TrendingUp, 
  FileText, 
  Banknote, 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ShoppingCart,
  UtensilsCrossed,
  Armchair,
  PackageOpen,
  ReceiptText,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

const descTranslations = {
  en: {
    pos: 'Point of Sale terminal to create orders, print invoices, and process payments.',
    menu: 'Manage cafe products, prices, categories, and inventory items.',
    tables: 'Live dining table layout, reservations, and real-time floor monitoring.',
    inventory: 'Track ingredient stock levels, low-stock warnings, and adjustments.',
    expenses: 'Record and manage shop operations cost and purchase receipts.',
    receipts: 'Complete history of printed customer bills and transaction search.',
    reports: 'Advanced intelligence business performance and PDF exports.',
    users: 'Manage employee staff roles, system permissions, and access.',
    shifts: 'Manage active worker shifts, sales, and telegram reports.',
    settings: 'System configurations, receipt design, logo, and printer settings.',
    systemControl: 'System Control Terminal',
    shiftStatus: 'Shift Status',
    shiftActive: 'Active',
    shiftInactive: 'Inactive',
    clockedInAt: 'Clocked in at',
    totalSales: 'Sales',
    logoutTerminal: 'Logout Terminal',
    appLaunchpad: 'App Launchpad',
    appLaunchpadDesc: 'Click to launch any workspace terminal',
    analyticsHub: 'Executive Analytics Hub',
  },
  ku: {
    pos: 'تێرمیناڵی فرۆشتن بۆ تۆمارکردنی داواکارییەکان، چاپکردنی پسوولە و وەرگرتنی پارە.',
    menu: 'بەڕێوەبردنی بەرهەمەکان، نرخ، جۆری خواردن و خواردنەوەکان لە مینیو.',
    tables: 'نەخشەی مێزەکان بە ڕاستەوخۆ، داواکاری مێزەکان و چاودێری هۆڵی کافێ.',
    inventory: 'چاودێریکردنی ئاستی کۆگا، ئاگادارکردنەوەی کەمی مەواد و تۆمارکردنی جوڵەکان.',
    expenses: 'تۆمارکردن و بەڕێوەبردنی خەرجییەکانی کافێ و وێنەی پسوولەکانی کڕین.',
    receipts: 'مێژووی تەواوی پسوولەکانی فرۆشتنی موشتەری، گەڕان و گێڕانەوەی پسوولە.',
    reports: 'ڕاپۆرتی پێشکەوتووی داهات و قازانج، ئامارەکان و دەرکردنی PDF گشتی.',
    users: 'بەڕێوەبردنی کارمەندان، دیاریکردنی دەسەڵاتەکان و چوونەژوورەوەی سیستم.',
    shifts: 'دەستپێکردن و کۆتایی هێنان بە دەوام، فرۆشی شیفت و ڕاپۆرت بۆ تەلەگرام.',
    settings: 'ڕێکخستنی گشتی سیستم، دیزاینی پسوولە، لۆگۆی بارکراو و تەلەگرام.',
    systemControl: 'کۆنترۆڵی دەستگە و چوونە دەرەوە',
    shiftStatus: 'دۆخی دەوام (شیفت)',
    shiftActive: 'چالاکە',
    shiftInactive: 'ناچالاکە',
    clockedInAt: 'دەستپێکردن لە کاتژمێر',
    totalSales: 'کۆی فرۆش',
    logoutTerminal: 'چوونەدەرەوە لە سیستم',
    appLaunchpad: 'ڕێپێدەر و خانەکانی کارکردن',
    appLaunchpadDesc: 'کلیک لەسەر هەر خانەیەک بکە بۆ کردنەوەی تێرمیناڵەکە',
    analyticsHub: 'ناوەندی ئامار و شیکاری گشتی',
  },
  ar: {
    pos: 'محطة البيع لتسجيل الطلبات وطباعة الفواتير ومعالجة المدفوعات.',
    menu: 'إدارة المنتجات، الأسعار، الفئات وقائمة المشروبات والمأكولات.',
    tables: 'مخطط الطاولات المباشر، الطلبات ومتابعة حالة الصالة أولاً بأول.',
    inventory: 'مراقبة مستويات المخزون، تنبيهات النقص وإجراء التسويات التاريخية.',
    expenses: 'تسجيل وإدارة مصاريف التشغيل، فئات الصرف وصور إيصالات الشراء.',
    receipts: 'سجل كامل لفواتير المبيعات المطبوعة، البحث في المعاملات وإرجاع المبالغ.',
    reports: 'تقارير متقدمة للأداء المالي، هوامش الأرباح وتصدير ملفات PDF.',
    users: 'إدارة حسابات الموظفين، تحديد الصلاحيات وبيانات تسجيل الدخول.',
    shifts: 'بدء وإنهاء مناوبات العمل، مبيعات الوردية وتقارير التليغرام التلقائية.',
    settings: 'إعدادات النظام العامة، تصميم الفاتورة، اللوغو، وتفاصيل الطابعة.',
    systemControl: 'التحكم في النظام والخروج',
    shiftStatus: 'حالة المناوبة',
    shiftActive: 'نشط',
    shiftInactive: 'غير نشط',
    clockedInAt: 'بدأت في',
    totalSales: 'المبيعات',
    logoutTerminal: 'تسجيل الخروج من النظام',
    appLaunchpad: 'بوابات تشغيل التطبيقات',
    appLaunchpadDesc: 'انقر فوق أي بطاقة لتشغيل محطة العمل الخاصة بها',
    analyticsHub: 'لوحة التحليلات والإحصائيات المالية',
  }
};

export const Dashboard: React.FC = () => {
  const { 
    t, 
    user, 
    isRtl, 
    recentOrders, 
    expenses, 
    language, 
    inventory,
    navigate,
    logout,
    currentShift,
    clockIn,
    clockOut,
    activeTableOrders,
    tables,
    receiptSettings
  } = useAppContext();

  const isManager = user?.role === 'admin' || user?.role === 'super_admin';
  const localD = descTranslations[language as 'en' | 'ku' | 'ar'] || descTranslations.en;

  // Occupied tables gating check
  const occupiedTables = tables.filter(t => t.status === 'occupied' || (activeTableOrders[t.id] && activeTableOrders[t.id].length > 0));
  const hasActiveTables = occupiedTables.length > 0;

  // Shift & Terminal Modal state
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedActionType, setBlockedActionType] = useState<'logout' | 'clockout' | null>(null);
  const [declaredCash, setDeclaredCash] = useState<number | ''>('');
  
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSentSuccessfully, setReportSentSuccessfully] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  const formatDashboardDate = (date: Date) => {
    if (language === 'ku') {
      const kDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
      const kMonths = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
      const day = kDays[date.getDay()];
      const dayNum = date.getDate();
      const month = kMonths[date.getMonth()];
      const year = date.getFullYear();
      return `${day}، ${dayNum} ${month} ${year}`;
    }
    return date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const today = new Date().toLocaleDateString();
  const todayOrders = recentOrders.filter(o => new Date(o.createdAt).toLocaleDateString() === today);
  const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0) || 0;
  const numInvoices = todayOrders.length || 0;
  const todayExpensesItems = expenses.filter(e => new Date(e.date).toLocaleDateString() === today);
  const todayExpenses = todayExpensesItems.reduce((sum, e) => sum + e.amount, 0) || 0;
  
  const stats = [
    {
      label: t('totalPosSalesToday'),
      value: `${todaySales.toLocaleString()} IQD`,
      icon: Banknote,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      label: t('numberOfOfficialInvoices'),
      value: `${numInvoices} ${t('pcs')}`,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      label: t('totalExpensesToday'),
      value: `${todayExpenses.toLocaleString()} IQD`,
      icon: CreditCard,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    }
  ];

  const totalSalesAllTime = recentOrders.reduce((sum, order) => sum + order.total, 0) || 0;
  const daysWithSales = new Set(recentOrders.map(o => new Date(o.createdAt).toLocaleDateString())).size || 1;
  const avgSales = Math.round(totalSalesAllTime / daysWithSales);
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString();
  });
  
  const dailySales = last7Days.map(dateStr => {
    return recentOrders
      .filter(o => new Date(o.createdAt).toLocaleDateString() === dateStr)
      .reduce((sum, order) => sum + order.total, 0);
  });
  
  const maxDailySale = Math.max(...dailySales, 1);
  const todaySalesPercentage = maxDailySale > 0 ? Math.round((todaySales / maxDailySale) * 100) : 0;
  const circleOffset = 264 - (264 * todaySalesPercentage) / 100;

  // Master App Terminal Launchpad Cards Config
  const launchCards = [
    { id: 'reports', icon: BarChart3, label: language === 'ku' ? 'داشبۆرد و ڕاپۆرتەکان' : language === 'ar' ? 'لوحة القيادة والتقارير' : 'Dashboard & Reports', color: 'bg-violet-100 text-violet-900 border-violet-200' },
    { id: 'pos', icon: ShoppingCart, label: t('pos'), color: 'bg-amber-100 text-amber-900 border-amber-200' },
    { id: 'menu', icon: UtensilsCrossed, label: t('menu'), color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    { id: 'tables', icon: Armchair, label: t('tables'), color: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
    { id: 'inventory', icon: PackageOpen, label: t('inventory'), color: 'bg-purple-100 text-purple-900 border-purple-200' },
    { id: 'expenses', icon: ReceiptText, label: t('expenses'), color: 'bg-rose-100 text-rose-900 border-rose-200' },
    { id: 'receipts', icon: FileText, label: t('receipts'), color: 'bg-blue-100 text-blue-900 border-blue-200' },
    { id: 'users', icon: Users, label: t('users'), color: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
    { id: 'shifts', icon: Clock, label: t('shifts') || 'Shifts', color: 'bg-orange-100 text-orange-900 border-orange-200' },
    { id: 'settings', icon: SettingsIcon, label: t('settings'), color: 'bg-natural-bg text-slate-900 border-natural-border' },
  ];

  // Filter based on exact active user role permissions
  const visibleLaunchCards = launchCards.filter(card => {
    if (user?.role === 'super_admin' || user?.role === 'admin') return true;
    return user?.permissions?.includes(card.id) || false;
  });

  // Telegram report dispatcher
  const sendTelegramReport = async (type: 'clockout' | 'logout', cashInput?: number) => {
    const token = receiptSettings?.telegramToken;
    const chatId = receiptSettings?.telegramChatId;

    if (!token || !chatId) {
      setIsSendingReport(true);
      setTimeout(() => {
        setIsSendingReport(false);
        setReportSentSuccessfully(true);
        setTelegramError(isRtl ? 'تێبینى: بۆتی تەلەگرام ڕێکنەخراوە؛ ڕاپۆرتەکە هاوشێوەکرا (بایپاس کرا).' : 'Note: Telegram Bot is not configured; report simulated.');
      }, 1000);
      return;
    }

    setIsSendingReport(true);
    setTelegramError(null);

    try {
      let messageText = '';
      const cafeName = receiptSettings?.cafeName || 'MAS POS';
      const userName = user?.name || 'Staff';
      const timeStr = new Date().toLocaleString();

      if (type === 'clockout') {
        let sales = 0;
        if (currentShift && recentOrders && user) {
          const clockInDate = new Date(currentShift.clockInTime);
          const shiftOrders = recentOrders.filter(o => 
            o.userId === user.id && 
            new Date(o.createdAt).getTime() >= clockInDate.getTime() && 
            o.status === 'completed'
          );
          sales = shiftOrders.reduce((sum, o) => sum + o.total, 0);
        } else {
          sales = currentShift?.totalSales || 0;
        }

        const expected = sales;
        const declared = cashInput !== undefined ? cashInput : (Number(declaredCash) || 0);
        const diff = declared - expected;

        messageText = isRtl
          ? `🔴 کۆتایی دەوام (کلوک ئاوت)\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `🏢 کافێ: ${cafeName}\n` +
            `👤 کارمەند: ${userName}\n` +
            `📅 کات: ${timeStr}\n` +
            `💰 کۆی فرۆش: ${sales.toLocaleString()} IQD\n` +
            `💵 بڕی چاوەڕوانکراو: ${expected.toLocaleString()} IQD\n` +
            `📥 بڕی ڕاگەیەندراو: ${declared.toLocaleString()} IQD\n` +
            `⚖️ جیاوازی: ${diff >= 0 ? '+' : ''}${diff.toLocaleString()} IQD\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `✅ ڕاپۆرتی دەوام بە سەرکەوتوویی نێردرا.`
          : `🔴 SHIFT CLOSED (Clock Out)\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `🏢 Cafe: ${cafeName}\n` +
            `👤 Staff: ${userName}\n` +
            `📅 Time: ${timeStr}\n` +
            `💰 Total Sales: ${sales.toLocaleString()} IQD\n` +
            `💵 Expected Cash: ${expected.toLocaleString()} IQD\n` +
            `📥 Declared Cash: ${declared.toLocaleString()} IQD\n` +
            `⚖️ Discrepancy: ${diff >= 0 ? '+' : ''}${diff.toLocaleString()} IQD\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `✅ Shift report successfully transmitted.`;
      } else {
        messageText = isRtl
          ? `🚪 چوونەدەرەوە لە سیستەم (لۆگ ئاوت)\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `🏢 کافێ: ${cafeName}\n` +
            `👤 بەکارهێنەر: ${userName}\n` +
            `📅 کات: ${timeStr}\n` +
            `📝 تێبینی: کارمەندەکە لە سیستەم هاتە دەرەوە و ڕاپۆرتی چوونەدەرەوەی نارد.\n` +
            `━━━━━━━━━━━━━━━━━━━`
          : `🚪 USER LOGOUT REPORT\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `🏢 Cafe: ${cafeName}\n` +
            `👤 User: ${userName}\n` +
            `📅 Time: ${timeStr}\n` +
            `📝 Note: User safely logged out of the terminal.\n` +
            `━━━━━━━━━━━━━━━━━━━`;
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText
        })
      });

      const data = await response.json();
      if (data.ok) {
        setReportSentSuccessfully(true);
      } else {
        setTelegramError(`Telegram API Error: ${data.description || 'Unknown error'}`);
      }
    } catch (err) {
      setTelegramError(`Network Error: ${(err as Error).message}`);
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="space-y-8 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Header Hero Welcome Panel */}
      <div className="relative bg-natural-surface border border-natural-border p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial-gradient from-natural-accent/5 to-transparent pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">☕</span>
            <h1 className="text-2xl sm:text-3xl font-black text-natural-text font-serif leading-tight">
              {t('welcome')}, {user?.name}
            </h1>
          </div>
          <p className="text-natural-text-secondary text-sm font-medium">
            {t('systemReady')} • {formatDashboardDate(new Date())}
          </p>
        </div>

        {/* Dynamic Shift & System Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Shift status tag */}
          <div className="flex items-center gap-2 bg-natural-bg border border-natural-border px-4 py-2.5 rounded-2xl">
            <span className={`relative flex h-2.5 w-2.5`}>
              {currentShift ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 animate-pulse"></span>
                </>
              )}
            </span>
            <span className="text-xs font-bold text-natural-text-secondary">
              {localD.shiftStatus}: {currentShift ? (
                <span className="text-emerald-600 font-black">{localD.shiftActive}</span>
              ) : (
                <span className="text-amber-600 font-black">{localD.shiftInactive}</span>
              )}
            </span>
          </div>

          {/* Shift trigger button */}
          {currentShift ? (
            <button
              onClick={() => {
                if (hasActiveTables) {
                  setBlockedActionType('clockout');
                  setIsBlockedModalOpen(true);
                } else {
                  setReportSentSuccessfully(false);
                  setTelegramError(null);
                  setIsClockOutModalOpen(true);
                }
              }}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl transition-all shadow-sm active:scale-95 text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock size={16} />
              <span>{t('clockOut') || 'Clock Out'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsClockInModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 font-bold rounded-2xl transition-all shadow-sm active:scale-95 text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <Clock size={16} />
              <span>{t('clockIn') || 'Clock In'}</span>
            </button>
          )}

          {/* Terminal logout button */}
          <button
            onClick={() => {
              if (hasActiveTables) {
                setBlockedActionType('logout');
                setIsBlockedModalOpen(true);
              } else {
                setReportSentSuccessfully(false);
                setTelegramError(null);
                setIsLogoutModalOpen(true);
              }
            }}
            className="px-4 py-2.5 bg-black hover:bg-zinc-950 text-white font-bold rounded-2xl transition-all shadow-sm active:scale-95 text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={16} className="text-rose-400" />
            <span className="hidden sm:inline">{localD.logoutTerminal}</span>
          </button>
        </div>
      </div>

      {/* 2. Premium Grid Launchpad Hub ( خانە خانە ) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-natural-border/60 pb-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-natural-text flex items-center gap-2">
              <Sparkles className="text-natural-accent" size={20} />
              <span>{localD.appLaunchpad}</span>
            </h2>
            <p className="text-xs text-natural-text-tertiary">{localD.appLaunchpadDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleLaunchCards.map((card) => {
            const Icon = card.icon;
            const desc = localD[card.id as keyof typeof localD] || '';
            
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.id)}
                className="group relative bg-natural-surface hover:bg-natural-bg/10 border border-natural-border hover:border-natural-accent rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] active:scale-95"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className={`p-3 rounded-2xl border ${card.color} transition-transform group-hover:scale-110 duration-300`}>
                      <Icon size={22} />
                    </span>
                    <span className="text-natural-text-tertiary transition-transform group-hover:translate-x-1 duration-300">
                      <ChevronRight size={18} className={isRtl ? 'rotate-180' : ''} />
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-natural-text group-hover:text-natural-accent transition-colors">
                      {card.label}
                    </h3>
                    <p className="text-xs text-natural-text-secondary leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- Terminal Shift Control Modals (Migrated from Sidebar for 100% feature coverage) --- */}
      {isClockInModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsClockInModalOpen(false)}>
          <div className="bg-natural-surface rounded-3xl p-8 w-full max-w-md shadow-2xl border border-natural-border" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-natural-text font-serif mb-2">{t('confirmClockIn') || 'Confirm Start Shift'}</h2>
            <p className="text-natural-text-secondary mb-6 text-sm">{t('confirmClockInMessage') || 'Are you sure you want to start your shift now?'}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsClockInModalOpen(false)} className="px-5 py-2.5 text-natural-text-secondary font-bold hover:bg-natural-bg rounded-xl transition-colors">{t('cancel') || 'Cancel'}</button>
              <button onClick={() => { clockIn(); setIsClockInModalOpen(false); }} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">{t('clockIn') || 'Clock In'}</button>
            </div>
          </div>
        </div>
      )}

      {isClockOutModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsClockOutModalOpen(false)}>
          <div className="bg-natural-surface rounded-3xl p-8 w-full max-w-md shadow-2xl border border-natural-border relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
            <h2 className="text-2xl font-black text-natural-text mb-2 flex items-center gap-2">
              <Clock className="text-red-500" />
              {isRtl ? 'کۆتایی هێنان بە دەوام' : 'End Employee Shift'}
            </h2>
            
            {hasActiveTables ? (
              <>
                <div className="flex flex-col items-center p-5 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-center">
                  <AlertTriangle size={36} className="text-rose-500 mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-rose-800 mb-1">
                    {isRtl ? 'ناتوانیت کۆتایی بە دەوام بهێنیت!' : 'Cannot End Shift'}
                  </p>
                  <p className="text-xs text-rose-600 leading-relaxed">
                    {isRtl 
                      ? 'مێزی چالاک یان گیراو لە ژێر چاودێریدایە. پێویستە سەرەتا مێزەکان خاڵی بکرێن یان پسووڵەکانیان دابخرێن.'
                      : 'Active tables exist. Please complete or release all tables first.'
                    }
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {occupiedTables.map(t => (
                      <span key={t.id} className="px-2.5 py-1 rounded-lg bg-natural-surface border border-rose-200 text-rose-600 font-bold text-xs">
                        T{t.number}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsClockOutModalOpen(false)} className="w-full px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:opacity-90 transition-colors shadow-sm">{isRtl ? 'تێگەیشتم' : 'Understood'}</button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {user?.role !== 'waiter' && (
                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">
                      {isRtl ? 'تێکڕای پارەی نێو سندوق (IQD)' : 'Actual Cash in Drawer (IQD)'}
                    </label>
                    <input 
                      type="number" 
                      value={declaredCash} 
                      onChange={e => setDeclaredCash(Number(e.target.value))}
                      placeholder="e.g. 150000"
                      className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-red-500 shadow-sm text-sm font-medium"
                      autoFocus
                    />
                    <p className="text-xs text-natural-text-tertiary mt-1.5">
                      {isRtl 
                        ? 'تکایە بڕی پارەی ناو دەماخە بنووسە بۆ تۆمارکردن.' 
                        : 'Please enter the exact cash amount in the drawer.'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-natural-border">
                  <button 
                    onClick={() => setIsClockOutModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-natural-text-secondary hover:bg-natural-bg transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      clockOut(Number(declaredCash) || 0);
                      setIsClockOutModalOpen(false);
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isRtl ? 'کۆتایی دەوام' : 'Complete Shift'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="bg-natural-surface rounded-3xl p-8 w-full max-w-md shadow-2xl border border-natural-border relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
            <h2 className="text-2xl font-black text-natural-text mb-2 flex items-center gap-2">
              <LogOut className="text-red-500" />
              {isRtl ? 'چوونەدەرەوە لە سیستەم' : 'User Terminal Logout'}
            </h2>
            
            <div className="space-y-6">
              <p className="text-sm text-natural-text-secondary leading-relaxed">
                {isRtl 
                  ? 'ئایا دڵنیایت لە چوونەدەرەوە لەم جۆراوەی کار؟' 
                  : 'Are you sure you want to log out from this user terminal session?'}
              </p>

              <div className="flex justify-end gap-3 pt-4 border-t border-natural-border">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-natural-text-secondary hover:bg-natural-bg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={() => {
                    logout();
                    setIsLogoutModalOpen(false);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {isRtl ? 'چوونەدەرەوە' : 'Log Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBlockedModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsBlockedModalOpen(false)}>
          <div className="bg-natural-surface rounded-3xl p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-rose-100 relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />
            
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5 border border-rose-100 shadow-inner">
              <AlertTriangle size={32} className="animate-pulse" />
            </div>

            <h2 className="text-xl font-black text-natural-text mb-3">
              {blockedActionType === 'logout' 
                ? (isRtl ? 'ناتوانیت بچیتە دەرەوە!' : 'Cannot Log Out')
                : (isRtl ? 'ناتوانیت کۆتایی بە دەوام بهێنیت!' : 'Cannot End Shift')
              }
            </h2>
            
            <p className="text-natural-text-secondary text-sm mb-6 leading-relaxed">
              {isRtl 
                ? (blockedActionType === 'logout'
                    ? 'ناتوانیت لە سیستەم بچیتە دەرەوە (لۆگ ئاوت بکەیت) چونکە هێشتا مێزی چالاک یان گیراو لە سیستەمەکەدا هەیە. تکایە سەرەتا مێزەکان خاڵی بکەرەوە یان پسووڵەکانیان دابخە.'
                    : 'ناتوانیت کۆتایی بە دەوامەکەت بهێنیت (کلوک ئاوت بکەیت) چونکە هێشتا مێزی چالاک یان گیراو لە ژێر چاودێریدایە. پێویستە سەرەتا مێزەکان خاڵی بکرێن یان پسووڵەکانیان دابخرێن.'
                  )
                : (blockedActionType === 'logout'
                    ? 'You cannot log out because there are still active/occupied tables in the system. Please clear or close them first.'
                    : 'You cannot end your shift because there are still active/occupied tables. Please clear or close them first.'
                  )
              }
            </p>

            <div className="bg-natural-bg border border-natural-border rounded-2xl p-4 mb-6">
              <div className="text-xs font-bold text-natural-text-tertiary uppercase tracking-widest mb-3">
                {isRtl ? 'مێزە گیراوەکان' : 'Occupied Tables'}
              </div>
              <div className="flex flex-wrap gap-2.5 justify-center">
                {occupiedTables.map(t => (
                  <div 
                    key={t.id} 
                    className="px-3.5 py-1.5 rounded-xl bg-natural-surface border border-rose-100 text-rose-600 font-black text-sm flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    {isRtl ? `مێزی ${t.number}` : `Table ${t.number}`}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setIsBlockedModalOpen(false)} 
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all shadow-md active:scale-95 text-sm"
            >
              {isRtl ? 'تێگەیشتم' : 'Understood'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
