import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Users as UsersIcon, Plus, Edit, Trash2, Shield, X , Coffee } from 'lucide-react';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export const Users: React.FC = () => {
  const { t, isRtl, users, addUser, updateUser, deleteUser, shifts } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDeleteUser') || 'Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const Modal = () => {
    if (!isModalOpen) return null;

    const [formData, setFormData] = useState<Partial<User>>(
      editingUser || {
        name: '', username: '', email: '', role: 'cashier'
      }
    );
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
        await updateUser(editingUser.id, formData as User);
      } else {
        await addUser({ ...formData, id: '' } as User, password);
      }
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-natural-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-natural-text">
              {editingUser ? (t('editUser') || 'Edit User') : (t('addNewUser') || 'Add New User')}
            </h2>
            <button onClick={() => setIsModalOpen(false)} className="text-natural-text-tertiary hover:text-natural-text">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-natural-text mb-1">Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-natural-text mb-1">Username</label>
              <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-natural-text mb-1">Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-natural-text mb-1">Password</label>
                <input type="password" required={!editingUser} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-natural-text mb-1">Role</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full bg-natural-bg border border-natural-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-natural-accent">
                <option value="cashier">{t('cashier') || 'Cashier'}</option>
                <option value="waiter">{t('waiter') || 'Waiter'}</option>
                <option value="admin">{t('admin') || 'Admin'}</option>
                <option value="super_admin">{t('super_admin') || 'Super Admin'}</option>
              </select>
            </div>
            
            {formData.role !== 'super_admin' && (
              <div>
                <label className="block text-sm font-medium text-natural-text mb-2">{t('permissions') || 'Access Permissions'}</label>
                <div className="grid grid-cols-2 gap-2 bg-natural-bg p-3 rounded-xl border border-natural-border">
                  {[
                    { id: 'dashboard', label: t('dashboard') || 'Dashboard' },
                    { id: 'pos', label: t('pos') || 'POS' },
                    { id: 'menu', label: t('menu') || 'Menu & Categories' },
                    { id: 'tables', label: t('tables') || 'View Tables' },
                    { id: 'tables_manage', label: t('tables_manage') || 'Manage Tables (Add/Edit)' },
                    { id: 'tables_move', label: t('tables_move') || 'Move Customer Orders' },
                    { id: 'expenses', label: t('expenses') || 'Expenses' },
                    { id: 'receipts', label: t('receipts') || 'Receipts' },
                    { id: 'reports', label: t('reports') || 'Reports' },
                    { id: 'shifts', label: isRtl ? 'دەوام و ئامادەبوون' : 'Shifts & Attendance' },
                    { id: 'settings', label: t('settings') || 'Settings' }
                  ].map(section => {
                    const isChecked = (formData.permissions || []).includes(section.id);
                    return (
                      <label key={section.id} className="flex items-center gap-2 cursor-pointer p-1">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const currentPerms = formData.permissions || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, permissions: [...currentPerms, section.id] });
                            } else {
                              setFormData({ ...formData, permissions: currentPerms.filter(p => p !== section.id) });
                            }
                          }}
                          className="rounded text-natural-accent focus:ring-natural-accent"
                        />
                        <span className="text-sm text-natural-text-secondary">{section.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.role === 'super_admin' && (
              <div className="mt-3 p-3 bg-natural-bg border border-natural-border rounded-xl">
                <h4 className="text-xs font-bold text-natural-text-secondary uppercase mb-2">{t('permissions') || 'Role Permissions'}:</h4>
                <ul className="text-sm text-natural-text-tertiary space-y-1">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-natural-accent"></span> {t('fullSystemAccess') || 'Full System Access'}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-natural-accent"></span> {t('manageUsersPerms') || 'Manage Users & Permissions'}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-natural-accent"></span> {t('viewFinancialReports') || 'View Financial Reports'}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-natural-accent"></span> {t('systemSettings') || 'System Settings'}</li>
                </ul>
              </div>
            )}
            
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-natural-text hover:bg-natural-bg transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-5 py-2.5 rounded-xl font-medium transition-colors">
                Save User
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('users')}</h1>
          <p className="text-natural-text-secondary mt-1 text-sm">Manage system users and their roles</p>
        </div>
        <button onClick={handleAdd} className="bg-natural-dark hover:opacity-90 text-natural-dark-text px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm active:scale-95">
          <Plus size={20} />
          <span className="font-medium">{t('add')}</span>
        </button>
      </div>

      
      {/* Performance Metrics Section */}
      <div className="bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-natural-dark mb-6">{t('performanceMetrics') || 'Staff Performance Metrics'}</h2>
        
        {(() => {
          const userMetrics = users.map(user => {
            const userShifts = shifts.filter(s => s.userId === user.id);
            const totalOrders = userShifts.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
            const totalSales = userShifts.reduce((sum, s) => sum + (s.totalSales || 0), 0);
            return {
              name: user.name,
              role: user.role,
              totalOrders,
              totalSales,
              label: `${user.name} (${t(user.role as any) || user.role})`
            };
          }).filter(u => ['cashier', 'waiter'].includes(u.role) && (u.totalOrders > 0 || u.totalSales > 0));

          if (userMetrics.length === 0) {
            return (
              <div className="text-center py-8 text-natural-text-tertiary">
                <p>No performance data available yet.</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-natural-text-secondary mb-4 text-center">{t('totalOrdersVolume') || 'Total Orders Processed'}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="totalOrders" name={t('totalOrders') || "Total Orders"} radius={[6, 6, 0, 0]}>
                        {userMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.role === 'waiter' ? '#f97316' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-natural-text-secondary mb-4 text-center">{t('salesVolume') || 'Total Sales Volume (IQD)'}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={80} tickFormatter={(value) => `${(value / 1000)}k`} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => [`${Number(value).toLocaleString()} IQD`, t('salesValue') || 'Sales Value']}
                      />
                      <Bar dataKey="totalSales" name={t('salesValue') || "Sales Value"} radius={[6, 6, 0, 0]}>
                        {userMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.role === 'waiter' ? '#f97316' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      
      <div className="bg-natural-surface rounded-2xl sm:rounded-3xl border border-natural-border overflow-hidden shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-natural-bg border-b border-natural-border">
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('name')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('username')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('email') || 'Email'}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('role')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-natural-border/50 hover:bg-natural-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-natural-accent/20 flex items-center justify-center text-natural-dark font-bold uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-natural-text">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-natural-text-secondary">@{user.username}</td>
                  <td className="px-6 py-4 text-natural-text-secondary">{user.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize
                      ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : ''}
                      ${user.role === 'admin' ? 'bg-blue-100 text-blue-700' : ''}
                      ${user.role === 'cashier' ? 'bg-green-100 text-green-700' : ''}
                      ${user.role === 'waiter' ? 'bg-orange-100 text-orange-700' : ''}
                    `}>
                      {user.role === 'super_admin' && <Shield size={12} />}
                      {user.role === 'waiter' && <Coffee size={12} />}
                      {t(user.role as any) || user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 text-natural-text-tertiary hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-natural-text-tertiary hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-natural-text-tertiary">
                    No users found.
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
