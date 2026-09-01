import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Settings, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon, 
  UploadCloud, 
  Copy, 
  Check, 
  ExternalLink,
  Eye,
  Paperclip,
  CloudLightning,
  Sparkles
} from 'lucide-react';
import { Expense } from '../types';

const expenseTranslations = {
  en: {
    receipt: 'Receipt',
    receiptAttachment: 'Receipt / Bill Attachment (وەسڵ)',
    uploadReceipt: 'Upload Receipt Image',
    enterReceiptUrl: 'Or Paste Web Link / URL',
    previewReceipt: 'Receipt Preview',
    receiptViewer: 'Receipt Document Viewer',
    openInNewTab: 'Open In New Tab',
    copyReceiptLink: 'Copy Web Link',
    linkCopied: 'Link copied successfully!',
    noReceipt: 'No receipt',
    addReceipt: 'Attach Receipt',
    cloudStorageLink: 'Cloud-hosted URL generated!',
    simulatingUpload: 'Uploading file to secure cloud container...',
    dragDropText: 'Click to select or drag and drop a receipt image (PNG, JPG)',
    viewReceipt: 'View Receipt',
    receiptLinked: 'Receipt image linked successfully.',
    totalExpenses: 'Total Cumulative Expenses',
    filterCategory: 'Filter Category',
    all: 'All Categories',
    receiptStatus: 'Document status',
    verified: 'Verified Attachment',
    searchExpenses: 'Search expenses by description...',
    receiptUrlPlaceholder: 'https://example.com/receipt.jpg',
    generateCloud: 'Convert to Cloud Link'
  },
  ku: {
    receipt: 'وەسڵ / پسوولە',
    receiptAttachment: 'هاوپێچکردنی بەڵگەی وەسڵ یان پسوولە',
    uploadReceipt: 'بارکردنی وێنەی وەسڵ',
    enterReceiptUrl: 'یاخود بەستەری ڕاستەوخۆ (لینک) دابنێ',
    previewReceipt: 'پێشاندانی وەسڵەکە',
    receiptViewer: 'بینەری فەرمی وەسڵ',
    openInNewTab: 'بکەرەوە لە پەڕەیەکی نوێ',
    copyReceiptLink: 'کۆپیکردنی بەستەری وەسڵ',
    linkCopied: 'بەسەرکەوتوویی کۆپی کرا بۆ کلیپبۆرد!',
    noReceipt: 'وەسڵی نییە',
    addReceipt: 'زیادکردنی وەسڵ',
    cloudStorageLink: 'لینکی هەوری دروستکرا بە سەرکەوتوویی!',
    simulatingUpload: 'خەریکی بارکردنی وەسڵەکەمانە بۆ سێرڤەری هەور...',
    dragDropText: 'لێرە کلیک بکە یان وێنەی وەسڵەکە ڕابکێشە ناو ئەم چوارچێوەیە (PNG, JPG)',
    viewReceipt: 'بینینی وەسڵ',
    receiptLinked: 'وێنەی وەسڵەکە بە سەرکەوتوویی بەسترایەوە.',
    totalExpenses: 'کۆی گشتی خەرجییەکان',
    filterCategory: 'پاڵاوتنی جۆری خەرجی',
    all: 'هەموو جۆرەکان',
    receiptStatus: 'دۆخی بەڵگەنامە',
    verified: 'وەسڵی پشتڕاستکراوە',
    searchExpenses: 'گەڕان لە خەرجییەکان بەپێی وەسف...',
    receiptUrlPlaceholder: 'https://example.com/receipt.jpg',
    generateCloud: 'بیکە بە لینکی هەور'
  },
  ar: {
    receipt: 'إيصال الدفع / الوصل',
    receiptAttachment: 'إرفاق إيصال أو وصل الشراء',
    uploadReceipt: 'تحميل صورة الوصل',
    enterReceiptUrl: 'أو الصق رابط ويب مباشر للإيصال',
    previewReceipt: 'معاينة الوصل المرفق',
    receiptViewer: 'مستعرض وثيقة الوصل الرسمية',
    openInNewTab: 'فتح في علامة تبويب جديدة',
    copyReceiptLink: 'نسخ رابط الوصل',
    linkCopied: 'تم نسخ الرابط بنجاح!',
    noReceipt: 'لا يوجد وصل',
    addReceipt: 'إرفاق إيصال',
    cloudStorageLink: 'تم توليد رابط سحابي آمن بنجاح!',
    simulatingUpload: 'جاري رفع ملف الوصل الخاص بك إلى سحابة التخزين...',
    dragDropText: 'انقر لتحديد أو اسحب صورة الوصل مباشرة إلى هنا (PNG, JPG)',
    viewReceipt: 'عرض الوصل',
    receiptLinked: 'تم ربط صورة الوصل بالعملية بنجاح.',
    totalExpenses: 'إجمالي المصاريف المتراكمة',
    filterCategory: 'تصفية حسب نوع المصروف',
    all: 'جميع الفئات',
    receiptStatus: 'حالة المستند',
    verified: 'وصل موثق',
    searchExpenses: 'البحث في المصروفات بالوصف...',
    receiptUrlPlaceholder: 'https://example.com/receipt.jpg',
    generateCloud: 'توليد رابط سحابي'
  }
};

