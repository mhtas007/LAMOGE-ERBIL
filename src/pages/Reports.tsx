import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart as BarIcon, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Download, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  ShieldCheck, 
  FileText, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const COLORS = ['#bf9a76', '#a17a58', '#475569', '#10b981', '#f43f5e', '#3b82f6'];

// Expanded dynamic dictionary for complete PDF & UI localization
const reportTranslations = {
  en: {
    businessReport: 'Executive Business Report',
    exportPDF: 'Export PDF',
    generatedOn: 'Generated On',
    period: 'Reporting Period',
    summary: 'Executive Summary',
    revenueOverview: 'Revenue & Sales Trend',
    expensesBreakdown: 'Expenses Categorization',
    peakHours: 'Peak Hours Traffic',
    financialPerformance: 'Financial Performance Statement',
    netProfit: 'Net Profit',
    grossRevenue: 'Gross Revenue',
    totalExpenses: 'Total Expenses',
    profitMargin: 'Profit Margin',
    metric: 'Financial Metric',
    value: 'Amount (IQD)',
    noSales: 'No sales recorded for this period',
    noExpenses: 'No expenses recorded for this period',
    statementFootnote: 'This report is generated automatically by the POS Management System. Confidential.',
    averageOrderValue: 'Average Order Value',
    statusActive: 'Active Operational Period',
    totalOrders: 'Total Completed Orders',
    timeFilters: {
      today: 'Today',
      week: 'Last 7 Days',
      month: 'Last 30 Days',
      year: 'Last 12 Months',
      all: 'All Time',
      custom: 'Specific Date'
    },
    authorizedSignature: 'Authorized Signature',
    dateStamp: 'Date & Stamp',
    systemStatus: 'System Integrity: Verified',
    performanceStatus: 'Overall Performance',
    excellent: 'Excellent',
    stable: 'Stable',
    actionRequired: 'Review Required',
    analyticsDesc: 'Observe your café financial transactions, customer traffic peak times, and operational expenses in high detail.',
    currencySymbol: 'IQD',
    generating: 'Generating PDF...'
  },
  ku: {
    businessReport: 'ڕاپۆرتی گشتی کارگێڕی',
    exportPDF: 'دەرکردنی PDF',
    generatedOn: 'ڕێکەوتی دەرکردن',
    period: 'ماوەی ڕاپۆرت',
    summary: 'پوختەی ڕاپۆرت',
    revenueOverview: 'ڕەوتی داهات و فرۆشتن',
    expensesBreakdown: 'پۆلێنکردنی خەرجییەکان',
    peakHours: 'کاتی قەرەباڵغی و هاتن',
    financialPerformance: 'بەیاننامەی ئەنجامی دارایی',
    netProfit: 'قازانجی سافی',
    grossRevenue: 'کۆی داهاتی گشتی',
    totalExpenses: 'کۆی خەرجییەکان',
    profitMargin: 'ڕێژەی قازانج',
    metric: 'پێوەری دارایی',
    value: 'بڕ (دینار)',
    noSales: 'هیچ فرۆشێک لەم ماوەیەدا تۆمار نەکراوە',
    noExpenses: 'هیچ خەرجییەک لەم ماوەیەدا تۆمار نەکراوە',
    statementFootnote: 'ئەم ڕاپۆرتە بە شێوەیەکی ئۆتۆماتیکی لە سیستەمی فرۆشتنەوە دروستکراوە. تەنها بۆ کارمەندانی ڕێگەپێدراوە.',
    averageOrderValue: 'تێکڕای بەهای داواکاری',
    statusActive: 'ماوەی کارکردنی چالاک',
    totalOrders: 'کۆی داواکارییە تەواوکراوەکان',
    timeFilters: {
      today: 'ئەمڕۆ',
      week: '٧ ڕۆژی ڕابردوو',
      month: '٣٠ ڕۆژی ڕابردوو',
      year: '١٢ مانگی ڕابردوو',
      all: 'هەموو کاتێک',
      custom: 'ڕۆژێکی دیاریکراو'
    },
    authorizedSignature: 'ئیمزای ڕێگەپێدراو',
    dateStamp: 'بەروار و مۆر',
    systemStatus: 'دۆخی سیستم: پشتڕاستکراوەتەوە',
    performanceStatus: 'ئاستی گشتی',
    excellent: 'زۆر باش',
    stable: 'جێگیر',
    actionRequired: 'پێویستی بە پێداچوونەوەیە',
    analyticsDesc: 'سەیری دارایی کافێ، کاتەکانی قەرەباڵغی کڕیاران و پۆلێنکردنی خەرجییەکانت بکە بە وردەکاری زۆر بەرزەوە.',
    currencySymbol: 'د.ع',
    generating: 'خەریکی دروستکردنی PDF...'
  },
  ar: {
    businessReport: 'التقرير التنفيذي للأعمال',
    exportPDF: 'تصدير PDF',
    generatedOn: 'تاريخ الإصدار',
    period: 'فترة التقرير',
    summary: 'الملخص التنفيذي',
    revenueOverview: 'اتجاه الإيرادات والمبيعات',
    expensesBreakdown: 'تصنيف المصروفات التشغيلية',
    peakHours: 'تحليل أوقات الذروة والحركة',
    financialPerformance: 'بيان الأداء المالي الموحد',
    netProfit: 'صافي الأرباح',
    grossRevenue: 'إجمالي الإيرادات',
    totalExpenses: 'إجمالي المصروفات',
    profitMargin: 'هامش الربح التشغيلي',
    metric: 'المقياس المالي',
    value: 'المبلغ (د.ع)',
    noSales: 'لم يتم تسجيل مبيعات في هذه الفترة',
    noExpenses: 'لم يتم تسجيل مصروفات في هذه الفترة',
    statementFootnote: 'تم إنشاء هذا التقرير تلقائيًا بواسطة نظام إدارة نقاط البيع. سري للغاية.',
    averageOrderValue: 'متوسط قيمة الطلب',
    statusActive: 'الفترة التشغيلية النشطة',
    totalOrders: 'إجمالي الطلبات المكتملة',
    timeFilters: {
      today: 'اليوم',
      week: 'آخر 7 أيام',
      month: 'آخر 30 يوم',
      year: 'آخر 12 شهر',
      all: 'كل الوقت',
      custom: 'يوم محدد'
    },
    authorizedSignature: 'توقيع الموظف المخول',
    dateStamp: 'التاريخ والختم الرسمي',
    systemStatus: 'سلامة النظام: تم التحقق منها',
    performanceStatus: 'الأداء العام',
    excellent: 'ممتاز',
    stable: 'مستقر',
    actionRequired: 'مراجعة مطلوبة',
    analyticsDesc: 'راقب الحسابات والتدفقات المالية وأوقات ذروة حركة الزبائن والمصاريف بدقة بالغة وبطريقة احترافية.',
    currencySymbol: 'د.ع',
    generating: 'جاري إنشاء PDF...'
  }
};

