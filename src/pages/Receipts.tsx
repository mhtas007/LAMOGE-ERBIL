import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Search, Printer, X, Eye, Ban, Download, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Order } from '../types';
import { Receipt } from '../components/Receipt';
import { PrinterService } from '../services/printerService';

export const Receipts: React.FC = () => {
  const { t, isRtl, recentOrders, language, receiptSettings, menuItems, tables, cancelOrder, user } = useAppContext();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReasonOption, setCancelReasonOption] = useState<string>('هەڵەی کاشێر');
  const [customReasonText, setCustomReasonText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReprinting, setIsReprinting] = useState(false);

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

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    const finalReason = cancelReasonOption === 'other' ? (customReasonText.trim() || 'هۆکاری تر') : cancelReasonOption;
    setIsCancelling(true);
    try {
      await cancelOrder(orderToCancel.id, finalReason);
      setOrderToCancel(null);
      setCustomReasonText('');
    } catch (err) {
      alert(isRtl ? 'هەڵەیەک ڕوویدا لە هەڵوەشاندنەوەی وەسڵ' : 'Failed to void order');
    } finally {
      setIsCancelling(false);
    }
  };

  const exportToCsv = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['ژمارەی پسوولە (Invoice)', 'بەروار (Date)', 'جۆر (Type)', 'پارەدان (Payment)', 'ژمارەی کاڵا (Items)', 'کۆی گشتی (Total IQD)', 'دۆخ (Status)', 'هۆکاری هەڵوەشاندنەوە (Reason)'];
    const rows = filteredOrders.map(o => [
      `"${o.invoiceCode || o.id}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.type}"`,
      `"${o.paymentMethod || 'cash'}"`,
      o.items.length,
      o.total,
      `"${o.status === 'cancelled' ? 'Cancelled / هەڵوەشاوەتەوە' : 'Completed / تەواوکراو'}"`,
      `"${o.cancelReason || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LAMOGE_Receipts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-natural-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-natural-border shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-natural-text">{t('receipts')}</h1>
          <p className="text-natural-text-secondary mt-1 text-sm">{t('receiptsDesc') || 'View, void and print past order receipts'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={exportToCsv}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 bg-natural-bg hover:bg-natural-surface text-natural-text border border-natural-border px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-40"
            title="Download CSV for Excel"
          >
            <Download size={16} className="text-emerald-600" />
            <span>{isRtl ? 'دەرکردنی Excel' : 'Export Excel'}</span>
          </button>

          <div className="w-full sm:w-64 relative">
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
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'دۆخ' : 'Status'}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{t('totalAmount')}</th>
                <th className={`px-6 py-4 font-semibold text-natural-text-secondary text-sm text-center`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-natural-text-tertiary">
                    {t('noReceipts') || 'No receipts found'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelled = order.status === 'cancelled';
                  return (
                    <tr key={order.id} className={`border-b border-natural-border/50 transition-colors ${isCancelled ? 'bg-rose-50/30' : 'hover:bg-natural-bg/50'}`}>
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
                      <td className="px-6 py-4 text-sm capitalize text-natural-text-secondary">{order.paymentMethod || 'cash'}</td>
                      <td className="px-6 py-4 text-sm">
                        {isCancelled ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <Ban size={11} /> {isRtl ? 'هەڵوەشاوەتەوە' : 'Voided'}
                            </span>
                            {order.cancelReason && (
                              <span className="text-[11px] text-rose-600 italic max-w-[130px] truncate" title={order.cancelReason}>
                                {order.cancelReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> {isRtl ? 'تەواوکراو' : 'Completed'}
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-bold ${isCancelled ? 'line-through text-rose-400' : 'text-natural-text'}`}>
                        {order.total.toLocaleString()} IQD
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-natural-text hover:text-natural-accent hover:bg-natural-bg rounded-xl transition-all shadow-sm border border-natural-border flex items-center gap-1 text-xs font-semibold px-3"
                            title="Print / View Receipt"
                          >
                            <Printer size={14} />
                            <span>{isRtl ? 'چاپ' : 'Print'}</span>
                          </button>

                          {!isCancelled && (
                            <button
                              onClick={() => setOrderToCancel(order)}
                              className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-200 flex items-center gap-1 text-xs font-semibold px-2.5"
                              title="Void / Cancel Order"
                            >
                              <Ban size={14} />
                              <span className="hidden sm:inline">{isRtl ? 'هەڵوەشاندنەوە' : 'Void'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                <Receipt order={selectedOrder} isReprint={true} />
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
                disabled={isReprinting}
                onClick={async () => {
                  if (!selectedOrder) return;
                  const protocol = receiptSettings?.printerProtocol || 'browser_airprint';
                  const isNetworkProtocol = protocol === 'epson_epos' || protocol === 'raw_escpos_bridge' || protocol === 'star_webprnt';
                  const hasPrinter = Boolean(receiptSettings?.printerIp?.trim() || receiptSettings?.bridgeUrl?.trim());

                  if (isNetworkProtocol && hasPrinter && receiptSettings?.silentPrint !== false) {
                    setIsReprinting(true);
                    try {
                      const tableObj = tables.find((t) => t.id === selectedOrder.tableId);
                      const tableName = tableObj ? `${isRtl ? 'مێزی' : 'Table'} ${tableObj.number}` : undefined;
                      await PrinterService.printReceipt({
                        order: selectedOrder,
                        cafeName: receiptSettings.cafeName || 'LAMOGE CAFE',
                        address: receiptSettings.address,
                        phone: receiptSettings.phone,
                        headerText: receiptSettings.headerText,
                        footerText: receiptSettings.footerText,
                        menuItems,
                        currencySymbol: receiptSettings.currency || 'IQD',
                        tableName,
                        receiptLanguage: (receiptSettings.receiptLanguage || language || 'en') as 'en' | 'ku' | 'ar',
                        logo: receiptSettings.logo || undefined,
                        isReprint: true,
                      });
                      setSelectedOrder(null);
                      return;
                    } catch (err) {
                      console.warn('[Receipts Reprint] Network reprint error, opening print window:', err);
                    } finally {
                      setIsReprinting(false);
                    }
                  }
                  window.print();
                }}
                className="flex-[1.8] bg-natural-dark hover:opacity-90 text-white py-2.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Printer size={16} />
                <span>
                  {isReprinting
                    ? (isRtl ? 'چاپ دەکرێت...' : 'Printing...')
                    : (isRtl ? 'چاپکردنی دووبارە' : 'Reprint Receipt')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void / Cancel Order Reason Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-natural-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-natural-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle size={22} />
                <h3 className="text-lg font-bold">
                  {isRtl ? 'هەڵوەشاندنەوەی پسوولە' : 'Void Order'}
                </h3>
              </div>
              <button
                onClick={() => setOrderToCancel(null)}
                className="w-8 h-8 rounded-full bg-natural-bg flex items-center justify-center text-natural-text-secondary hover:text-natural-text"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-natural-text-secondary mb-4">
              {isRtl
                ? `ئایا دڵنیایت لە هەڵوەشاندنەوەی پسوولەی (${orderToCancel.invoiceCode || orderToCancel.id}) بە بڕی ${orderToCancel.total.toLocaleString()} IQD؟ ئەم کارە لە حساباتی فرۆش دەردەکرێت.`
                : `Are you sure you want to void invoice ${orderToCancel.invoiceCode}? Total: ${orderToCancel.total.toLocaleString()} IQD.`}
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-natural-text uppercase">
                {isRtl ? 'هۆکاری هەڵوەشاندنەوە:' : 'Cancellation Reason:'}
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'هەڵەی کاشێر', label: isRtl ? 'هەڵەی کاشێر' : 'Cashier Error' },
                  { id: 'پەشیمانبوونەوەی کڕیار', label: isRtl ? 'پەشیمانبوونەوەی کڕیار' : 'Customer Cancelled' },
                  { id: 'کێشە لە کاڵا یان کوالیتی', label: isRtl ? 'کێشە لە کوالیتی' : 'Quality Issue' },
                  { id: 'داواکاری تاقیکاری', label: isRtl ? 'تاقیکاری' : 'Test Order' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCancelReasonOption(opt.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      cancelReasonOption === opt.id
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                        : 'bg-natural-bg border-natural-border text-natural-text hover:bg-natural-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder={isRtl ? 'تێبینی زیاتر بنووسە (ئارەزوومەندانە)...' : 'Additional reason details (optional)...'}
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full bg-natural-bg border border-natural-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 bg-natural-bg hover:bg-natural-surface border border-natural-border text-natural-text py-2.5 rounded-xl font-bold text-sm"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-[1.5] bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Ban size={15} />
                <span>{isCancelling ? (isRtl ? 'خەریکی هەڵوەشاندنەوەیە...' : 'Voiding...') : (isRtl ? 'پشتڕاستکردنەوە' : 'Confirm Void')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Clean Thermal Receipt Root for iPad / WebKit AirPrint */}
      {selectedOrder && (
        <div id="receipt-print-root" className="hidden print:block receipt-printable-root">
          <Receipt order={selectedOrder} isReprint={true} />
        </div>
      )}
    </div>
  );
};