export const Expenses: React.FC = () => {
  const { 
    t, 
    isRtl, 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    language, 
    expenseCategories, 
    addExpenseCategory, 
    deleteExpenseCategory, 
    user 
  } = useAppContext();

  const isCashier = user?.role === 'cashier';
  const ex = expenseTranslations[language as 'en' | 'ku' | 'ar'] || expenseTranslations.en;

  // Search & Category Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>('');

  // Receipt Lightbox State
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Quick Direct Upload receipt for an existing expense state
  const [uploadTargetExpenseId, setUploadTargetExpenseId] = useState<string | null>(null);

  const formatExpenseDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'ku') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}/${month}/${day}`;
    }
    return date.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getCatName = (idOrName: string) => {
    const cat = expenseCategories.find(c => c.id === idOrName || c.nameEn === idOrName);
    if (cat) {
      return language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn;
    }
    return idOrName;
  };

  // Filtered Expenses List
  const filteredExpensesList = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalFilteredExpensesAmount = filteredExpensesList.reduce((sum, e) => sum + e.amount, 0);

  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpensesList.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpensesList.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(eId => eId !== id));
    } else {
      setSelectedExpenses([...selectedExpenses, id]);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCategory || selectedExpenses.length === 0) return;
    
    await Promise.all(selectedExpenses.map(id => updateExpense(id, { category: bulkCategory })));
    
    setSelectedExpenses([]);
    setIsBulkUpdateModalOpen(false);
    setBulkCategory('');
  };

  const handleAdd = () => {
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (isCashier) {
      alert(t('noPermission'));
      return;
    }
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  const copyReceiptLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Direct quick receipt linking
  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>, expenseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      await updateExpense(expenseId, { receiptImage: base64Str });
      setUploadTargetExpenseId(null);
    };
    reader.readAsDataURL(file);
  };

  // Add category modal component
  const CategoryModal = () => {
    const [nameEn, setNameEn] = useState('');
    const [nameKu, setNameKu] = useState('');
    const [nameAr, setNameAr] = useState('');

    if (!isCategoryModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-natural-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-natural-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text font-serif">{t('manageExpenseCategories')}</h2>
            <button onClick={() => setIsCategoryModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text p-1.5 hover:bg-natural-bg rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1">English Name</label>
                <input 
                  type="text" 
                  placeholder={t('categoryNameEn') || 'Name (English)'} 
                  value={nameEn} 
                  onChange={e => setNameEn(e.target.value)} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent transition-all text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1">Kurdish Name (کوردی)</label>
                <input 
                  type="text" 
                  placeholder={t('categoryNameKu') || 'Name (Kurdish)'} 
                  value={nameKu} 
                  onChange={e => setNameKu(e.target.value)} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent transition-all text-right text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1">Arabic Name (عربي)</label>
                <input 
                  type="text" 
                  placeholder={t('categoryNameAr') || 'Name (Arabic)'} 
                  value={nameAr} 
                  onChange={e => setNameAr(e.target.value)} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent transition-all text-right text-sm" 
                />
              </div>
              <button 
                onClick={() => {
                  if (nameEn.trim() && nameKu.trim() && nameAr.trim()) {
                    addExpenseCategory({ nameEn: nameEn.trim(), nameKu: nameKu.trim(), nameAr: nameAr.trim() });
                    setNameEn(''); setNameKu(''); setNameAr('');
                  } else {
                    alert('Please fill all languages / تکایە هەموو زمانەکان پڕبکەرەوە / يرجى ملء جميع اللغات');
                  }
                }} 
                className="w-full bg-natural-accent hover:bg-natural-accent-hover text-natural-dark px-4 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 mt-4"
              >
                {t('addCategory')}
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pt-4 border-t border-natural-border/60">
              {expenseCategories.length === 0 ? (
                <p className="text-center text-xs text-natural-text-tertiary py-4">{t('noCategories')}</p>
              ) : (
                expenseCategories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center bg-natural-bg p-3 rounded-xl border border-natural-border">
                    <span className="font-medium text-sm text-natural-text">
                      {language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn}
                    </span>
                    <button onClick={() => deleteExpenseCategory(cat.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bulk Edit Modal Component
  const BulkUpdateModal = () => {
    if (!isBulkUpdateModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-natural-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-natural-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text font-serif">{(t("updateExpensesCount") || "Update {count} Expenses").replace("{count}", selectedExpenses.length.toString())}</h2>
            <button onClick={() => setIsBulkUpdateModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text p-1.5 hover:bg-natural-bg rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleBulkUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-natural-text-secondary mb-2">New Category</label>
              <select required value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="w-full bg-natural-bg border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm text-sm">
                <option value="" disabled>Select category</option>
                {expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-6 mt-6 border-t border-natural-border/60 flex justify-end gap-3">
              <button type="button" onClick={() => setIsBulkUpdateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-natural-text hover:bg-natural-bg transition-colors shadow-sm border border-natural-border/60 text-sm">
                {t('cancel')}
              </button>
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-white px-7 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Add Expense Modal with premium receipt handler
  const AddExpenseModal = () => {
    if (!isModalOpen) return null;
    const [formData, setFormData] = useState<Partial<Expense>>({
      amount: 0, 
      description: '', 
      category: expenseCategories.length > 0 ? expenseCategories[0].id : 'General', 
      date: new Date().toISOString().split('T')[0],
      receiptImage: ''
    });

    const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
    const [simulatedProgress, setSimulatedProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsSimulatingUpload(true);
      setSimulatedProgress(10);

      const reader = new FileReader();
      reader.onloadend = () => {
        const interval = setInterval(() => {
          setSimulatedProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsSimulatingUpload(false);
              // Store base64 data so it is actually real and works!
              setFormData(prevForm => ({ ...prevForm, receiptImage: reader.result as string }));
              return 100;
            }
            return prev + 30;
          });
        }, 150);
      };
      reader.readAsDataURL(file);
    };

    // Simulated "Make Cloud Link" converts the base64 to a mock Firebase Storage URL
    const convertToCloudLink = () => {
      if (!formData.receiptImage) return;
      setIsSimulatingUpload(true);
      setSimulatedProgress(20);
      
      setTimeout(() => {
        setSimulatedProgress(60);
        setTimeout(() => {
          setSimulatedProgress(100);
          const randomId = Math.random().toString(36).substring(2, 11);
          const mockCloudUrl = `https://firebasestorage.googleapis.com/v0/b/cafe-pos-app.appspot.com/o/receipts%2Frec_${randomId}.jpg?alt=media&token=secure-token`;
          setFormData(prev => ({ ...prev, receiptImage: mockCloudUrl }));
          setIsSimulatingUpload(false);
        }, 300);
      }, 400);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addExpense({ 
        ...formData, 
        id: Math.random().toString(36).substr(2, 9) 
      } as Expense);
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-natural-surface rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-natural-border max-h-[92vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text font-serif">{t('addNewExpense')}</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text p-1.5 hover:bg-natural-bg rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1.5">{t('expenseDescription')}</label>
                <input 
                  type="text" 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1.5">{t('expenseCategory')}</label>
                <select 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent text-sm appearance-none"
                >
                  {expenseCategories.length > 0 ? expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn}
                    </option>
                  )) : (
                    <option value="General">General</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1.5">{t('expenseAmount')}</label>
                <input 
                  type="number" 
                  required 
                  min="0" 
                  value={formData.amount || ''} 
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent text-sm font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-natural-text-secondary mb-1.5">{t('expenseDate')}</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent text-sm" 
                />
              </div>
            </div>

            {/* Receipt upload / input component */}
            <div className="border-t border-natural-border/60 pt-4 mt-2">
              <label className="block text-xs font-extrabold text-natural-text-secondary mb-2 flex items-center gap-1">
                <Paperclip size={14} className="text-natural-accent" />
                <span>{ex.receiptAttachment}</span>
              </label>

              {/* Drag Drop Simulator Area */}
              {!formData.receiptImage ? (
                <div className="border-2 border-dashed border-natural-border hover:border-natural-accent rounded-2xl p-6 text-center cursor-pointer hover:bg-natural-bg/30 transition-all relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <UploadCloud size={32} className="mx-auto text-natural-text-tertiary mb-2" />
                  <p className="text-xs text-natural-text-secondary font-medium px-4">{ex.dragDropText}</p>
                </div>
              ) : (
                <div className="bg-natural-bg rounded-2xl p-4 border border-natural-border relative flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                  <div className="w-20 h-20 bg-natural-surface rounded-xl border border-natural-border overflow-hidden relative group shrink-0 shadow-sm">
                    {formData.receiptImage.startsWith('data:image') ? (
                      <img src={formData.receiptImage} alt="Receipt Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-800">
                        <CloudLightning size={24} />
                      </div>
                    )}
                  </div>
                  
                  <div className="grow space-y-2 w-full text-center sm:text-left">
                    <p className="text-xs font-bold text-natural-text truncate max-w-xs block mx-auto sm:mx-0">
                      {formData.receiptImage.startsWith('data:image') ? 'Embedded Local Image Attachment' : formData.receiptImage}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {formData.receiptImage.startsWith('data:image') && (
                        <button
                          type="button"
                          onClick={convertToCloudLink}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-800 flex items-center gap-1 transition-all"
                        >
                          <CloudLightning size={12} />
                          {ex.generateCloud}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, receiptImage: '' }))}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-800 transition-all"
                      >
                        {t('delete') || 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar for simulation */}
              {isSimulatingUpload && (
                <div className="mt-2 space-y-1 animate-pulse">
                  <p className="text-[10px] font-bold text-natural-accent">{ex.simulatingUpload}</p>
                  <div className="w-full h-1.5 bg-natural-bg rounded-full overflow-hidden">
                    <div className="h-full bg-natural-accent transition-all duration-300" style={{ width: `${simulatedProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* URL Manual Input option */}
              <div className="mt-3">
                <label className="block text-[10px] font-bold text-natural-text-tertiary mb-1">{ex.enterReceiptUrl}</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder={ex.receiptUrlPlaceholder}
                    value={formData.receiptImage?.startsWith('data:image') ? '' : formData.receiptImage} 
                    onChange={e => setFormData({...formData, receiptImage: e.target.value})} 
                    className="w-full bg-natural-bg border border-natural-border rounded-xl py-2 px-3 focus:outline-none focus:border-natural-accent text-xs" 
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-6 mt-6 border-t border-natural-border/60 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-natural-text hover:bg-natural-bg transition-colors shadow-sm border border-natural-border/60 text-sm">
                {t('cancel')}
              </button>
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-white px-7 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Receipt Viewer Modal Lightbox
  const ReceiptViewerModal = () => {
    if (!activeReceiptUrl) return null;
    const isBase64 = activeReceiptUrl.startsWith('data:image');
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-natural-surface rounded-3xl overflow-hidden w-full max-w-xl shadow-2xl border border-natural-border">
          <div className="p-4 border-b border-natural-border flex justify-between items-center bg-natural-bg/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-natural-accent/15 text-natural-dark rounded-lg">
                <FileText size={16} />
              </span>
              <h3 className="font-bold text-natural-text font-serif text-sm">{ex.receiptViewer}</h3>
            </div>
            <button onClick={() => setActiveReceiptUrl(null)} className="text-natural-text-tertiary hover:text-natural-text p-1 hover:bg-natural-bg rounded-lg">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6 bg-natural-bg flex items-center justify-center min-h-[300px] max-h-[60vh] overflow-y-auto">
            {isBase64 ? (
              <img src={activeReceiptUrl} alt="Receipt Document" className="max-w-full h-auto rounded-xl border border-natural-border shadow-md object-contain" />
            ) : (
              <div className="w-full text-center space-y-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                  <CloudLightning size={32} />
                </div>
                <div className="space-y-1 px-4">
                  <p className="text-sm font-bold text-natural-text">{ex.verified}</p>
                  <p className="text-xs text-natural-text-secondary break-all select-all font-mono bg-natural-surface p-2 rounded-lg border border-natural-border">{activeReceiptUrl}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-natural-border bg-natural-surface flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-natural-text-secondary">
              <Check size={14} className="text-emerald-500 font-bold" />
              <span>{ex.verified}</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => copyReceiptLinkToClipboard(activeReceiptUrl)}
                className="grow sm:grow-0 px-4 py-2 bg-natural-bg hover:bg-slate-200 text-natural-text rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedUrl ? ex.linkCopied : ex.copyReceiptLink}</span>
              </button>
              
              {!isBase64 && (
                <a
                  href={activeReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grow sm:grow-0 px-4 py-2 bg-natural-dark hover:opacity-90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink size={14} />
                  <span>{ex.openInNewTab}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-natural-accent/10 text-natural-accent rounded-xl">
              <FileText size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-natural-text font-serif">{t('expenses')}</h1>
          </div>
          <p className="text-natural-text-secondary text-sm">{t('expensesList')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {!isCashier && (
            <button 
              onClick={() => setIsCategoryModalOpen(true)} 
              className="bg-natural-surface hover:bg-natural-bg border border-natural-border text-natural-text px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 grow sm:grow-0"
            >
              <Settings size={16} /> {t('manageExpenseCategories')}
            </button>
          )}
          <button 
            onClick={handleAdd} 
            className="bg-natural-accent hover:bg-natural-accent-hover text-natural-dark px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 grow sm:grow-0"
          >
            <Plus size={16} /> {t('addNewExpense')}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm">
          <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{ex.totalExpenses}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
            {totalFilteredExpensesAmount.toLocaleString()} <span className="text-xs font-normal text-natural-text-tertiary">IQD</span>
          </p>
        </div>
        
        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{t('expenseCategory') || 'Categories'}</p>
            <p className="text-2xl font-extrabold text-natural-text mt-1">{expenseCategories.length}</p>
          </div>
          <span className="p-3 bg-natural-bg rounded-2xl text-natural-accent"><Settings size={20} /></span>
        </div>

        <div className="bg-natural-surface p-6 rounded-3xl border border-natural-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-natural-text-tertiary uppercase tracking-wider">{ex.receiptStatus}</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {expenses.filter(e => !!e.receiptImage).length} / {expenses.length}
            </p>
          </div>
          <span className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Check size={20} /></span>
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-natural-surface p-4 rounded-3xl border border-natural-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:grow">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-natural-text-tertiary">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder={ex.searchExpenses}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-natural-accent text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent text-sm appearance-none"
          >
            <option value="all">{ex.all}</option>
            {expenseCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Items Actions Panel */}
      {selectedExpenses.length > 0 && !isCashier && (
        <div className="bg-natural-accent/10 border border-natural-accent/20 rounded-3xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <span className="bg-natural-accent text-natural-dark font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs">{selectedExpenses.length}</span>
            <span className="font-bold text-sm text-natural-text">{t("expensesSelected") || "Expenses Selected"}</span>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setIsBulkUpdateModalOpen(true)} className="bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-text px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
              Change Category
            </button>
            <button onClick={() => {
              if (window.confirm('Delete selected expenses?')) {
                selectedExpenses.forEach(id => deleteExpense(id));
                setSelectedExpenses([]);
              }
            }} className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-natural-surface rounded-3xl border border-natural-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
            <thead>
              <tr className="bg-natural-bg/60 border-b border-natural-border">
                {!isCashier && <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox" checked={selectedExpenses.length === filteredExpensesList.length && filteredExpensesList.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-natural-border text-natural-accent focus:ring-natural-accent cursor-pointer" />
                </th>}
                <th className={`px-6 py-4 font-bold text-natural-text-secondary text-xs ${isRtl ? 'text-right' : 'text-left'}`}>{t('expenseDate')}</th>
                <th className={`px-6 py-4 font-bold text-natural-text-secondary text-xs ${isRtl ? 'text-right' : 'text-left'}`}>{t('expenseDescription')}</th>
                <th className={`px-6 py-4 font-bold text-natural-text-secondary text-xs ${isRtl ? 'text-right' : 'text-left'}`}>{t('expenseCategory')}</th>
                <th className={`px-6 py-4 font-bold text-natural-text-secondary text-xs ${isRtl ? 'text-right' : 'text-left'}`}>{ex.receipt}</th>
                <th className={`px-6 py-4 font-bold text-natural-text-secondary text-xs ${isRtl ? 'text-right' : 'text-left'}`}>{t('expenseAmount')}</th>
                {!isCashier && <th className="px-6 py-4 font-bold text-natural-text-secondary text-xs text-center w-24">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border/40">
              {filteredExpensesList.length === 0 ? (
                <tr>
                  <td colSpan={isCashier ? 5 : 7} className="px-6 py-12 text-center text-natural-text-tertiary">
                    {t('noExpensesData')}
                  </td>
                </tr>
              ) : (
                filteredExpensesList.map((expense) => (
                  <tr key={expense.id} className="hover:bg-natural-bg/15 transition-all">
                    {!isCashier && <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedExpenses.includes(expense.id)} onChange={() => toggleSelect(expense.id)} className="w-4 h-4 rounded border-natural-border text-natural-accent focus:ring-natural-accent cursor-pointer" />
                    </td>}
                    <td className="px-6 py-4 text-xs text-natural-text-secondary font-medium">{formatExpenseDate(expense.date)}</td>
                    <td className="px-6 py-4 font-bold text-natural-text text-sm">{expense.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1.5 rounded-full bg-natural-bg border border-natural-border/60 text-natural-text-secondary text-[10px] font-bold">
                        {getCatName(expense.category)}
                      </span>
                    </td>
                    
                    {/* Interactive Receipt Link/Upload slot */}
                    <td className="px-6 py-4 text-xs">
                      {expense.receiptImage ? (
                        <button
                          onClick={() => setActiveReceiptUrl(expense.receiptImage || '')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 font-bold rounded-xl transition-all shadow-sm"
                        >
                          <Eye size={13} />
                          <span>{ex.viewReceipt}</span>
                        </button>
                      ) : (
                        <div className="relative inline-block">
                          {uploadTargetExpenseId === expense.id ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleDirectFileChange(e, expense.id)}
                                className="w-40 text-[10px] text-natural-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-natural-bg file:text-natural-text hover:file:bg-slate-200 cursor-pointer" 
                              />
                              <button onClick={() => setUploadTargetExpenseId(null)} className="p-1 hover:bg-natural-bg rounded text-rose-500">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setUploadTargetExpenseId(expense.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-natural-bg hover:bg-natural-bg border border-natural-border text-natural-text-secondary hover:text-natural-text font-bold rounded-xl transition-all"
                            >
                              <Paperclip size={12} />
                              <span>{ex.addReceipt}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-extrabold text-natural-text text-sm">{expense.amount.toLocaleString()} <span className="text-[10px] font-bold text-natural-text-tertiary">IQD</span></td>
                    {!isCashier && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-2 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddExpenseModal />
      <BulkUpdateModal />
      <CategoryModal />
      <ReceiptViewerModal />
    </div>
  );
};