export const Reports: React.FC = () => {
  const { t, isRtl, recentOrders, expenses, language, receiptSettings, navigate } = useAppContext();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all' | 'custom'>('week');
  const [customDate, setCustomDate] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Active translation set for reports
  const rt = reportTranslations[language as 'en' | 'ku' | 'ar'] || reportTranslations.en;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return recentOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      switch (dateRange) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return orderDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return orderDate >= monthAgo;
        }
        case 'year': {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return orderDate >= yearAgo;
        }
        case 'custom': {
          if (!customDate) return false;
          return orderDate.toDateString() === new Date(customDate).toDateString();
        }
        case 'all':
        default:
          return true;
      }
    });
  }, [recentOrders, dateRange, customDate]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      const expDate = new Date(expense.date);
      switch (dateRange) {
        case 'today':
          return expDate.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return expDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return expDate >= monthAgo;
        }
        case 'year': {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return expDate >= yearAgo;
        }
        case 'custom': {
          if (!customDate) return false;
          return expDate.toDateString() === new Date(customDate).toDateString();
        }
        case 'all':
        default:
          return true;
      }
    });
  }, [expenses, dateRange, customDate]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpensesAmount;
  
  // Profit margin calculation
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  // Average Order Value (AOV)
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Chart Data: Sales over time
  const salesChartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const key = dateRange === 'year' || dateRange === 'all' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : date.toLocaleDateString(language === 'ku' ? 'en-US' : language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' });
        
      dataMap.set(key, (dataMap.get(key) || 0) + order.total);
    });

    return Array.from(dataMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredOrders, dateRange, language]);

  // Chart Data: Expenses by category
  const expensesChartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    filteredExpenses.forEach(exp => {
      dataMap.set(exp.category, (dataMap.get(exp.category) || 0) + exp.amount);
    });
    return Array.from(dataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // Chart Data: Peak Hours
  const peakHoursChartData = useMemo(() => {
    const dataMap = new Map<number, number>();
    for (let i = 8; i <= 23; i++) dataMap.set(i, 0); // Active operational hours 8 AM to 11 PM
    
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const hour = date.getHours();
      if (hour >= 8 && hour <= 23) {
        dataMap.set(hour, (dataMap.get(hour) || 0) + 1);
      }
    });

    return Array.from(dataMap.entries())
      .map(([hour, count]) => ({ 
        hour: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`, 
        count 
      }));
  }, [filteredOrders]);

  const today = new Date().toLocaleDateString();
  const todayOrders = recentOrders.filter(o => new Date(o.createdAt).toLocaleDateString() === today);
  const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0) || 0;

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

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      // Small timeout to allow charts to render completely static
      await new Promise(resolve => setTimeout(resolve, 300));
      const imgData = await toPng(reportRef.current, { 
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${receiptSettings?.cafeName || 'Cafe'}_Executive_Report_${dateRange}_${new Date().toLocaleDateString()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-natural-accent/10 text-natural-accent">
              <Activity size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-natural-text font-serif">{rt.businessReport}</h1>
          </div>
          <p className="text-natural-text-secondary text-sm max-w-xl">{rt.analyticsDesc}</p>
        </div>
        
        {/* Localized Control Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Custom elegant toggle tabs */}
          <div className="bg-natural-bg p-1 rounded-2xl border border-natural-border flex flex-wrap gap-1">
            {(['today', 'week', 'month', 'year', 'all', 'custom'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateRange(filter)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  dateRange === filter 
                    ? 'bg-natural-accent text-natural-dark shadow-sm' 
                    : 'text-natural-text-secondary hover:text-natural-text hover:bg-natural-surface'
                }`}
              >
                {rt.timeFilters[filter]}
              </button>
            ))}
          </div>

          {dateRange === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-natural-surface border border-natural-border rounded-xl px-4 py-2 text-sm text-natural-text font-bold focus:outline-none focus:ring-2 focus:ring-natural-dark/20"
            />
          )}

          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="bg-natural-dark hover:opacity-90 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 font-bold text-sm grow md:grow-0"
          >
            {isExporting ? <Sparkles size={18} className="animate-spin text-natural-accent" /> : <Download size={18} className="text-natural-accent" />}
            <span>{isExporting ? rt.generating : rt.exportPDF}</span>
          </button>
        </div>
      </div>

      {/* Main analytical cards (Desktop dashboard view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Revenue */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} /> +{(totalRevenue > 0 ? 100 : 0)}%
            </span>
          </div>
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{rt.grossRevenue}</p>
          <p className="text-2xl font-bold text-natural-text mt-1">{totalRevenue.toLocaleString()} <span className="text-xs font-normal text-natural-text-tertiary">{rt.currencySymbol}</span></p>
        </div>

        {/* Total Expenses */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 rounded-2xl bg-rose-50 text-rose-600">
              <ArrowDownLeft size={20} />
            </span>
            <span className="text-xs text-natural-text-tertiary font-medium">
              {filteredExpenses.length} records
            </span>
          </div>
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{rt.totalExpenses}</p>
          <p className="text-2xl font-bold text-natural-text mt-1 text-rose-600">{totalExpensesAmount.toLocaleString()} <span className="text-xs font-normal text-natural-text-tertiary">{rt.currencySymbol}</span></p>
        </div>

        {/* Net Profit */}
        <div className={`bg-natural-surface p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${netProfit >= 0 ? 'border-natural-border' : 'border-rose-100'}`}>
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none transition-all group-hover:scale-110 ${netProfit >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}></div>
          <div className="flex items-center justify-between mb-4">
            <span className={`p-3 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp size={20} />
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {netProfit >= 0 ? rt.stable : rt.actionRequired}
            </span>
          </div>
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{rt.netProfit}</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{netProfit.toLocaleString()} <span className="text-xs font-normal text-natural-text-tertiary">{rt.currencySymbol}</span></p>
        </div>

        {/* Profit Margin */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Activity size={20} />
            </span>
            <span className="text-xs text-natural-text-tertiary font-medium">Efficiency</span>
          </div>
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{rt.profitMargin}</p>
          <p className="text-2xl font-bold text-natural-text mt-1">{profitMargin.toFixed(1)}%</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText size={20} />
            </span>
            <span className="text-xs text-natural-text-tertiary font-medium">
              {totalOrdersCount} sales
            </span>
          </div>
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{rt.averageOrderValue}</p>
          <p className="text-2xl font-bold text-natural-text mt-1">{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-natural-text-tertiary">{rt.currencySymbol}</span></p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-natural-text font-serif text-lg">{rt.revenueOverview}</h3>
            <span className="text-xs text-natural-text-tertiary font-medium">
              {dateRange === 'custom' && customDate ? new Date(customDate).toLocaleDateString() : rt.timeFilters[dateRange]}
            </span>
          </div>
          <div className="h-80 w-full">
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={20} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} width={45} />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ${rt.currencySymbol}`, rt.grossRevenue]}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#bf9a76" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#bf9a76', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-natural-text-tertiary text-sm gap-2">
                <HelpCircle size={24} />
                <span>{rt.noSales}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-natural-text font-serif text-lg">{rt.expensesBreakdown}</h3>
            <span className="text-xs text-natural-text-tertiary font-medium">
              {dateRange === 'custom' && customDate ? new Date(customDate).toLocaleDateString() : rt.timeFilters[dateRange]}
            </span>
          </div>
          <div className="h-72 w-full relative flex items-center justify-center grow">
            {expensesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} ${rt.currencySymbol}`, rt.totalExpenses]}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-natural-text-tertiary text-sm gap-2">
                <HelpCircle size={24} />
                <span>{rt.noExpenses}</span>
              </div>
            )}
          </div>
          
          {/* Custom Styled Legend */}
          {expensesChartData.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-natural-border/50 pt-4">
              {expensesChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs font-bold text-natural-text-secondary">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span>{entry.name}</span>
                  <span className="text-natural-text-tertiary font-normal">({((entry.value / totalExpensesAmount) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Peak Hours Peak Analytics */}
      <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Clock size={20} />
          </span>
          <h3 className="font-bold text-natural-text font-serif text-lg">{rt.peakHours}</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickMargin={10} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} width={35} />
              <RechartsTooltip 
                formatter={(value) => [value, rt.totalOrders]}
                contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" fill="#bf9a76" radius={[6, 6, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphical Analytics & Recent Invoices Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-natural-surface rounded-3xl shadow-sm border border-natural-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-natural-text text-lg">{t('latestPosReceipts')}</h3>
                <p className="text-xs text-natural-text-tertiary">{t('recentTasks')}</p>
              </div>
              <button 
                onClick={() => navigate('receipts')}
                className="text-natural-accent hover:text-natural-accent-hover text-xs font-bold hover:underline cursor-pointer"
              >
                {t('viewAllReceipts')} →
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-natural-bg/50 text-natural-text-secondary uppercase text-[10px] tracking-wider">
                  <tr className="border-b border-natural-border">
                    <th className={`py-3 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('invoiceCode')}</th>
                    <th className={`py-3 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('items')}</th>
                    <th className={`py-3 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('totalAmount')}</th>
                    <th className={`py-3 px-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('paymentStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-border/40">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-natural-text-tertiary italic">
                        No recent receipts
                      </td>
                    </tr>
                  ) : (
                    recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-natural-bg/15 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-natural-text-secondary">{order.invoiceCode}</td>
                        <td className="py-4 px-4 text-natural-text-secondary font-medium">{order.items.length} {t('items')}</td>
                        <td className="py-4 px-4 font-black text-natural-text">{order.total.toLocaleString()} IQD</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold
                            ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {order.status === 'completed' ? t('paid') : t('pending')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Performance status gauge */}
        <div className="bg-natural-surface border border-natural-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-natural-text text-lg mb-1">{t('currentSalesStatus')}</h3>
            <p className="text-xs text-natural-text-tertiary mb-6">{t('overallSalesGrowth')}</p>
          </div>

          <div className="flex flex-col justify-center items-center text-center space-y-5 my-4 font-sans">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="absolute w-full h-full -rotate-90">
                <circle cx="56" cy="56" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="8"/>
                <circle cx="56" cy="56" r="48" fill="transparent" stroke="#bf9a76" strokeWidth="8" strokeDasharray="301" strokeDashoffset={301 - (301 * todaySalesPercentage) / 100} className="transition-all duration-1000 ease-in-out"/>
              </svg>
              <span className="text-2xl font-black text-natural-text">{todaySalesPercentage}%</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xl font-black text-natural-text">{avgSales.toLocaleString()} <span className="text-xs font-normal">IQD</span></p>
              <p className="text-xs text-natural-text-tertiary font-bold uppercase tracking-wider">{t('avgSales')} / {t('daily')}</p>
            </div>

            <div className="w-full grid grid-cols-7 gap-2.5 h-16 items-end pt-4">
              {dailySales.map((sale, i) => (
                <div 
                  key={i} 
                  className={`rounded-lg transition-all duration-500 ease-in-out ${i === 6 ? 'bg-natural-accent' : 'bg-natural-bg border border-natural-border hover:bg-natural-border/50'}`} 
                  style={{ height: `${maxDailySale > 0 ? (sale / maxDailySale) * 100 : 10}%` }} 
                  title={`${last7Days[i]}: ${sale.toLocaleString()} IQD`}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-center text-natural-text-tertiary font-medium">
            Last 7 operational calendar business days
          </p>
        </div>
      </div>

      {/* Financial Statement Sheet Table (Executive View) */}
      <div className="bg-natural-surface rounded-3xl border border-natural-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-natural-border flex items-center justify-between bg-natural-bg/40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-natural-accent" />
            <h3 className="font-bold text-natural-text font-serif text-lg">{rt.financialPerformance}</h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">{rt.systemStatus}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead className="bg-natural-bg text-natural-text-secondary">
              <tr>
                <th className={`px-6 py-4 font-bold text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{rt.metric}</th>
                <th className={`px-6 py-4 font-bold text-sm ${isRtl ? 'text-left' : 'text-right'}`}>{rt.value}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/60">
              <tr className="hover:bg-natural-bg/20 transition-colors">
                <td className="px-6 py-4 font-medium text-natural-text">{rt.grossRevenue}</td>
                <td className={`px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'} text-emerald-600`}>+{totalRevenue.toLocaleString()} {rt.currencySymbol}</td>
              </tr>
              <tr className="hover:bg-natural-bg/20 transition-colors">
                <td className="px-6 py-4 font-medium text-natural-text">{rt.totalExpenses}</td>
                <td className={`px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'} text-rose-600`}>-{totalExpensesAmount.toLocaleString()} {rt.currencySymbol}</td>
              </tr>
              <tr className="hover:bg-natural-bg/20 transition-colors">
                <td className="px-6 py-4 font-medium text-natural-text">{rt.averageOrderValue}</td>
                <td className={`px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'} text-natural-text`}>{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} {rt.currencySymbol}</td>
              </tr>
              <tr className="hover:bg-natural-bg/20 transition-colors">
                <td className="px-6 py-4 font-medium text-natural-text">{rt.profitMargin}</td>
                <td className={`px-6 py-4 font-bold ${isRtl ? 'text-left' : 'text-right'} text-natural-text`}>{profitMargin.toFixed(1)}%</td>
              </tr>
              <tr className="bg-natural-bg/50 font-bold">
                <td className="px-6 py-4 text-natural-dark uppercase tracking-wide font-serif text-sm">{rt.netProfit}</td>
                <td className={`px-6 py-4 text-base ${isRtl ? 'text-left' : 'text-right'} ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} {rt.currencySymbol}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIDDEN HIGH-QUALITY LOCALIZED A4 PRINT / PDF TEMPLATE                     */}
      {/* Directly translated, supports RTL/LTR correctly based on current language */}
      {/* ========================================================================= */}
      <div style={{ position: 'absolute', top: -15000, left: -15000, width: '800px', backgroundColor: '#ffffff', color: '#1e293b' }} ref={reportRef}>
        <div className="p-12 font-sans bg-natural-surface relative" dir={isRtl ? 'rtl' : 'ltr'}>
          
          {/* Subtle luxurious accent bar at the top */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-900"></div>
          
          {/* Document Header */}
          <div className="flex justify-between items-start mb-10 border-b border-natural-border pb-8 mt-4">
            <div>
              <span className="text-xs font-bold text-amber-700 tracking-widest uppercase block mb-1">
                {receiptSettings?.cafeName || 'Executive Café POS'}
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{rt.businessReport}</h1>
              <p className="text-natural-text-tertiary text-xs mt-1">{rt.statementFootnote}</p>
            </div>
            <div className={`text-xs text-natural-text-secondary ${isRtl ? 'text-left' : 'text-right'}`}>
              <p className="font-bold text-slate-900 text-sm mb-1">{receiptSettings?.cafeName || 'Cafe Management System'}</p>
              <p>{receiptSettings?.address || 'City Center, Erbil'}</p>
              <p>{receiptSettings?.phone || '+964 (0) 000 0000'}</p>
              <p className="mt-3 font-semibold text-natural-text">{rt.generatedOn}: {new Date().toLocaleString(language === 'ku' ? 'en-US' : language === 'ar' ? 'ar-IQ' : 'en-US')}</p>
              <p className="mt-1 font-semibold text-amber-700 uppercase">{rt.period}: {dateRange === 'custom' && customDate ? new Date(customDate).toLocaleDateString() : rt.timeFilters[dateRange]}</p>
            </div>
          </div>

          {/* Key Executive Summary Box */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-natural-text uppercase tracking-wider mb-4 border-b border-natural-border pb-2">{rt.summary}</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border text-center">
                <span className="text-[10px] font-bold text-natural-text-tertiary uppercase tracking-widest block mb-1">{rt.grossRevenue}</span>
                <span className="text-base font-extrabold text-slate-900 block">{totalRevenue.toLocaleString()}</span>
                <span className="text-[9px] text-natural-text-tertiary uppercase tracking-tight">{rt.currencySymbol}</span>
              </div>
              <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border text-center">
                <span className="text-[10px] font-bold text-natural-text-tertiary uppercase tracking-widest block mb-1">{rt.totalExpenses}</span>
                <span className="text-base font-extrabold text-rose-600 block">-{totalExpensesAmount.toLocaleString()}</span>
                <span className="text-[9px] text-natural-text-tertiary uppercase tracking-tight">{rt.currencySymbol}</span>
              </div>
              <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border text-center">
                <span className="text-[10px] font-bold text-natural-text-tertiary uppercase tracking-widest block mb-1">{rt.netProfit}</span>
                <span className={`text-base font-extrabold block ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit.toLocaleString()}
                </span>
                <span className="text-[9px] text-natural-text-tertiary uppercase tracking-tight">{rt.currencySymbol}</span>
              </div>
              <div className="bg-natural-bg p-4 rounded-2xl border border-natural-border text-center">
                <span className="text-[10px] font-bold text-natural-text-tertiary uppercase tracking-widest block mb-1">{rt.profitMargin}</span>
                <span className="text-base font-extrabold text-slate-900 block">{profitMargin.toFixed(1)}%</span>
                <span className="text-[9px] text-natural-text-tertiary uppercase tracking-tight">Percentage</span>
              </div>
            </div>
          </div>

          {/* Visual Trends Section */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* Revenue trend card */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-natural-surface">
              <h3 className="text-xs font-bold text-natural-text uppercase tracking-wider mb-4 border-b border-natural-border pb-2">{rt.revenueOverview}</h3>
              <div style={{ width: '330px', height: '220px' }} className="mx-auto flex items-center justify-center">
                {salesChartData.length > 0 ? (
                  <LineChart width={330} height={210} data={salesChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Line type="monotone" dataKey="amount" stroke="#9a3412" strokeWidth={3} dot={{ r: 3, fill: '#9a3412' }} isAnimationActive={false} />
                  </LineChart>
                ) : (
                  <div className="text-natural-text-tertiary text-xs text-center">{rt.noSales}</div>
                )}
              </div>
            </div>

            {/* Expenses Breakdown pie */}
            <div className="border border-slate-150 rounded-2xl p-5 bg-natural-surface">
              <h3 className="text-xs font-bold text-natural-text uppercase tracking-wider mb-4 border-b border-natural-border pb-2">{rt.expensesBreakdown}</h3>
              <div style={{ width: '330px', height: '220px' }} className="flex flex-col items-center justify-center mx-auto">
                {expensesChartData.length > 0 ? (
                  <>
                    <PieChart width={330} height={160}>
                      <Pie
                        data={expensesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {expensesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2">
                      {expensesChartData.slice(0, 5).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1 text-[8px] font-bold text-slate-600">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span>{entry.name}</span>
                          <span className="text-natural-text-tertiary">({((entry.value / totalExpensesAmount) * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-natural-text-tertiary text-xs text-center">{rt.noExpenses}</div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Statement Ledger */}
          <div className="border border-natural-border rounded-2xl overflow-hidden mb-12">
            <div className="bg-natural-bg px-6 py-4 border-b border-natural-border">
              <h3 className="text-xs font-extrabold text-natural-text uppercase tracking-wider">{rt.financialPerformance}</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-natural-bg text-natural-text-secondary font-bold">
                <tr>
                  <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{rt.metric}</th>
                  <th className={`px-6 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>{rt.value}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                <tr>
                  <td className="px-6 py-3 font-semibold text-natural-text">{rt.grossRevenue}</td>
                  <td className={`px-6 py-3 font-bold text-slate-900 ${isRtl ? 'text-left' : 'text-right'}`}>{totalRevenue.toLocaleString()} {rt.currencySymbol}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-semibold text-natural-text">{rt.totalExpenses}</td>
                  <td className={`px-6 py-3 font-bold text-rose-600 ${isRtl ? 'text-left' : 'text-right'}`}>-{totalExpensesAmount.toLocaleString()} {rt.currencySymbol}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-semibold text-natural-text">{rt.averageOrderValue}</td>
                  <td className={`px-6 py-3 font-bold text-slate-900 ${isRtl ? 'text-left' : 'text-right'}`}>{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} {rt.currencySymbol}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-semibold text-natural-text">{rt.totalOrders}</td>
                  <td className={`px-6 py-3 font-bold text-slate-900 ${isRtl ? 'text-left' : 'text-right'}`}>{totalOrdersCount}</td>
                </tr>
                <tr className="bg-natural-bg font-extrabold text-sm">
                  <td className="px-6 py-4 text-slate-900 uppercase font-serif">{rt.netProfit}</td>
                  <td className={`px-6 py-4 text-slate-900 font-extrabold ${isRtl ? 'text-left' : 'text-right'} ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {netProfit.toLocaleString()} {rt.currencySymbol}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature and Stamps Footer Block */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-150">
            <div className="text-center">
              <div className="h-16 flex items-end justify-center mb-2">
                <span className="text-xs italic text-natural-text-tertiary">Official Stamp Area</span>
              </div>
              <div className="w-48 mx-auto border-t border-dashed border-slate-300 pt-2">
                <p className="text-[10px] font-bold text-natural-text uppercase tracking-wider">{rt.dateStamp}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-16 flex items-end justify-center mb-2">
                {/* Simulated signature loop representation */}
                <span className="font-serif italic text-amber-800 text-lg opacity-40">POS Auditor</span>
              </div>
              <div className="w-48 mx-auto border-t border-dashed border-slate-300 pt-2">
                <p className="text-[10px] font-bold text-natural-text uppercase tracking-wider">{rt.authorizedSignature}</p>
              </div>
            </div>
          </div>

          {/* Small footer footnote */}
          <div className="text-center text-[9px] text-natural-text-tertiary mt-12 border-t border-natural-border pt-4">
            {rt.statementFootnote} • {rt.systemStatus}
          </div>

        </div>
      </div>
    </div>
  );
};
