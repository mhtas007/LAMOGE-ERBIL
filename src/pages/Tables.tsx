import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Clock, Plus, Edit, Trash2, Users, ShoppingBag, X, ArrowRightLeft, Combine, Unlink } from 'lucide-react';
import { Table } from '../types';
import { TableMap } from '../components/TableMap';
import { LayoutGrid, Map as MapIcon, Edit2, Check } from 'lucide-react';


const TableTimer: React.FC<{ occupiedAt?: string }> = ({ occupiedAt }) => {
  const [elapsed, setElapsed] = React.useState<number>(0);

  React.useEffect(() => {
    if (!occupiedAt) return;
    const interval = setInterval(() => {
      const start = new Date(occupiedAt).getTime();
      const now = new Date().getTime();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    }, 1000);
    // Initial calculate
    const start = new Date(occupiedAt).getTime();
    setElapsed(Math.max(0, Math.floor((new Date().getTime() - start) / 1000)));

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  
  // Warning if > 60 minutes
  const isWarning = elapsed > 3600;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isWarning ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-natural-surface text-natural-text-secondary border border-natural-border'}`}>
      <Clock size={12} className={isWarning ? 'animate-pulse' : ''} />
      <span>{hours > 0 ? `${hours}h ` : ''}{minutes}m</span>
    </div>
  );
};

export const Tables: React.FC = () => {
  const { t, isRtl, currentShift, tables, activeTableOrders, setSelectedTableId, navigate, addTable, updateTable, deleteTable, moveTableOrder, mergeTables, unmergeTable, user } = useAppContext();
  
  const canManageTables = user?.role === 'super_admin' || user?.permissions?.includes('tables_manage');
  const canMoveTables = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'cashier' || user?.permissions?.includes('tables_move') || canManageTables;
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingTableId, setMovingTableId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergingTableId, setMergingTableId] = useState<string | null>(null);

  const [isRenamingFloor, setIsRenamingFloor] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isEditMode, setIsEditMode] = useState(false);

  // Extract unique floors
  const floors = Array.from(new Set(tables.map(t => t.floor).filter(Boolean)));

  const handleRenameFloor = () => {
    if (!newFloorName.trim() || newFloorName.trim() === selectedFloor || selectedFloor === 'all') return;
    
    // Find all tables in the selected floor and update their floor name
    const tablesInFloor = tables.filter(t => t.floor === selectedFloor);
    tablesInFloor.forEach(table => {
      updateTable(table.id, { ...table, floor: newFloorName.trim() });
    });
    
    setSelectedFloor(newFloorName.trim());
    setIsRenamingFloor(false);
    setNewFloorName('');
  };

  const handleTableClick = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table?.mergedWithId) {
      setSelectedTableId(table.mergedWithId);
    } else {
      setSelectedTableId(tableId);
    }
    navigate('pos');
  };

  const handleAdd = () => {
    setEditingTable(null);
    setIsModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    setEditingTable(table);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this table?')) {
      deleteTable(id);
    }
  };

  const filteredTables = selectedFloor === 'all' 
    ? tables 
    : tables.filter(t => t.floor === selectedFloor);

  const Modal = () => {
    if (!isModalOpen) return null;

    const [isAddingNewFloor, setIsAddingNewFloor] = useState(false);
    const [newFloorName, setNewFloorName] = useState('');

    const [formData, setFormData] = useState<Partial<Table>>(
      editingTable || {
        number: tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1,
        capacity: 4,
        shape: 'round',
        status: 'available',
        floor: floors.length > 0 ? floors[0] : '1'
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const finalFormData = { ...formData };
      if (isAddingNewFloor && newFloorName.trim()) {
        finalFormData.floor = newFloorName.trim();
      }

      if (editingTable) {
        if (finalFormData.status === 'occupied' && editingTable.status !== 'occupied') {
          finalFormData.occupiedAt = new Date().toISOString();
        } else if (finalFormData.status === 'available') {
          finalFormData.occupiedAt = null;
        }
        updateTable(editingTable.id, finalFormData as Table);
      } else {
        if (finalFormData.status === 'occupied') {
          finalFormData.occupiedAt = new Date().toISOString();
        }
        addTable({ ...finalFormData, id: Math.random().toString(36).substr(2, 9) } as Table);
      }
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-natural-border">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-natural-text">
                {editingTable ? t('editTable') : t('newTable')}
              </h2>
              <p className="text-sm text-natural-text-tertiary mt-1">{t('tableSettingsDesc')}</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="bg-natural-bg p-2 rounded-full text-natural-text-tertiary hover:text-natural-text hover:bg-natural-border transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-natural-text mb-2">{t('tableNumber')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-natural-text-tertiary font-bold">T</span>
                  </div>
                  <input type="number" required min="1" value={formData.number} onChange={e => setFormData({...formData, number: Number(e.target.value)})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-3 pl-8 pr-4 focus:outline-none focus:border-natural-accent font-medium transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-natural-text mb-2">{t('capacity')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Users size={16} className="text-natural-text-tertiary" />
                  </div>
                  <input type="number" required min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:border-natural-accent font-medium transition-colors" />
                </div>
              </div>
            </div>

            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-natural-text mb-2">{isRtl ? 'شێوەی مێز' : 'Table Shape'}</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, shape: 'round'})} className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.shape === 'round' || (!formData.shape && formData.capacity <= 4) ? 'bg-natural-dark text-natural-dark-text border-natural-dark' : 'bg-natural-bg text-natural-text-tertiary border-natural-border hover:border-natural-accent'}`}>
                    <div className="w-8 h-8 rounded-full border-2 border-current"></div>
                    <span className="text-xs font-bold">{isRtl ? 'بازنەیی' : 'Round'}</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, shape: 'square'})} className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.shape === 'square' ? 'bg-natural-dark text-natural-dark-text border-natural-dark' : 'bg-natural-bg text-natural-text-tertiary border-natural-border hover:border-natural-accent'}`}>
                    <div className="w-8 h-8 rounded-lg border-2 border-current"></div>
                    <span className="text-xs font-bold">{isRtl ? 'چوارگۆشە' : 'Square'}</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, shape: 'rectangle'})} className={`py-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.shape === 'rectangle' || (!formData.shape && (formData.capacity || 4) > 4) ? 'bg-natural-dark text-natural-dark-text border-natural-dark' : 'bg-natural-bg text-natural-text-tertiary border-natural-border hover:border-natural-accent'}`}>
                    <div className="w-10 h-8 rounded-lg border-2 border-current"></div>
                    <span className="text-xs font-bold">{isRtl ? 'لاکێشە' : 'Rectangle'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-natural-text mb-2">{t('floorSection')}</label>
                {isAddingNewFloor ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      value={newFloorName} 
                      onChange={e => setNewFloorName(e.target.value)} 
                      className="flex-1 bg-natural-bg border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent font-medium transition-colors" 
                      placeholder="{t('floorEg')}" 
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewFloor(false)} 
                      className="px-4 py-3 bg-natural-bg border border-natural-border rounded-xl text-natural-text-tertiary hover:text-natural-text hover:bg-natural-border transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select 
                    required 
                    value={formData.floor} 
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewFloor(true);
                      } else {
                        setFormData({...formData, floor: e.target.value});
                      }
                    }} 
                    className="w-full bg-natural-bg border border-natural-border rounded-xl py-3 px-4 focus:outline-none focus:border-natural-accent font-medium transition-colors appearance-none cursor-pointer"
                  >
                    {floors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                    {floors.length === 0 && <option value="1">1</option>}
                    <option value="__NEW__">{t('addNewFloor')}</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-natural-text mb-2">{t('status')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'available'})}
                    className={`py-3 rounded-xl border font-bold text-sm transition-colors ${formData.status === 'available' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-natural-bg border-natural-border text-natural-text-tertiary hover:border-natural-accent'}`}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'reserved'})}
                    className={`py-3 rounded-xl border font-bold text-sm transition-colors ${formData.status === 'reserved' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-natural-bg border-natural-border text-natural-text-tertiary hover:border-natural-accent'}`}
                  >
                    Reserved
                  </button>
                  <button
                    type="button"
                    disabled={!editingTable}
                    onClick={() => setFormData({...formData, status: 'occupied'})}
                    className={`py-3 rounded-xl border font-bold text-sm transition-colors ${formData.status === 'occupied' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-natural-bg border-natural-border text-natural-text-tertiary hover:border-natural-accent disabled:opacity-50 disabled:cursor-not-allowed'}`}
                  >
                    Occupied
                  </button>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-natural-border flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-natural-text bg-natural-bg hover:bg-natural-border border border-natural-border transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-natural-accent hover:bg-[#b89574] text-natural-dark px-8 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-sm">
                Save Table
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  
  const MergeModal = () => {
    if (!isMergeModalOpen || !mergingTableId) return null;
    const fromTable = tables.find(t => t.id === mergingTableId);
    if (!fromTable) return null;
    
    // Can merge into occupied tables
    const targetTables = tables.filter(t => t.id !== mergingTableId && t.status === 'occupied' && !t.mergedWithId);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text">
              Merge Table T{fromTable.number}
            </h2>
            <button onClick={() => { setIsMergeModalOpen(false); setMergingTableId(null); }} className="text-natural-text-tertiary hover:text-natural-text">
              <X size={24} />
            </button>
          </div>

          {targetTables.length === 0 ? (
            <div className="text-center py-6 text-natural-text-secondary bg-natural-bg rounded-xl border border-natural-border">
              No occupied tables to merge with.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-sm text-natural-text-secondary">Select table to merge with:</p>
              <div className="grid grid-cols-2 gap-3">
                {targetTables.map(targetTable => (
                  <button
                    key={targetTable.id}
                    onClick={() => {
                      mergeTables(mergingTableId, targetTable.id);
                      setIsMergeModalOpen(false);
                      setMergingTableId(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-natural-border bg-natural-bg hover:border-indigo-500 hover:shadow-md transition-all text-left"
                  >
                    <div>
                      <div className="font-bold text-natural-text">T{targetTable.number}</div>
                      <div className="text-xs text-natural-text-tertiary">Floor {targetTable.floor}</div>
                    </div>
                    <div className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      <Combine size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


  const MoveModal = () => {
    if (!isMoveModalOpen || !movingTableId) return null;

    const fromTable = tables.find(t => t.id === movingTableId);
    if (!fromTable) return null;

    const availableTables = tables.filter(t => t.id !== movingTableId && t.status === 'available');

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text">
              Move Table T{fromTable.number}
            </h2>
            <button onClick={() => { setIsMoveModalOpen(false); setMovingTableId(null); }} className="text-natural-text-tertiary hover:text-natural-text">
              <X size={24} />
            </button>
          </div>

          {availableTables.length === 0 ? (
            <div className="text-center py-6 text-natural-text-secondary bg-natural-bg rounded-xl border border-natural-border">
              No available tables to move to.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-sm text-natural-text-secondary">{t('selectDestTable')}</p>
              <div className="grid grid-cols-2 gap-3">
                {availableTables.map(targetTable => (
                  <button
                    key={targetTable.id}
                    onClick={() => {
                      moveTableOrder(movingTableId, targetTable.id);
                      setIsMoveModalOpen(false);
                      setMovingTableId(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-natural-border bg-natural-bg hover:border-natural-accent hover:shadow-md transition-all text-left"
                  >
                    <div>
                      <div className="font-bold text-natural-text">T{targetTable.number}</div>
                      <div className="text-xs text-natural-text-tertiary">{t('floor')} {targetTable.floor}</div>
                    </div>
                    <div className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {targetTable.capacity}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };


  if (!currentShift) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-24 h-24 bg-natural-bg rounded-full flex items-center justify-center text-natural-text-tertiary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-light text-natural-dark">Shift Not Started</h2>
        <p className="text-natural-text-secondary max-w-md">You need to start your shift before you can access the point of sale or manage tables. Please clock in using the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('tables')}</h1>
          <p className="text-natural-text-secondary mt-1 text-sm">{t('tableManageDesc')}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-natural-bg p-1 rounded-xl border border-natural-border mr-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-natural-dark text-natural-dark-text shadow-sm' : 'text-natural-text-tertiary hover:text-natural-text'}`}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">{isRtl ? 'لیست' : 'Grid'}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-natural-dark text-natural-dark-text shadow-sm' : 'text-natural-text-tertiary hover:text-natural-text'}`}
            >
              <MapIcon size={16} />
              <span className="hidden sm:inline">{isRtl ? 'نەخشە' : 'Map'}</span>
            </button>
          </div>
          {viewMode === 'map' && canManageTables && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 ${isEditMode ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-natural-surface border border-natural-border hover:border-natural-dark text-natural-text'}`}
            >
              {isEditMode ? <Check size={18} /> : <Edit2 size={18} />}
              {isEditMode ? (isRtl ? 'پاشەکەوتکردن' : 'Done') : (isRtl ? 'دەستکاری نەخشە' : 'Edit Map')}
            </button>
          )}
          {canManageTables && viewMode === 'grid' && (
            <button onClick={handleAdd} className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm active:scale-95">
              <Plus size={20} />
              <span className="font-medium">{t('add')}</span>
            </button>
          )}
        </div>
      </div>

      {floors.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-bg p-3 rounded-2xl border border-natural-border">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => { setSelectedFloor('all'); setIsRenamingFloor(false); }}
              className={`px-5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap shadow-sm
                ${selectedFloor === 'all' ? 'bg-natural-dark text-natural-dark-text' : 'bg-natural-surface border border-natural-border text-natural-text hover:border-natural-accent'}`}
            >
              {t('allFloors')}
            </button>
            {floors.map(floor => (
              <button
                key={floor}
                onClick={() => { setSelectedFloor(floor); setIsRenamingFloor(false); }}
                className={`px-5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap shadow-sm
                  ${selectedFloor === floor ? 'bg-natural-dark text-natural-dark-text' : 'bg-natural-surface border border-natural-border text-natural-text hover:border-natural-accent'}`}
              >
                {t('floor')} {floor}
              </button>
            ))}
          </div>

          {selectedFloor !== 'all' && canManageTables && (
            <div className="flex items-center gap-2">
              {isRenamingFloor ? (
                <div className="flex items-center gap-2 bg-natural-surface p-1 rounded-xl border border-natural-accent">
                  <input
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    placeholder="{t('newFloorNamePlaceholder')}"
                    className="bg-transparent border-none focus:outline-none px-3 py-1 text-sm font-medium w-32"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameFloor()}
                  />
                  <button onClick={handleRenameFloor} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => setIsRenamingFloor(false)} className="p-1.5 bg-natural-border text-natural-text-secondary rounded-lg hover:bg-natural-border-dark">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsRenamingFloor(true); setNewFloorName(selectedFloor); }}
                  className="px-3 py-2 text-sm font-medium text-natural-text-secondary hover:text-natural-dark hover:bg-natural-border rounded-xl transition-colors flex items-center gap-2"
                >
                  <Edit size={14} /> {t('renameFloor')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="h-[65vh] min-h-[500px]">
          <TableMap 
            tables={filteredTables} 
            isEditMode={isEditMode} 
            onTableClick={handleTableClick}
            onTableUpdate={updateTable}
            onEditTable={(table) => handleEdit({ stopPropagation: () => {} } as any, table)}
          />
        </div>
      ) : (
        filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-natural-surface rounded-3xl border border-dashed border-natural-border p-8 text-center">
            <LayoutGrid size={48} className="text-natural-text-tertiary opacity-30 mb-4" />
            <h3 className="text-xl font-bold text-natural-text mb-2">{isRtl ? 'هیچ مێزێک نییە' : 'No tables found'}</h3>
            <p className="text-natural-text-secondary max-w-sm">
              {isRtl ? 'هیچ مێزێک لێرە نییە، تکایە مێزێکی نوێ زیاد بکە.' : 'There are no tables in this area. You can add new tables to manage them.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5">
            {filteredTables.map((table) => {
              const activeOrder = activeTableOrders[table.id] || [];
              const totalAmount = activeOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const itemCount = activeOrder.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <div 
                  key={table.id} 
                  onClick={() => handleTableClick(table.id)}
                  className={`group rounded-2xl border p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[11rem] bg-natural-surface ${
                    table.status === 'available' 
                      ? 'border-natural-border hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50/5' 
                      : table.status === 'occupied' 
                      ? 'border-rose-100 hover:border-rose-300 bg-gradient-to-br from-white to-rose-50/5' 
                      : 'border-amber-100 hover:border-amber-300 bg-gradient-to-br from-white to-amber-50/5'
                  }`}
                >
                  {/* Subtle Colored Top Border for clear accent */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                    table.status === 'available' ? 'bg-emerald-500' : table.status === 'occupied' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />

                  {/* Top Section: Badge, Floor and Capacity */}
                  <div className="flex justify-between items-start gap-1.5 mt-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all shadow-sm ${
                        table.status === 'available' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : table.status === 'occupied' 
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm' 
                          : 'bg-amber-500 text-white border-amber-400 shadow-sm'
                      }`}>
                        T{table.number}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-natural-text-tertiary uppercase tracking-widest leading-none">{t('floor')} {table.floor}</span>
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-0.5 mt-0.5">
                          <Users size={10} className="text-natural-text-tertiary" /> {table.capacity}
                        </span>
                      </div>
                    </div>

                    <span className={`font-bold capitalize text-[9px] px-1.5 py-0.5 rounded-md border tracking-wider leading-none shadow-sm
                      ${table.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                      ${table.status === 'occupied' ? 'bg-rose-50 text-rose-700 border-rose-100' : ''}
                      ${table.status === 'reserved' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                    `}>
                      {t(table.status as any)}
                    </span>
                  </div>

                  {/* Middle Info Block: Price or Status details (Smaller, cleaner) */}
                  <div className="my-2.5 py-1.5 border-t border-b border-dashed border-natural-border flex-1 flex flex-col justify-center">
                    {table.mergedWithId ? (
                      <div className="bg-indigo-50/40 p-1.5 rounded-lg border border-indigo-100/50 flex items-center gap-1.5 justify-center">
                        <Combine size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-bold text-indigo-700">{t('linkedTo') || 'Linked'} T{tables.find(t => t.id === table.mergedWithId)?.number}</span>
                      </div>
                    ) : table.status === 'occupied' ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="text-natural-text font-extrabold text-xs sm:text-sm tracking-tight leading-none">{totalAmount.toLocaleString()} IQD</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[10px] text-natural-text-secondary font-medium flex items-center gap-0.5">
                            <ShoppingBag size={10} className="text-rose-500" /> {itemCount} {t('items')}
                          </div>
                          <TableTimer occupiedAt={table.occupiedAt} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-start text-natural-text-tertiary py-0.5">
                        <span className="text-[9px] font-semibold tracking-wider uppercase">{table.status === 'available' ? t('available') : t('reserved')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Always Visible Touch-friendly action buttons */}
                  <div className="flex gap-1 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                    {table.status === 'occupied' && canMoveTables && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMovingTableId(table.id);
                          setIsMoveModalOpen(true);
                        }} 
                        className="p-1.5 bg-natural-bg hover:bg-amber-50 border border-natural-border hover:border-amber-200 text-slate-600 hover:text-amber-700 rounded-lg transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        title={t('moveTable') || 'Move Table'}
                      >
                        <ArrowRightLeft size={11} />
                      </button>
                    )}
                    {table.status === 'occupied' && !table.mergedWithId && canMoveTables && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergingTableId(table.id);
                          setIsMergeModalOpen(true);
                        }}
                        className="p-1.5 bg-natural-bg hover:bg-indigo-50 border border-natural-border hover:border-indigo-200 text-slate-600 hover:text-indigo-700 rounded-lg transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        title={t('mergeTable') || 'Merge Table'}
                      >
                        <Combine size={11} />
                      </button>
                    )}
                    {table.mergedWithId && canMoveTables && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(window.confirm('Are you sure you want to unmerge this table?')) {
                            unmergeTable(table.id);
                          }
                        }}
                        className="p-1.5 bg-natural-bg hover:bg-orange-50 border border-natural-border hover:border-orange-200 text-slate-600 hover:text-orange-700 rounded-lg transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        title={t('unmergeTable') || 'Unmerge Table'}
                      >
                        <Unlink size={11} />
                      </button>
                    )}
                    {canManageTables && (
                      <>
                        <button 
                          onClick={(e) => handleEdit(e, table)} 
                          className="p-1.5 bg-natural-bg hover:bg-blue-50 border border-natural-border hover:border-blue-200 text-slate-600 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        >
                          <Edit size={11} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, table.id)} 
                          className="p-1.5 bg-natural-bg hover:bg-red-50 border border-natural-border hover:border-red-200 text-slate-600 hover:text-red-700 rounded-lg transition-all shadow-sm active:scale-90 flex items-center justify-center"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}
      <Modal />
      <MoveModal />
      <MergeModal />
    </div>
  );
};
