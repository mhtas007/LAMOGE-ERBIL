import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Settings as SettingsIcon, Store, Receipt as ReceiptIcon, Bell, Shield, Database, AlertTriangle, Download, Upload, Trash2, Printer, Send, Sparkles, X, Wifi, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Receipt } from '../components/Receipt';
import { PrinterService } from '../services/printerService';

export const Settings: React.FC = () => {
  const { t, isRtl, receiptSettings, updateReceiptSettings, resetExpenses, resetSystemData } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', icon: Store, label: t('cafeInformation'), desc: 'Manage your cafe identity and basic info' },
    { id: 'printer', icon: Printer, label: t('printerSettings'), desc: 'Configure receipts and hardware' },
    { id: 'telegram', icon: Send, label: isRtl ? 'ڕێکخستنی تەلەگرام' : 'Telegram Integration', desc: 'Send shift & session reports to Telegram' },
    { id: 'backup', icon: Database, label: t('backupRestore'), desc: 'Export or import your data securely' },
    { id: 'danger', icon: AlertTriangle, label: t('dangerZone'), desc: 'Irreversible administrative actions' },
  ];

  const [formData, setFormData] = useState(receiptSettings);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestStatus, setTelegramTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [printerTestStatus, setPrinterTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [safetyExpenseText, setSafetyExpenseText] = useState('');
  const [safetySystemText, setSafetySystemText] = useState('');
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);

  useEffect(() => {
    setFormData(receiptSettings);
  }, [receiptSettings]);

  const handleTestNetworkPrinter = async () => {
    const isIpConfigured = Boolean(
      formData.printerIp && 
      formData.printerIp.trim() !== '' && 
      formData.printerIp.trim() !== '192.168.1.100'
    );

    if (!isIpConfigured) {
      setPrinterTestStatus({
        success: true,
        message: isRtl 
          ? 'چاپی ئاسایی (Browser/AirPrint) چالاکە: پەنجەرەی چاپی تاقیکاری دەکرێتەوە...' 
          : 'Standard browser printing active: opening test print dialog...',
      });
      setTimeout(() => {
        window.print();
      }, 100);
      return;
    }


    setIsTestingPrinter(true);
    setPrinterTestStatus(null);

    try {
      // Save current settings first
      await updateReceiptSettings(formData);

      const result = await PrinterService.testPrinter({
        printerIp: formData.printerIp.trim(),
        port: Number(formData.printerPort) || (formData.printerProtocol === 'raw_escpos_bridge' ? 3001 : 80),
        protocol: formData.printerProtocol || 'epson_epos',
        paperWidth: formData.paperWidth || '80mm',
        autoCut: formData.autoCut !== false,
        openCashDrawer: Boolean(formData.openCashDrawer),
      });

      setPrinterTestStatus({
        success: true,
        message: isRtl
          ? `پەیوەندی لەگەڵ پرینتەر (${result.printerIp}) سەرکەوتووبوو! کاتی وەڵامدانەوە: ${result.durationMs}ms`
          : `Connected to printer (${result.printerIp}) successfully! Latency: ${result.durationMs}ms`,
      });
    } catch (err: any) {
      setPrinterTestStatus({
        success: false,
        message: err.message || (isRtl ? 'نەتوانرا پەیوەندی بە پرینتەرەوە بکرێت' : 'Failed to connect to printer'),
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'taxRate' ? Number(value) : value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleTestTelegram = async () => {
    if (!formData.telegramToken || !formData.telegramChatId) {
      setTelegramTestStatus({
        success: false,
        message: isRtl ? 'تکایە سەرەتا تۆکن و چات ئایدی بنووسە!' : 'Please enter Telegram Bot Token and Chat ID first!'
      });
      return;
    }
    
    setIsTestingTelegram(true);
    setTelegramTestStatus(null);
    try {
      const text = isRtl 
        ? `🔔 تاقیکردنەوەی پەیوەندی تەلەگرام\n━━━━━━━━━━━━━━━━━━━\n✅ پەیوەندی نێوان سیستەمی MAS POS و تەلەگرامەکەت سەرکەوتووبوو!\n💼 خاوەن کار: ڕاپۆرتەکانی دەوام لێرە دەنێردرێن.`
        : `🔔 Telegram Integration Test\n━━━━━━━━━━━━━━━━━━━\n✅ Connection between MAS POS and your Telegram was successful!\n💼 Owner: Shift and logout reports will be sent here.`;
      
      const response = await fetch(`https://api.telegram.org/bot${formData.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: formData.telegramChatId,
          text: text
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setTelegramTestStatus({
          success: true,
          message: isRtl ? 'نامەی تاقیکردنەوە بە سەرکەوتوویی نێردرا بۆ مۆبایلەکەت!' : 'Test message sent successfully to your device!'
        });
      } else {
        setTelegramTestStatus({
          success: false,
          message: `Telegram Error: ${data.description || 'Unknown error'}`
        });
      }
    } catch (err) {
      setTelegramTestStatus({
        success: false,
        message: `Error: ${(err as Error).message}`
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await updateReceiptSettings(formData);
      setSaveStatus({
        success: true,
        message: isRtl
          ? 'ڕێکخستنەکان بە سەرکەوتوویی لە فایربەیس سەیڤ کران!'
          : 'Settings successfully saved to Firebase!'
      });
      setTimeout(() => {
        setSaveStatus(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error saving settings to Firebase:', err);
      setSaveStatus({
        success: false,
        message: isRtl
          ? `هەڵە لە سەیڤکردنی فایربەیس: ${err?.message || 'پەیوەندی نییە'}`
          : `Failed to save to Firebase: ${err?.message || 'Connection error'}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="space-y-6 max-w-7xl mx-auto pb-20 print:hidden">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('settings')}</h1>
        <p className="text-natural-text-secondary text-sm">Configure system preferences and application settings.</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar tabs */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left group
                  ${isActive ? 'bg-natural-surface shadow-sm border border-natural-border' : 'hover:bg-natural-surface/50 border border-transparent'}
                `}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-natural-dark text-natural-dark-text' : 'bg-natural-bg text-natural-text-secondary group-hover:text-natural-dark'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className={`font-bold ${isActive ? 'text-natural-text' : 'text-natural-text-secondary group-hover:text-natural-text'}`}>{tab.label}</div>
                  <div className="text-xs text-natural-text-tertiary mt-0.5 line-clamp-1">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 w-full bg-natural-surface rounded-2xl sm:rounded-[2rem] shadow-sm border border-natural-border p-8 min-h-[500px]">
          
          {activeTab === 'general' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 sm:p-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-natural-text">{t('cafeInformation')}</h2>
                <p className="text-natural-text-secondary mt-1 text-sm">This information is displayed on your receipts and reports.</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-natural-text mb-2">{t('cafeName')}</label>
                  <input type="text" name="cafeName" value={formData.cafeName} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm" />
                </div>
                

                <div>
                  <label className="block text-sm font-bold text-natural-text mb-2">{t('address')}</label>
                  <textarea rows={3} name="address" value={formData.address} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">{t('currency')}</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm appearance-none cursor-pointer">
                      <option value="IQD">IQD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">{t('taxRate')} (%)</label>
                    <input type="number" name="taxRate" value={formData.taxRate} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm" />
                  </div>
                </div>

                {saveStatus && (
                  <div
                    className={`p-3.5 rounded-xl border mt-4 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                      saveStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {saveStatus.success ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{saveStatus.message}</span>
                  </div>
                )}

                <div className="pt-6 mt-6 border-t border-natural-border/60 flex justify-end">
                  <button 
                    disabled={isSaving}
                    onClick={handleSave} 
                    className="bg-natural-dark hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{isRtl ? 'سەیڤ دەکرێت...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{t('saveChanges')}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="flex flex-col xl:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-natural-text">{t('printerSettings')}</h2>
                    <p className="text-natural-text-secondary mt-1 text-sm">Configure how your receipts look and behave.</p>
                  </div>
                  <button onClick={() => setShowPrinterSetup(true)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    {isRtl ? 'ڕێنماییەکانی پرینتەر' : 'Printer Setup Guide'}
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">
                      {isRtl ? 'لۆگۆی سەر پسوولە' : 'Receipt Logo'}
                    </label>
                    
                    {formData.logo ? (
                      <div className="bg-natural-surface rounded-2xl p-4 border border-natural-border flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                        <div className="w-20 h-20 bg-natural-bg rounded-xl border border-natural-border overflow-hidden flex items-center justify-center shrink-0">
                          <img src={formData.logo} alt="Cafe Logo" className="w-full h-full object-contain grayscale" />
                        </div>
                        <div className="grow space-y-1.5 text-center sm:text-left">
                          <p className="text-xs font-bold text-natural-text-secondary">
                            {formData.logo.startsWith('data:') ? (isRtl ? 'وێنەی لۆگۆی بارکراو' : 'Uploaded Custom Logo Image') : (isRtl ? 'لینکی لۆگۆ' : 'Logo Link URL')}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 transition-all"
                            >
                              {isRtl ? 'سڕینەوەی لۆگۆ' : 'Remove Logo'}
                            </button>
                            <label className="px-3 py-1.5 bg-natural-bg hover:bg-natural-border/35 text-natural-text rounded-lg text-xs font-bold border border-natural-border/60 cursor-pointer transition-all">
                              {isRtl ? 'گۆڕینی لۆگۆ' : 'Replace Image'}
                              <input type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-natural-border hover:border-natural-accent rounded-2xl p-6 text-center cursor-pointer hover:bg-natural-bg/30 transition-all relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoFileChange} 
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        />
                        <Upload size={32} className="mx-auto text-natural-text-tertiary mb-2" />
                        <p className="text-xs text-natural-text-secondary font-bold">
                          {isRtl ? 'کلیک بکە یان وێنەی لۆگۆ ڕابکێشە ناو ئەم چوارچێوەیە' : 'Click to select or drag and drop a logo image'}
                        </p>
                        <p className="text-[10px] text-natural-text-tertiary mt-1">PNG, JPG (Optimal: square aspect ratio, light/dark contrast)</p>
                      </div>
                    )}

                    {/* Direct URL input fallback */}
                    <div className="mt-3">
                      <label className="block text-[10px] font-bold text-natural-text-tertiary mb-1">
                        {isRtl ? 'یاخود بەستەری ڕاستەوخۆ (URL) لۆگۆ بنووسە' : 'Or enter a direct logo image URL'}
                      </label>
                      <input 
                        type="url" 
                        name="logo"
                        placeholder="https://example.com/logo.png"
                        value={formData.logo?.startsWith('data:') ? '' : (formData.logo || '')} 
                        onChange={handleChange} 
                        className="w-full bg-natural-surface border border-natural-border rounded-xl py-2 px-3.5 focus:outline-none focus:border-natural-dark text-xs" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">Receipt Header Text</label>
                    <textarea rows={2} name="headerText" value={formData.headerText || ''} onChange={handleChange} placeholder="e.g. Welcome to our Cafe!" className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm resize-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">Receipt Footer Text</label>
                    <textarea rows={2} name="footerText" value={formData.footerText || ''} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm resize-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-natural-text mb-2">Receipt Print Language</label>
                    <select name="receiptLanguage" value={formData.receiptLanguage || 'en'} onChange={handleChange} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm appearance-none cursor-pointer">
                      <option value="en">English</option>
                      <option value="ku">Kurdish / كوردي</option>
                      <option value="ar">Arabic / عربي</option>
                    </select>
                  </div>

                  {/* Network Hardware Section */}
                  <div className="pt-6 border-t border-natural-border/60">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-natural-text flex items-center gap-2">
                          <Wifi size={18} className="text-natural-accent" />
                          {isRtl ? 'ڕێکخستنی پرینتەری نێتۆرک و لۆکاڵ' : 'Local Network Printer (Static IP)'}
                        </h4>
                        <p className="text-xs text-natural-text-secondary mt-0.5">
                          {isRtl
                            ? 'بەستنەوەی پرینتەری گەرمی بەبێ پەنجەرەی Safari (Silent Background Print لەسەر iPad)'
                            : 'Direct thermal receipt printing over Wi-Fi/Ethernet without browser dialogs on iPad'}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {formData.silentPrint !== false ? 'Silent Mode Active' : 'Native Mode'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-natural-text mb-1.5 flex items-center justify-between">
                          <span>{isRtl ? 'ئایپی پرینتەر (Printer IP)' : 'Printer Static IP Address'}</span>
                          <span className="text-[11px] font-normal text-natural-text-tertiary">
                            {isRtl ? '(بە بەتاڵی جێبهێڵە بۆ چاپی ئاسایی)' : '(Leave empty for browser print)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          name="printerIp"
                          value={formData.printerIp || ''}
                          onChange={handleChange}
                          placeholder={isRtl ? "بە بەتاڵی جێبهێڵە یان 192.168.1.36" : "Leave empty or 192.168.1.100"}
                          className="w-full bg-natural-surface border border-natural-border rounded-xl py-2.5 px-3.5 text-sm font-mono focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm"
                        />
                        <p className="text-[11px] text-natural-text-tertiary mt-1.5">
                          {isRtl 
                            ? '💡 ئەگەر ئایپی نەنووسیت، سیستمەکە پەنجەرەی فەرمی چاپی ئایپاد/کۆمپیوتەر بەکاردەهێنێت کە لەسەر هەموو پرینتەرێک کار دەکات.' 
                            : '💡 If left empty, POS uses the standard iPad/Windows print window without network errors.'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-natural-text mb-1.5">
                          {isRtl ? 'پۆرت (Port)' : 'Port'}
                        </label>
                        <input
                          type="number"
                          name="printerPort"
                          value={formData.printerPort || (formData.printerProtocol === 'raw_escpos_bridge' ? 3001 : 80)}
                          onChange={handleChange}
                          placeholder="80 or 3001"
                          className="w-full bg-natural-surface border border-natural-border rounded-xl py-2.5 px-3.5 text-sm font-mono focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-natural-text mb-1.5">
                          {isRtl ? 'پرۆتۆکۆڵی پرینتەر (Protocol)' : 'Printing Protocol / SDK'}
                        </label>
                        <select
                          name="printerProtocol"
                          value={formData.printerProtocol || 'epson_epos'}
                          onChange={handleChange}
                          className="w-full bg-natural-surface border border-natural-border rounded-xl py-2.5 px-3.5 text-xs font-medium focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm cursor-pointer"
                        >
                          <option value="epson_epos">Epson ePOS-Print (Direct LAN HTTP - Port 80/8008)</option>
                          <option value="star_webprnt">Star Micronics WebPRNT (Direct LAN HTTP)</option>
                          <option value="raw_escpos_bridge">ESC/POS Micro-Bridge (Port 3001 &gt; Port 9100)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-natural-text mb-1.5">
                          {isRtl ? 'قەبارەی کاغەز (Paper Width)' : 'Paper Width'}
                        </label>
                        <select
                          name="paperWidth"
                          value={formData.paperWidth || '80mm'}
                          onChange={handleChange}
                          className="w-full bg-natural-surface border border-natural-border rounded-xl py-2.5 px-3.5 text-xs font-medium focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm cursor-pointer"
                        >
                          <option value="80mm">80mm (Standard 3-inch thermal)</option>
                          <option value="58mm">58mm (Small 2-inch thermal)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-5">
                      <label className="flex items-center gap-3 bg-natural-bg p-3.5 rounded-xl border border-natural-border cursor-pointer hover:border-natural-accent transition-colors">
                        <input
                          type="checkbox"
                          name="silentPrint"
                          checked={formData.silentPrint !== false}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 accent-natural-dark cursor-pointer rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-natural-text">
                            {isRtl ? 'پرینتی بێدەنگ (Silent Background Printing)' : 'Enable Silent Background Printing'}
                          </span>
                          <span className="text-[11px] text-natural-text-tertiary">
                            {isRtl
                              ? 'ڕاستەوخۆ دەنێردرێت بۆ پرینتەری نێتۆرک بەبێ کردنەوەی پەنجەرەی چاپ لەسەر iPad'
                              : 'Sends print jobs silently in background without iOS print popup'}
                          </span>
                        </div>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="flex items-center gap-3 bg-natural-bg p-3 rounded-xl border border-natural-border cursor-pointer hover:border-natural-accent transition-colors">
                          <input
                            type="checkbox"
                            name="autoCut"
                            checked={formData.autoCut !== false}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 accent-natural-dark cursor-pointer rounded"
                          />
                          <span className="text-xs font-bold text-natural-text">
                            {isRtl ? 'بڕینی خۆکاری کاغەز (Auto-Cut)' : 'Auto-Cut Paper'}
                          </span>
                        </label>

                        <label className="flex items-center gap-3 bg-natural-bg p-3 rounded-xl border border-natural-border cursor-pointer hover:border-natural-accent transition-colors">
                          <input
                            type="checkbox"
                            name="openCashDrawer"
                            checked={formData.openCashDrawer || false}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 accent-natural-dark cursor-pointer rounded"
                          />
                          <span className="text-xs font-bold text-natural-text">
                            {isRtl ? 'کردنەوەی سندووقی پارە (Open Drawer)' : 'Kick Cash Drawer'}
                          </span>
                        </label>
                      </div>

                      <label className="flex items-center gap-3 bg-natural-bg p-3.5 rounded-xl border border-natural-border cursor-pointer hover:border-natural-accent transition-colors">
                        <input
                          type="checkbox"
                          name="autoPrint"
                          checked={formData.autoPrint !== false}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 accent-natural-dark cursor-pointer rounded"
                        />
                        <span className="text-xs font-bold text-natural-text">
                          {isRtl ? 'چاپکردنی خۆکار کاتی تەواوکردنی فرۆشتن' : 'Auto-print receipt on checkout'}
                        </span>
                      </label>
                    </div>

                    {/* Network Test Feedback */}
                    {printerTestStatus && (
                      <div
                        className={`p-3.5 rounded-xl border mb-4 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                          printerTestStatus.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {printerTestStatus.success ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{printerTestStatus.message}</span>
                      </div>
                    )}
                    {saveStatus && (
                      <div
                        className={`p-3.5 rounded-xl border mb-4 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                          saveStatus.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {saveStatus.success ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{saveStatus.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-natural-border/60 flex flex-wrap justify-between items-center gap-3">
                    <button
                      type="button"
                      disabled={isTestingPrinter}
                      onClick={handleTestNetworkPrinter}
                      className="bg-natural-surface border border-natural-border hover:border-natural-dark text-natural-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isTestingPrinter ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-natural-dark" />
                          <span>{isRtl ? 'پەیوەندی دەبەستێت...' : 'Testing Printer...'}</span>
                        </>
                      ) : (
                        <>
                          <Wifi size={14} className="text-emerald-500" />
                          <span>{isRtl ? 'تاقیکردنەوەی پرینتەری نێتۆرک' : 'Test Network Printer'}</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          updateReceiptSettings(formData);
                          window.print();
                        }}
                        className="bg-natural-bg border border-natural-border hover:bg-natural-border/80 text-natural-text px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                      >
                        <Printer size={14} />
                        <span>{isRtl ? 'چاپی ئایپاد (AirPrint / تێست)' : 'AirPrint / Test'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="bg-natural-dark hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-white" />
                            <span>{isRtl ? 'سەیڤ دەکرێت...' : 'Saving...'}</span>
                          </>
                        ) : (
                          <span>{t('saveChanges')}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full xl:w-[400px] shrink-0">
                <div className="bg-natural-bg rounded-2xl p-4 sm:p-6 border border-natural-border flex flex-col items-center sticky top-6 shadow-sm">
                  <h3 className="font-bold text-natural-text mb-6 uppercase tracking-widest text-xs">Live Preview</h3>
                  <div className="bg-natural-surface p-4 shadow-md w-full rounded-sm">
                    <Receipt settingsOverride={formData} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 sm:p-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-natural-text">{t('backupRestore')}</h2>
                <p className="text-natural-text-secondary mt-1 text-sm">Secure your data by exporting or restore from a previous backup.</p>
              </div>
              
              <div className="space-y-6">
                <div className="bg-natural-bg border border-natural-border p-4 sm:p-6 rounded-2xl hover:border-natural-accent/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl shrink-0">
                      <Download size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-natural-text text-lg mb-1">{t('exportData')}</h3>
                      <p className="text-sm text-natural-text-secondary mb-4 leading-relaxed">
                        {t('exportDataDesc')}
                      </p>
                      <button className="bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-dark px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                        {t('exportToJson')}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-natural-bg border border-natural-border p-4 sm:p-6 rounded-2xl hover:border-natural-accent/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0">
                      <Upload size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-natural-text text-lg mb-1">{t('importData')}</h3>
                      <p className="text-sm text-natural-text-secondary mb-4 leading-relaxed">
                        {t('importDataDesc')}
                      </p>
                      <div className="flex items-center gap-4">
                        <button className="bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-dark px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                          {t('selectFile')}
                        </button>
                        <span className="text-xs text-natural-text-tertiary">{t('noFileSelected')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'telegram' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 sm:p-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-natural-text">
                  {isRtl ? 'ڕێکخستنی بۆتی تەلەگرام' : 'Telegram Bot Integration'}
                </h2>
                <p className="text-natural-text-secondary mt-1 text-sm">
                  {isRtl 
                    ? 'پەسەندکردنی ناردنی ڕاپۆرتی گشتی و دەوامەکان ڕاستەوخۆ بۆ مۆبایلی خاوەن کار لە ڕێگەی بۆتەوە.' 
                    : 'Connect a Telegram bot to send real-time shift sales and system closure reports to the business owner.'}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-natural-text mb-2">
                    {isRtl ? 'تۆکنی بۆتی تەلەگرام (Bot API Token)' : 'Telegram Bot Token'}
                  </label>
                  <input 
                    type="text" 
                    name="telegramToken" 
                    value={formData.telegramToken || ''} 
                    onChange={handleChange} 
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" 
                    className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-natural-text mb-2">
                    {isRtl ? 'ناسنامەی چاتی خاوەن کار (Chat ID)' : 'Telegram Chat ID / Owner ID'}
                  </label>
                  <input 
                    type="text" 
                    name="telegramChatId" 
                    value={formData.telegramChatId || ''} 
                    onChange={handleChange} 
                    placeholder="987654321" 
                    className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-dark focus:ring-2 focus:ring-natural-dark/20 transition-all shadow-sm" 
                  />
                </div>

                <div className="bg-natural-bg border border-natural-border rounded-2xl p-4 text-xs text-natural-text-secondary leading-relaxed space-y-2">
                  <div className="font-bold text-natural-text flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500" />
                    {isRtl ? 'چۆن بۆتی تەلەگرام دروست دەکەم؟' : 'How to set up your Telegram Bot?'}
                  </div>
                  {isRtl ? (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>لە تەلەگرام بگەڕێ بۆ <span className="font-bold text-indigo-600">@BotFather</span> و نامەی پێ بنێرە.</li>
                      <li>فەرمانی <span className="font-bold">/newbot</span> بنێرە و ناوێک و یوزەرنەیامێک بۆ بۆتەکەت دیاری بکە.</li>
                      <li>تۆکنەکەت دەداتێ (Token)؛ لێرە کۆپی بکە.</li>
                      <li>بۆ دۆزینەوەی Chat ID، لە تەلەگرام نامە بنێرە بۆ <span className="font-bold text-indigo-600">@userinfobot</span> ناسنامەکەت پێدەدات.</li>
                      <li>دڵنیابەوە کە سەرەتا لە تەلەگرامەکەت کورتە نامەیەک بۆ بۆتەکەت بنێریت تاوەکو بتوانێت پەیوەندیت پێوە بکات!</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Search for <span className="font-bold text-indigo-600">@BotFather</span> on Telegram and start the chat.</li>
                      <li>Send <span className="font-bold">/newbot</span> and follow the instructions to get your Bot API Token.</li>
                      <li>Search for <span className="font-bold text-indigo-600">@userinfobot</span> to find your Telegram Chat ID.</li>
                      <li>Click "Start" on your newly created bot so it is allowed to message you!</li>
                    </ol>
                  )}
                </div>

                {/* Test response banner */}
                {telegramTestStatus && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
                    telegramTestStatus.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="text-base">{telegramTestStatus.success ? '✅' : '❌'}</span>
                    <p>{telegramTestStatus.message}</p>
                  </div>
                )}

                {saveStatus && (
                  <div
                    className={`p-3.5 rounded-xl border mt-4 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                      saveStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {saveStatus.success ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{saveStatus.message}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-natural-border/60 flex justify-end gap-3">
                  <button 
                    onClick={handleTestTelegram} 
                    disabled={isTestingTelegram}
                    className="bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100/50 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    {isTestingTelegram ? (isRtl ? 'دەنێردرێت...' : 'Sending...') : (isRtl ? 'تاقیکردنەوەی بۆت' : 'Test Connection')}
                  </button>
                  <button 
                    disabled={isSaving}
                    onClick={handleSave} 
                    className="bg-natural-dark hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>{isRtl ? 'سەیڤ دەکرێت...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{t('saveChanges')}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 p-2 sm:p-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-rose-600">{t('dangerZone')}</h2>
                <p className="text-rose-600/70 mt-1 text-sm">
                  {isRtl 
                    ? 'کردارە هەستیار و مەترسیدارەکان کە دەبنە هۆی سڕینەوەی گشتی داتاکانی سەر فایربەیس بە یەکجاری.'
                    : 'Irreversible administrative actions that affect Firestore database collections directly. Proceed with extreme caution.'}
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Delete all expenses (سڕینەوەی گشتی خەرجییەکان) */}
                <div className="bg-rose-50/30 border border-rose-100 p-6 rounded-2xl">
                  <h3 className="font-black text-rose-700 text-lg mb-1">
                    {isRtl ? 'سڕینەوەی گشتی سەرجەم خەرجییەکان' : 'Clear All Expenses Data'}
                  </h3>
                  <p className="text-sm text-natural-text-secondary mb-4">
                    {isRtl 
                      ? 'ئەم کردارە سەرجەم خەرجییە تۆمارکراوەکان لەسەر فایربەیس دەسڕێتەوە و دەبێتە صفر.' 
                      : 'This will completely delete all recorded expenses from your Firestore database.'}
                  </p>
                  
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-natural-text-secondary">
                      {isRtl ? 'تکایە بنووسە "RESET" بۆ دڵنیابوونەوەی کردارەکە' : 'Type "RESET" to confirm:'}
                    </label>
                    <input 
                      type="text" 
                      value={safetyExpenseText} 
                      onChange={e => setSafetyExpenseText(e.target.value)} 
                      placeholder="RESET" 
                      className="w-full bg-natural-surface border border-rose-100 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-400 font-mono tracking-widest uppercase"
                    />
                    
                    <button 
                      onClick={async () => {
                        if (safetyExpenseText !== 'RESET') {
                          alert(isRtl ? 'تکایە وشەی ڕاست بنووسە بۆ دڵنیابوونەوە' : 'Please type RESET correctly to confirm');
                          return;
                        }
                        if (window.confirm(isRtl ? 'ئایا دڵنیایت لە سڕینەوەی سەرجەم خەرجییەکان؟ ئەم کردارە ناگەڕێتەوە!' : 'Are you sure you want to delete all expenses? This cannot be undone!')) {
                          try {
                            await resetExpenses();
                            setSafetyExpenseText('');
                            alert(isRtl ? 'سەرجەم خەرجییەکان بە سەرکەوتوویی سڕانەوە!' : 'All expenses cleared successfully!');
                          } catch (e) {
                            alert('Error: ' + (e as Error).message);
                          }
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 text-sm"
                    >
                      <Trash2 size={16} />
                      {isRtl ? 'تەواوکردنی سڕینەوەی خەرجییەکان' : 'Confirm Expense Reset'}
                    </button>
                  </div>
                </div>

                {/* Reset entire system (سفرکردنەوەی گشتی داتاکان) */}
                <div className="bg-red-50/50 border border-red-200 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
                  <h3 className="font-black text-red-700 text-lg mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                    {isRtl ? 'سفرکردنەوەی بنەڕەتی گشتی سیستەم' : 'Full System Factory Reset'}
                  </h3>
                  <p className="text-sm text-red-600/80 mb-4">
                    {isRtl 
                      ? 'مەترسی گەورە! ئەم کردارە هەموو شتێک سفر دەکاتەوە: خەرجییەکان، فرۆشەکان (پسووڵەکان)، دەوامەکانی کارمەندان، کۆگای ئینڤێنتۆری، گشت مێزەکان چالاک دەکرێنەوە. کارەکە ڕاستەوخۆ لەسەر فایربەیس ئەنجام دەدرێت.'
                      : 'CRITICAL ACTION: This completely zeros out all transaction history including sales invoices, employee shifts, expense reports, inventory stock counts, and clears active table orders.'}
                  </p>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-red-700">
                      {isRtl ? 'تکایە بنووسە "SYSTEMRESET" بۆ دڵنیابوونەوەی گشتی' : 'Type "SYSTEMRESET" to confirm full reset:'}
                    </label>
                    <input 
                      type="text" 
                      value={safetySystemText} 
                      onChange={e => setSafetySystemText(e.target.value)} 
                      placeholder="SYSTEMRESET" 
                      className="w-full bg-natural-surface border border-red-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-red-500 font-mono tracking-widest uppercase text-red-600 font-bold"
                    />

                    <button 
                      onClick={async () => {
                        if (safetySystemText !== 'SYSTEMRESET') {
                          alert(isRtl ? 'تکایە وشەی ڕاست بنووسە بۆ دڵنیابوونەوە' : 'Please type SYSTEMRESET correctly to confirm');
                          return;
                        }
                        if (window.confirm(isRtl ? '🚨🚨🚨 هۆشداری کۆتایی: ئایا بە تەواوی دڵنیایت لە سفرکردنەوەی گشتی سیستەمەکە؟ سەرجەم داتاکان بە یەکجاری دەسڕێنەوە!' : '🚨🚨🚨 FINAL WARNING: Are you absolutely sure you want to perform a full system reset? This deletes all records permanently from Firestore!')) {
                          try {
                            await resetSystemData();
                            setSafetySystemText('');
                            alert(isRtl ? 'سیستەمەکە بە سەرکەوتوویی بە تەواوی سفر کرایەوە!' : 'Whole system database reset to zero successfully!');
                          } catch (e) {
                            alert('Error: ' + (e as Error).message);
                          }
                        }
                      }}
                      className="w-full bg-red-700 hover:bg-red-800 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-colors active:scale-95 text-sm uppercase tracking-wider"
                    >
                      <Trash2 size={16} />
                      {isRtl ? 'بەڵێ، دڵنیام سیستەمەکە صفر بکەرەوە' : 'Execute System Reset'}
                    </button>
                  </div>
                </div>

                {/* Legacy visual resets for backwards compatibility */}
                <div className="bg-natural-bg border border-natural-border p-4 rounded-xl flex items-center justify-between text-xs text-natural-text-secondary">
                  <span>{isRtl ? 'سڕینەوەی سادە' : 'Simple Reset Helpers'}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { if(window.confirm(t('confirmDeleteReceipts'))) alert(t('receiptsDeleted')); }} 
                      className="px-3 py-1 bg-natural-surface border border-natural-border rounded hover:bg-natural-bg"
                    >
                      {t('deleteAllReceipts')}
                    </button>
                    <button 
                      onClick={() => { if(window.confirm(t('confirmDeleteMenu'))) alert(t('menuDeleted')); }} 
                      className="px-3 py-1 bg-natural-surface border border-natural-border rounded hover:bg-natural-bg"
                    >
                      {t('resetMenuItems')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {showPrinterSetup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[100]">
          <div className="bg-natural-surface rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-natural-border flex justify-between items-center bg-natural-bg/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-natural-text flex items-center gap-2">
                <Printer className="text-indigo-600" size={24} />
                Printer Setup Guide
              </h2>
              <button onClick={() => setShowPrinterSetup(false)} className="text-natural-text-tertiary hover:text-natural-text bg-natural-surface p-2 rounded-full border border-natural-border shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-natural-text-secondary leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl font-medium">
                This POS system uses <strong>Browser Print functionality</strong> (window.print). Because it operates as a web app/iPad app, it cannot communicate via USB directly. You must use a <strong>Network/WiFi Printer</strong> or an <strong>AirPrint-compatible</strong> printer.
              </div>

              <div>
                <h3 className="font-bold text-natural-text text-lg mb-2">1. iPad / iOS (AirPrint)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ensure your receipt printer supports Apple AirPrint (e.g., Star Micronics TSP143IIILAN, EPSON TM-m30II).</li>
                  <li>Connect the printer to the <strong>same WiFi network</strong> as your iPad.</li>
                  <li>When you click "Print Test", the iOS print dialog will appear. Select your printer and print. iOS will remember it for next time.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-natural-text text-lg mb-2">2. Network Printers (Local IP)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Connect your printer to your router via Ethernet cable.</li>
                  <li>Print the printer's self-test page (usually by holding the FEED button while turning it on) to find its <strong>IP Address</strong>.</li>
                  <li>Enter that IP Address in the "Receipt Printer IP" field on this page.</li>
                  <li>Note: Direct IP printing from a web browser requires the printer to support HTTP print servers, or it relies on the browser's native print spooler. If the IP method fails, rely on the native browser print dialog.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-natural-text text-lg mb-2">3. Auto-Print on Checkout</h3>
                <p>If "Auto-print receipt" is checked, the print dialog will open automatically when a checkout is completed. For the fastest experience on a PC/Mac, you can configure Google Chrome to bypass the print preview using the <strong>--kiosk-printing</strong> flag.</p>
              </div>

              <div>
                <h3 className="font-bold text-natural-text text-lg mb-2 text-rose-600">Troubleshooting</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Blank Receipts:</strong> Ensure the receipt roll is inserted correctly (thermal paper only prints on one side).</li>
                  <li><strong>Text is too small/large:</strong> Change the paper size in your browser's print dialog (usually 80mm or 58mm).</li>
                  <li><strong>Headers/Footers showing:</strong> Turn off "Headers and Footers" in your browser's print dialog settings so it only prints the clean receipt.</li>
                  <li><strong>Printer not found on iPad:</strong> Ensure the printer and iPad are on the exact same WiFi network (not just the same router, but the same subnet).</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-natural-border bg-natural-bg/50 rounded-b-2xl flex justify-end">
              <button onClick={() => setShowPrinterSetup(false)} className="bg-natural-dark text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <div id="receipt-print-root" className="hidden print:block receipt-printable-root">
      <Receipt settingsOverride={formData} />
    </div>
    </>
  );
};
