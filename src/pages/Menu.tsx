import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Coffee, Plus, Edit, Trash2, Search, X, FolderKanban, ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItem, Category } from '../types';

export const Menu: React.FC = () => {
  const { t, isRtl, language, menuItems, categories, addMenuItem, updateMenuItem, deleteMenuItem, addCategory, updateCategory, deleteCategory, reorderCategories } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = menuItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.nameEn.toLowerCase().includes(searchLower) ||
                          item.nameKu.includes(searchLower) ||
                          item.nameAr.includes(searchLower);
    
    if (selectedCategory === 'all') return matchesSearch;
    return matchesSearch && item.categoryId === selectedCategory;
  });

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return 'Unknown';
    if (language === 'ku') return cat.nameKu;
    if (language === 'ar') return cat.nameAr;
    return cat.nameEn;
  };

  const getItemName = (item: MenuItem) => {
    if (language === 'ku') return item.nameKu;
    if (language === 'ar') return item.nameAr;
    return item.nameEn;
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMenuItem(id);
    }
  };

  const handleToggleAvailable = (item: MenuItem) => {
    updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  const Modal = () => {
    if (!isModalOpen) return null;

    const defaultCategoryId = selectedCategory !== 'all' ? selectedCategory : (sortedCategories[0]?.id || categories[0]?.id || '');
    const [formData, setFormData] = useState<Partial<MenuItem>>(
      editingItem || {
        nameEn: '', nameKu: '', nameAr: '', price: 0, categoryId: defaultCategoryId, isAvailable: true, variants: []
      }
    );
    const [hasVariants, setHasVariants] = useState(!!(editingItem?.variants && editingItem.variants.length > 0));
    const [hasAddons, setHasAddons] = useState(!!(editingItem?.addons && editingItem.addons.length > 0));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const itemToSave = { ...formData };
      if (!hasVariants) {
        itemToSave.variants = [];
      } else if (!itemToSave.variants || itemToSave.variants.length === 0) {
        alert(isRtl ? "تکایە لانیکەم سایزێک یان نرخێک دیاری بکە." : "Please add at least one variant if multiple prices is enabled.");
        return;
      }

      if (!hasAddons) {
        itemToSave.addons = [];
      }

      if (editingItem) {
        updateMenuItem(editingItem.id, itemToSave as MenuItem);
      } else {
        addMenuItem({ ...itemToSave, id: Math.random().toString(36).substr(2, 9) } as MenuItem);
      }
      setIsModalOpen(false);
    };

    const addVariant = () => {
      setFormData({
        ...formData,
        variants: [...(formData.variants || []), { nameEn: '', nameKu: '', nameAr: '', price: 0 }]
      });
    };

    const updateVariant = (index: number, field: keyof import('../types').Variant, value: string | number) => {
      const newVariants = [...(formData.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index: number) => {
      const newVariants = [...(formData.variants || [])];
      newVariants.splice(index, 1);
      setFormData({ ...formData, variants: newVariants });
    };

    const addAddon = (custom?: Partial<import('../types').Addon>) => {
      const newAddon: import('../types').Addon = {
        id: Math.random().toString(36).substr(2, 7),
        nameEn: custom?.nameEn || '',
        nameKu: custom?.nameKu || '',
        nameAr: custom?.nameAr || '',
        price: custom?.price || 2000
      };
      setFormData({
        ...formData,
        addons: [...(formData.addons || []), newAddon]
      });
    };

    const updateAddon = (index: number, field: keyof import('../types').Addon, value: string | number) => {
      const newAddons = [...(formData.addons || [])];
      newAddons[index] = { ...newAddons[index], [field]: value };
      setFormData({ ...formData, addons: newAddons });
    };

    const removeAddon = (index: number) => {
      const newAddons = [...(formData.addons || [])];
      newAddons.splice(index, 1);
      setFormData({ ...formData, addons: newAddons });
    };

    const addMilkPreset = () => {
      const milkOptions: import('../types').Addon[] = [
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Oat Milk', nameKu: 'شیری ئۆت (Oat)', nameAr: 'حليب الشوفان', price: 2000 },
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Almond Milk', nameKu: 'شیری بادەم (Almond)', nameAr: 'حليب اللوز', price: 2000 },
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Coconut Milk', nameKu: 'شیری گوێزی هیندی (Coconut)', nameAr: 'حليب جوز الهند', price: 2000 }
      ];
      setFormData({
        ...formData,
        addons: [...(formData.addons || []), ...milkOptions]
      });
    };

    const addFlavourPreset = () => {
      const flavourOptions: import('../types').Addon[] = [
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Vanilla Syrup', nameKu: 'سیراپی ڤانێلا', nameAr: 'سيروب فانيليا', price: 2000 },
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Caramel Syrup', nameKu: 'سیراپی کارامێل', nameAr: 'سيروب كراميل', price: 2000 },
        { id: Math.random().toString(36).substr(2, 7), nameEn: 'Hazelnut Syrup', nameKu: 'سیراپی هەزێلنات', nameAr: 'سيروب البندق', price: 2000 }
      ];
      setFormData({
        ...formData,
        addons: [...(formData.addons || []), ...flavourOptions]
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text">
              {editingItem ? (isRtl ? 'دەستکاری کردنی ئایتم' : 'Edit Item') : (isRtl ? 'زیادکردنی ئایتمی نوێ' : 'Add New Item')}
            </h2>
            <button onClick={() => setIsModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-natural-text mb-1">{isRtl ? 'ناوی ئینگلیزی' : 'Name (English)'}</label>
                <input type="text" required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-natural-text mb-1">{isRtl ? 'ناوی کوردی' : 'Name (Kurdish)'}</label>
                <input type="text" required value={formData.nameKu} onChange={e => setFormData({...formData, nameKu: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-natural-text mb-1">{isRtl ? 'ناوی عەرەبی' : 'Name (Arabic)'}</label>
                <input type="text" required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-natural-text mb-1">{isRtl ? 'کەتەگۆری' : 'Category'}</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent">
                  {sortedCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {language === 'ku' ? c.nameKu : language === 'ar' ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              
              {!hasVariants && (
                <div>
                  <label className="block text-sm font-medium text-natural-text mb-1">{isRtl ? 'نرخی سەرەکی (د.ع)' : 'Base Price (IQD)'}</label>
                  <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-natural-border">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                  className="w-4 h-4 text-natural-accent bg-natural-bg border-natural-border rounded focus:ring-natural-accent"
                />
                <span className="text-sm font-medium text-natural-text">{isRtl ? 'ئایتمەکە چەند سایز / نرخی جیاوازی هەیە' : 'Item has multiple sizes/prices'}</span>
              </label>

              {hasVariants && (
                <div className="space-y-3 bg-natural-bg/50 p-4 rounded-xl border border-natural-border">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-natural-text">{isRtl ? 'سایزەکان و نرخەکان' : 'Sizes / Variants'}</h3>
                    <button type="button" onClick={addVariant} className="text-xs font-bold bg-natural-surface border border-natural-border px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-natural-bg">
                      <Plus size={14} /> {isRtl ? 'زیادکردنی سایز' : 'Add Size'}
                    </button>
                  </div>
                  
                  {formData.variants?.map((variant, index) => (
                    <div key={index} className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی ئینگلیزی' : 'Name (EN)'} required value={variant.nameEn} onChange={e => updateVariant(index, 'nameEn', e.target.value)} className="w-full bg-natural-surface border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی کوردی' : 'Name (KU)'} required value={variant.nameKu} onChange={e => updateVariant(index, 'nameKu', e.target.value)} className="w-full bg-natural-surface border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی عەرەبی' : 'Name (AR)'} required value={variant.nameAr} onChange={e => updateVariant(index, 'nameAr', e.target.value)} className="w-full bg-natural-surface border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="w-[120px]">
                        <input type="number" placeholder={isRtl ? 'نرخ' : 'Price'} required min="0" value={variant.price} onChange={e => updateVariant(index, 'price', Number(e.target.value))} className="w-full bg-natural-surface border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
                      </div>
                      <button type="button" onClick={() => removeVariant(index)} className="p-2 text-natural-text-tertiary hover:text-rose-500 bg-natural-surface rounded-xl border border-natural-border hover:bg-rose-500/10 mb-[1px]">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(!formData.variants || formData.variants.length === 0) && (
                    <p className="text-sm text-natural-text-tertiary text-center py-2">{isRtl ? 'هیچ سایزێک زیاد نەکراوە' : 'No sizes added yet.'}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-natural-border">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input 
                  type="checkbox" 
                  checked={hasAddons}
                  onChange={(e) => setHasAddons(e.target.checked)}
                  className="w-4 h-4 text-natural-accent bg-natural-bg border-natural-border rounded focus:ring-natural-accent"
                />
                <span className="text-sm font-medium text-natural-text">{isRtl ? 'ئایتمەکە زیادکراوی هەیە (زیادکراوەکان / Add-ons / Modifiers)' : 'Item has Add-ons / Modifiers (e.g. Milk choice, Flavor shots)'}</span>
              </label>

              {hasAddons && (
                <div className="space-y-3 bg-natural-bg/50 p-4 rounded-xl border border-natural-border">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-natural-text">{isRtl ? 'زیادکراوەکان / Add-ons' : 'Add-ons & Options'}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={addMilkPreset} className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition-colors">
                        <Plus size={12} /> {isRtl ? '+ شیری ئۆت/بادەم' : '+ Milk Choices'}
                      </button>
                      <button type="button" onClick={addFlavourPreset} className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors">
                        <Plus size={12} /> {isRtl ? '+ سیراپ/سیراپەکان' : '+ Flavours'}
                      </button>
                      <button type="button" onClick={() => addAddon()} className="text-xs font-bold bg-natural-surface border border-natural-border px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-natural-bg">
                        <Plus size={14} /> {isRtl ? 'زیادکردن' : 'Add Custom'}
                      </button>
                    </div>
                  </div>
                  
                  {formData.addons?.map((addon, index) => (
                    <div key={addon.id || index} className="flex flex-wrap gap-2 items-end bg-natural-surface p-2.5 rounded-xl border border-natural-border/60">
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی ئینگلیزی (Oat Milk)' : 'Name (EN)'} required value={addon.nameEn} onChange={e => updateAddon(index, 'nameEn', e.target.value)} className="w-full bg-natural-bg border border-natural-border rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی کوردی (شیری ئۆت)' : 'Name (KU)'} required value={addon.nameKu} onChange={e => updateAddon(index, 'nameKu', e.target.value)} className="w-full bg-natural-bg border border-natural-border rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <input type="text" placeholder={isRtl ? 'ناوی عەرەبی' : 'Name (AR)'} required value={addon.nameAr} onChange={e => updateAddon(index, 'nameAr', e.target.value)} className="w-full bg-natural-bg border border-natural-border rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-natural-accent" />
                      </div>
                      <div className="w-[100px]">
                        <input type="number" placeholder={isRtl ? 'نرخی زیادکراو' : 'Price'} required min="0" value={addon.price} onChange={e => updateAddon(index, 'price', Number(e.target.value))} className="w-full bg-natural-bg border border-natural-border rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-natural-accent font-bold" />
                      </div>
                      <button type="button" onClick={() => removeAddon(index)} className="p-1.5 text-natural-text-tertiary hover:text-rose-500 bg-natural-bg rounded-lg border border-natural-border hover:bg-rose-500/10">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {(!formData.addons || formData.addons.length === 0) && (
                    <p className="text-xs text-natural-text-tertiary text-center py-2">{isRtl ? 'هیچ زیادکراوێک زیاد نەکراوە (تکایە بەکارهێنانی دوگمەی ئامادەکراو بکه)' : 'No add-ons added yet. Click buttons above to add milk options, flavours, etc.'}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-natural-text hover:bg-natural-bg transition-colors">
                {isRtl ? 'پاشگەزبوونەوە' : 'Cancel'}
              </button>
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-5 py-2.5 rounded-xl font-medium transition-colors">
                {isRtl ? 'پاشەکەوتکردنی ئایتم' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const sortedCategories = [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const CategoryModal = () => {
    if (!isCategoryModalOpen) return null;

    const [formData, setFormData] = useState<Partial<Category>>(
      editingCategory || { nameEn: '', nameKu: '', nameAr: '', sortOrder: sortedCategories.length }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingCategory) {
        updateCategory(editingCategory.id, formData as Category);
      } else {
        addCategory({ ...formData, id: Math.random().toString(36).substr(2, 9), sortOrder: sortedCategories.length } as Category);
      }
      setEditingCategory(null);
      setFormData({ nameEn: '', nameKu: '', nameAr: '', sortOrder: sortedCategories.length + 1 });
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === sortedCategories.length - 1)) return;
      
      const newCategories = [...sortedCategories];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap the two categories in the local array
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      
      // Re-assign sequential sortOrder to all categories to fix gaps/duplicates using a batch
      reorderCategories(newCategories.map(c => c.id));
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-natural-text">
                Manage Categories
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text">
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" placeholder="English" required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="flex-1 bg-natural-bg border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
              <input type="text" placeholder="Kurdish" required value={formData.nameKu} onChange={e => setFormData({...formData, nameKu: e.target.value})} className="flex-1 bg-natural-bg border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
              <input type="text" placeholder="Arabic" required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="flex-1 bg-natural-bg border border-natural-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-natural-accent" />
            </div>
            <div className="flex justify-end gap-2">
              {editingCategory && (
                <button type="button" onClick={() => { setEditingCategory(null); setFormData({nameEn:'',nameKu:'',nameAr:''}); }} className="px-3 py-1.5 text-sm rounded-lg font-medium text-natural-text hover:bg-natural-bg transition-colors">
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-4 py-1.5 text-sm rounded-lg font-medium transition-colors">
                {editingCategory ? 'Update' : 'Add Category'}
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
            {sortedCategories.map((c, index) => (
              <div key={c.id} className="flex items-center justify-between gap-4 p-3 bg-natural-bg hover:bg-natural-surface rounded-xl border border-natural-border transition-all group shadow-sm hover:shadow-md">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-natural-surface border border-natural-border flex items-center justify-center shrink-0 font-bold text-natural-text-tertiary shadow-inner">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-natural-text truncate">{c.nameEn}</div>
                    <div className="text-xs text-natural-text-secondary truncate mt-0.5">{c.nameKu} • {c.nameAr}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-natural-surface border border-natural-border rounded-lg p-0.5">
                    <button type="button" onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1.5 text-natural-text-tertiary hover:text-natural-text hover:bg-natural-bg disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-md">
                      <ChevronUp size={16} strokeWidth={2.5} />
                    </button>
                    <div className="w-[1px] h-4 bg-natural-border mx-0.5" />
                    <button type="button" onClick={() => moveCategory(index, 'down')} disabled={index === sortedCategories.length - 1} className="p-1.5 text-natural-text-tertiary hover:text-natural-text hover:bg-natural-bg disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-md">
                      <ChevronDown size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingCategory(c); setFormData(c); }} className="p-2 text-natural-text-secondary hover:text-natural-accent hover:bg-natural-accent/10 border border-transparent hover:border-natural-accent/20 rounded-lg transition-all" title="Edit Category">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => { if(window.confirm('Delete category?')) deleteCategory(c.id); }} className="p-2 text-natural-text-secondary hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all" title="Delete Category">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-sm text-natural-text-tertiary py-4">No categories added yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <Modal />
      <CategoryModal />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('menu')}</h1>
          <p className="text-natural-text-secondary mt-1 text-sm">Manage categories and items</p>
        </div>
        <div className="flex w-full md:w-auto gap-3 flex-wrap">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-natural-surface hover:bg-natural-bg border border-natural-border text-natural-text px-4 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
            title="Manage Categories"
          >
            <FolderKanban size={20} />
            <span className="hidden sm:inline">Categories</span>
          </button>
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-natural-text-tertiary ${isRtl ? 'right-4' : 'left-4'}`} size={20} />
            <input 
              type="text" 
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-natural-bg border border-natural-border rounded-full py-2.5 focus:outline-none focus:border-natural-accent transition-colors
                ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}
              `} 
            />
          </div>
          <button 
            onClick={handleAdd}
            className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <Plus size={20} />
            <span className="font-medium hidden sm:inline">{t('add')}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-natural-dark text-natural-dark-text' 
              : 'bg-natural-surface border border-natural-border text-natural-text hover:bg-natural-bg'
          }`}
        >
          {t('all' as any) || 'All Categories'}
        </button>
        {sortedCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id 
                ? 'bg-natural-dark text-natural-dark-text' 
                : 'bg-natural-surface border border-natural-border text-natural-text hover:bg-natural-bg'
            }`}
          >
            {language === 'ku' ? cat.nameKu : language === 'ar' ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      <div className="bg-natural-surface rounded-2xl sm:rounded-3xl border border-natural-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-natural-bg border-b border-natural-border">
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>Item</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('price')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('category')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('available')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                return (
                  <tr key={item.id} className="border-b border-natural-border/50 hover:bg-natural-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.image ? (
                          <img src={item.image} alt={getItemName(item)} className="w-12 h-12 rounded-xl object-cover border border-natural-border" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-natural-bg border border-natural-border flex items-center justify-center">
                            <Coffee className="text-natural-text-tertiary" size={24}/>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-natural-text">{getItemName(item)}</p>
                          <p className="text-xs text-natural-text-tertiary">{item.nameEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-natural-text">
                      {item.variants && item.variants.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-natural-text-tertiary">Multiple prices</span>
                          <span className="text-sm">
                            {Math.min(...item.variants.map(v => v.price)).toLocaleString()} - {Math.max(...item.variants.map(v => v.price)).toLocaleString()} IQD
                          </span>
                        </div>
                      ) : (
                        <span>{item.price.toLocaleString()} IQD</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-natural-text-secondary">
                      {getCategoryName(item.categoryId)}
                    </td>
                    <td className="px-6 py-4">
                      <div 
                        onClick={() => handleToggleAvailable(item)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${item.isAvailable ? 'bg-emerald-500' : 'bg-natural-border'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-natural-surface transition-transform ${item.isAvailable ? (isRtl ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 text-natural-text-tertiary hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-natural-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-natural-text-tertiary">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal />
    </div>
  );
};
