import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Search, Trash2, Edit2, X, AlertTriangle, PackageSearch, CircleDollarSign, TrendingDown, ArrowUpDown, Clock } from 'lucide-react';
import { InventoryItem, InventoryLog } from '../types';

export const Inventory: React.FC = () => {
  const { t, isRtl, inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, inventoryLogs, adjustInventoryStock, language, user } = useAppContext();
  
  const isCashier = user?.role === 'cashier';
  const isSuperAdmin = user?.role === 'super_admin';
  const isManager = user?.role === 'admin' || user?.role === 'super_admin';
  const lowStockItems = inventory.filter(item => item.quantity <= item.minimumStock);

  const [activeTab, setActiveTab] = useState<'list' | 'log'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { id: 'cat_coffee_beans', label: t('cat_coffee_beans') },
    { id: 'cat_dairy_milk', label: t('cat_dairy_milk') },
    { id: 'cat_syrups', label: t('cat_syrups') },
    { id: 'cat_pastries', label: t('cat_pastries') },
    { id: 'cat_packaging', label: t('cat_packaging') },
    { id: 'cat_cleaning', label: t('cat_cleaning') },
    { id: 'cat_other', label: t('cat_other') }
  ];

  const units = [
    { id: 'kg', label: t('unit_kg') },
    { id: 'g', label: t('unit_g') },
    { id: 'L', label: t('unit_l') },
    { id: 'ml', label: t('unit_ml') },
    { id: 'pcs', label: t('unit_pcs') },
    { id: 'cups', label: t('unit_cups') },
    { id: 'boxes', label: t('unit_boxes') },
    { id: 'bags', label: t('unit_bags') }
  ];

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.nameKu.includes(searchTerm) ||
                            item.nameAr.includes(searchTerm);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
    const lowStockCount = inventory.filter(item => item.quantity <= item.minimumStock).length;
    
    return { totalItems, totalValue, lowStockCount };
  }, [inventory]);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isSuperAdmin) {
      alert(t("onlySuperAdminDelete") || "Only Super Admin can delete items");
      return;
    }
    if (window.confirm(t("confirmDeleteItem") || "Are you sure you want to delete this item?")) {
      deleteInventoryItem(id);
    }
  };

  const getCategoryLabel = (catId?: string) => {
    if (!catId) return t('cat_other') || 'Other';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.label : catId;
  };

  const getUnitLabel = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.label : unitId;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === 'ar' ? 'ar-IQ' : language === 'ku' ? 'ku-IQ' : 'en-US');
  };

  const AdjustModal = () => {
    if (!isAdjustModalOpen || !adjustingItem) return null;

    const [newQuantity, setNewQuantity] = useState<number>(adjustingItem.quantity);
    const [reason, setReason] = useState<InventoryLog['reason']>('restock');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Anyone can adjust stock (since it's an additive/subtractive log, not modifying the item definition)
      
      adjustInventoryStock(adjustingItem.id, newQuantity, reason, notes);
      setIsAdjustModalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text">{t("adjustStock") || "Adjust Stock"}</h2>
            <button onClick={() => setIsAdjustModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="bg-natural-bg p-4 rounded-xl border border-natural-border mb-4">
              <div className="text-sm text-natural-text-secondary">{t("itemName") || "Item Name"}</div>
              <div className="font-bold text-natural-text text-lg">
                {language === 'ku' ? adjustingItem.nameKu : language === 'ar' ? adjustingItem.nameAr : adjustingItem.nameEn}
              </div>
              <div className="mt-2 text-sm text-natural-text-secondary">{t("previousQuantity") || "Previous Quantity"}: <span className="font-bold text-natural-text">{adjustingItem.quantity} {adjustingItem.unit}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-natural-text mb-2">{t("newQuantity") || "New Quantity"} ({adjustingItem.unit})</label>
              <input type="number" required step="0.01" min="0" value={newQuantity} onChange={e => setNewQuantity(Number(e.target.value))} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-natural-text mb-2">{t("reason") || "Reason"}</label>
              <select required value={reason} onChange={e => setReason(e.target.value as InventoryLog['reason'])} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm appearance-none transition-colors">
                <option value="restock">{t('reason_restock') || 'Restock'}</option>
                <option value="wastage">{t('reason_wastage') || 'Wastage'}</option>
                <option value="correction">{t('reason_correction') || 'Correction'}</option>
                <option value="other">{t('reason_other') || 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-natural-text mb-2">{t("notes") || "Notes"}</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors" />
            </div>
            
            <div className="pt-6 border-t border-natural-border/60 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-natural-text hover:bg-natural-bg transition-colors border border-transparent hover:border-natural-border">
                {t('cancel')}
              </button>
              <button type="submit" className="bg-natural-accent hover:bg-[#b89574] text-natural-dark px-8 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const Modal = () => {
    if (!isModalOpen) return null;
    
    const [formData, setFormData] = useState<Partial<InventoryItem>>(
      editingItem || {
        nameEn: '',
        nameKu: '',
        nameAr: '',
        category: 'cat_coffee_beans',
        quantity: 0,
        unit: 'kg',
        minimumStock: 10,
        cost: 0
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!isSuperAdmin && editingItem) {
        alert(t("onlySuperAdminModify") || "Only Super Admin can modify existing items");
        return;
      }
      
      if (editingItem) {
        updateInventoryItem(editingItem.id, formData as InventoryItem);
      } else {
        const newItem = { ...formData, id: Math.random().toString(36).substr(2, 9) } as InventoryItem;
        addInventoryItem(newItem);
        if (newItem.quantity > 0) {
          adjustInventoryStock(newItem.id, newItem.quantity, 'restock', 'Initial stock');
        }
      }
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-light text-natural-text">{editingItem ? t("editItem") || "Edit Item" : t("addInventoryItem")}</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Names */}
              <div className="space-y-4 p-5 bg-natural-bg rounded-2xl border border-natural-border">
                <h3 className="text-sm font-bold text-natural-text-secondary uppercase tracking-wider mb-4 border-b border-natural-border pb-2">{t("itemNames") || "Item Names"}</h3>
                <div>
                  <label className="block text-sm font-medium text-natural-text mb-2">{t("nameEn") || "Name (English)"}</label>
                  <input type="text" required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-natural-text mb-2">{t("nameKu") || "Name (Kurdish)"}</label>
                  <input type="text" required value={formData.nameKu} onChange={e => setFormData({...formData, nameKu: e.target.value})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm text-right transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-natural-text mb-2">{t("nameAr") || "Name (Arabic)"}</label>
                  <input type="text" required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm text-right transition-colors" />
                </div>
              </div>
              
              {/* Right Column: Details */}
              <div className="space-y-4 p-5 bg-natural-bg rounded-2xl border border-natural-border">
                <h3 className="text-sm font-bold text-natural-text-secondary uppercase tracking-wider mb-4 border-b border-natural-border pb-2">{t("stockDetails") || "Stock Details"}</h3>
                
                <div>
                  <label className="block text-sm font-medium text-natural-text mb-2">{t('inventoryCategory')}</label>
                  <select required value={formData.category || 'cat_other'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm appearance-none transition-colors">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-natural-text mb-2">{t('quantity')}</label>
                    <input type="number" required min="0" step="0.01" value={formData.quantity} disabled={!!editingItem} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors disabled:opacity-50" />
                    {editingItem && <p className="text-xs text-natural-text-tertiary mt-1">{t("useAdjust") || "Use 'Adjust' to change quantity."}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-natural-text mb-2">{t('unit')}</label>
                    <select required value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm appearance-none transition-colors">
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-natural-text mb-2">{t('minimumStock')}</label>
                    <input type="number" required min="0" step="0.01" value={formData.minimumStock} onChange={e => setFormData({...formData, minimumStock: Number(e.target.value)})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-natural-text mb-2">{t('cost')} / {t('unit')}</label>
                    <input type="number" required min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full bg-natural-surface border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent shadow-sm transition-colors" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-natural-border/60 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-natural-text hover:bg-natural-bg transition-colors border border-transparent hover:border-natural-border">
                {t('cancel')}
              </button>
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      
      {/* Low Stock Alerts */}
      {isManager && lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl sm:rounded-[2rem] flex items-start gap-4 mb-2 shadow-sm">
          <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-800 text-lg">Low Stock Alert</h3>
            <p className="text-red-600 text-sm mt-1">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'item is' : 'items are'} running low on stock. Please check the inventory.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lowStockItems.slice(0, 5).map(item => (
                <span key={item.id} className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-xl font-bold border border-red-200">
                  {language === 'en' ? item.nameEn : language === 'ar' ? item.nameAr : item.nameKu} ({item.quantity} {item.unit})
                </span>
              ))}
              {lowStockItems.length > 5 && (
                <span className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-xl font-bold border border-red-200">+{lowStockItems.length - 5} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-natural-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <PackageSearch size={24} />
          </div>
          <div>
            <p className="text-natural-text-secondary text-sm font-medium">{t('totalItems') || 'Total Items'}</p>
            <p className="text-2xl font-bold text-natural-text">{stats.totalItems}</p>
          </div>
        </div>
        
        <div className="bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-natural-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <p className="text-natural-text-secondary text-sm font-medium">{t('totalValue') || 'Total Value'}</p>
            <p className="text-2xl font-bold text-natural-text">{stats.totalValue.toLocaleString()} IQD</p>
          </div>
        </div>

        <div className="bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-natural-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-natural-text-secondary text-sm font-medium">{t('lowStock') || 'Low Stock'}</p>
            <p className="text-2xl font-bold text-natural-text">{stats.lowStockCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-natural-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('inventory')}</h1>
          
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setActiveTab('list')}
              className={`pb-2 font-medium transition-colors ${activeTab === 'list' ? 'text-natural-dark border-b-2 border-natural-dark' : 'text-natural-text-tertiary hover:text-natural-text-secondary'}`}
            >
              {t('inventoryList') || 'Inventory List'}
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`pb-2 font-medium transition-colors ${activeTab === 'log' ? 'text-natural-dark border-b-2 border-natural-dark' : 'text-natural-text-tertiary hover:text-natural-text-secondary'}`}
            >
              {t('inventoryLog') || 'Inventory Log'}
            </button>
          </div>
        </div>
        
        {activeTab === 'list' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent shadow-sm appearance-none"
            >
              <option value="All">{language === 'ku' ? 'هەموو' : language === 'ar' ? 'الكل' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} text-natural-text-tertiary`} size={20} />
              <input
                type="text"
                placeholder={t('search') || 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} focus:outline-none focus:border-natural-accent shadow-sm`}
              />
            </div>
            <button onClick={handleAdd} className="bg-natural-accent hover:bg-[#b89574] text-natural-dark px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
                <Plus size={20} /> {t('addInventoryItem')}
              </button>
          </div>
        )}
      </div>

      <div className="bg-natural-surface rounded-2xl sm:rounded-[2rem] border border-natural-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'list' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-natural-bg border-b border-natural-border">
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('itemName')}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('inventoryCategory') || 'Category'}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('quantity')}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('cost')}</th>
                  <th className="px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center w-32">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-natural-text-tertiary">
                      {t('noInventoryData') || 'No inventory items found'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="border-b border-natural-border/50 hover:bg-natural-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-natural-text">
                          {language === 'ku' ? item.nameKu : language === 'ar' ? item.nameAr : item.nameEn}
                        </div>
                        <div className="text-xs text-natural-text-secondary mt-1">
                          {language !== 'en' ? item.nameEn : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full bg-natural-bg text-natural-text-secondary text-xs font-medium border border-natural-border/50">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.quantity <= item.minimumStock ? 'text-red-500' : 'text-natural-text'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-natural-text-secondary text-sm">{getUnitLabel(item.unit)}</span>
                          {item.quantity <= item.minimumStock && (
                            <AlertTriangle size={16} className="text-red-500" title="Low stock" />
                          )}
                        </div>
                        <div className="text-xs text-natural-text-tertiary mt-1">
                          Min: {item.minimumStock} {getUnitLabel(item.unit)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-natural-text">{item.cost.toLocaleString()} IQD</div>
                        <div className="text-xs text-natural-text-secondary mt-1">
                          Total: {(item.quantity * item.cost).toLocaleString()} IQD
                        </div>
                      </td>
                                            <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAdjust(item)}
                            className="text-blue-500 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-blue-50"
                            title={t('adjustStock') || "Adjust Stock"}
                          >
                            <ArrowUpDown size={18} />
                          </button>
                          {isSuperAdmin && (
                            <>
                              <button 
                                onClick={() => handleEdit(item)}
                                className="text-natural-text hover:text-natural-accent transition-colors p-2 rounded-xl hover:bg-natural-bg"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-natural-bg border-b border-natural-border">
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('timestamp') || 'Time'}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('itemName')}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('user') || 'User'}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('reason') || 'Reason'}</th>
                  <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center`}>{t('change') || 'Change'}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-natural-text-tertiary">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  inventoryLogs.map(log => {
                    const diff = log.newQuantity - log.previousQuantity;
                    const diffText = diff > 0 ? `+${diff}` : diff;
                    const diffColor = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-natural-text-tertiary';
                    
                    return (
                      <tr key={log.id} className="border-b border-natural-border/50 hover:bg-natural-bg/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-natural-text-secondary whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 font-medium text-natural-text">
                          {log.itemName}
                        </td>
                        <td className="px-6 py-4 text-sm text-natural-text-secondary">
                          {log.userName}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full bg-natural-bg text-natural-text-secondary text-xs font-medium border border-natural-border/50">
                            {t(`reason_${log.reason}` as any) || log.reason}
                          </span>
                          {log.notes && (
                            <div className="text-xs text-natural-text-tertiary mt-1 italic">{log.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`font-bold ${diffColor}`}>
                            {diffText}
                          </div>
                          <div className="text-xs text-natural-text-tertiary mt-1">
                            {log.previousQuantity} → {log.newQuantity}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal />
      <AdjustModal />
    </div>
  );
};
