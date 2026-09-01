import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Search, Printer, X, Eye } from 'lucide-react';
import { Order } from '../types';
import { Receipt } from '../components/Receipt';

export const Receipts: React.FC = () => {
  const { t, isRtl, recentOrders, language } = useAppContext();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'ku') {
      const kDays = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
      const kMonths = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
      const day = kDays[date.getDay()];
      const dayNum = date.getDate();
      const month = kMonths[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'ئێوارە' : 'بەیانی';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${day}، ${dayNum} ${month} ${year} - ${hours}:${minutesStr} ${ampm}`;
    }
    return date.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US');
  };

  const filteredOrders = recentOrders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const inv = (order.invoiceCode || '').toLowerCase();
    const id = (order.id || '').toLowerCase();
    return inv.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('receipts')}</h1>
          <p className="text-natural-text-secondary mt-1 text-sm">{t('receiptsDesc') || 'View and print past order receipts'}</p>
        </div>

        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder={isRtl ? 'گەڕان بەپێی ژمارەی وەسڵ...' : 'Search by invoice / ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-natural-bg border border-natural-border rounded-xl py-2 px-3.5 pl-9 text-sm focus:outline-none focus:border-natural-dark transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-natural-text-tertiary pointer-events-none" />
        </div>
      </div>

      <div className="bg-natural-surface rounded-2xl sm:rounded-[2rem] border border-natural-border overflow-hidden shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-natural-bg border-b border-natural-border">
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('invoiceCode')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('items')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('paymentMethod')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('totalAmount')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-natural-text-tertiary">
                    {t('noReceipts') || 'No receipts found'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-natural-border/50 hover:bg-natural-bg/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-natural-text">
                      {order.invoiceCode || `#${order.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-natural-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full bg-natural-bg text-natural-text-secondary text-xs font-medium">
                        {order.items.length} {t('items')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-natural-text-secondary">{order.paymentMethod}</td>
                    <td className="px-6 py-4 font-bold text-natural-text">
                      {order.total.toLocaleString()} IQD
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-natural-text hover:text-natural-accent hover:bg-natural-bg rounded-xl transition-all shadow-sm border border-natural-border flex items-center gap-1 text-xs font-semibold px-3"
                          title="Print Receipt"
                        >
                          <Printer size={15} />
                          <span>{isRtl ? 'چاپ' : 'Print'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Receipt Modal Preview */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 print:hidden">
          <div className="bg-natural-surface rounded-[2rem] p-5 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-lg font-bold text-natural-text">
                {isRtl ? 'وەسڵی فرۆشتن' : 'Order Receipt'}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 bg-natural-surface rounded-full flex items-center justify-center text-natural-text-tertiary hover:text-natural-text hover:bg-natural-border transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-natural-bg p-2 rounded-2xl border border-natural-border shadow-inner mb-4 overflow-y-auto flex-1 flex justify-center">
              <div className="transform scale-[0.9] origin-top">
                <Receipt order={selectedOrder} />
              </div>
            </div>

            <div className="flex gap-2.5 shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-natural-bg hover:bg-natural-surface border-2 border-natural-border text-natural-text py-2.5 rounded-2xl font-bold transition-all text-sm"
              >
                {t('close')}
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-[1.8] bg-natural-dark hover:opacity-90 text-white py-2.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Printer size={16} />
                <span>{isRtl ? 'چاپکردنی وەسڵ (AirPrint)' : 'Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Clean Thermal Receipt Root for iPad / WebKit AirPrint */}
      {selectedOrder && (
        <div id="receipt-print-root" className="hidden print:block receipt-printable-root">
          <Receipt order={selectedOrder} />
        </div>
      )}
    </div>
  );
};

