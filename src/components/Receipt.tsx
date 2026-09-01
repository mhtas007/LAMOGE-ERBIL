import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Order } from '../types';

interface ReceiptProps {
  order?: Order;
  settingsOverride?: any;
}

export const Receipt: React.FC<ReceiptProps> = ({ order, settingsOverride }) => {
  const { receiptSettings: globalReceiptSettings, language, menuItems, tables } = useAppContext();
  
  const receiptSettings = settingsOverride || globalReceiptSettings;

  const dummyOrder: Order = {
    id: 'DEMO-123',
    items: [
      { menuItemId: '1', quantity: 2, price: 2500 },
      { menuItemId: '4', quantity: 1, price: 2000 },
    ],
    subtotal: 7000,
    discount: 0,
    total: 7000,
    paymentMethod: 'cash',
    type: 'dine_in',
    status: 'completed',
    createdAt: new Date().toISOString(),
    invoiceCode: 'INV-DEMO-123'
  };

  const displayOrder = order || dummyOrder;
  const dateObj = new Date(displayOrder.createdAt);
  
  const formatReceiptDate = (date: Date, lang: string) => {
    if (lang === 'ku') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}/${month}/${day}`;
    }
    return date.toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US');
  };

  const formatReceiptTime = (date: Date, lang: string) => {
    if (lang === 'ku') {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'ئێوارە' : 'بەیانی';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formattedDate = formatReceiptDate(dateObj, receiptSettings.receiptLanguage || 'en');
  const formattedTime = formatReceiptTime(dateObj, receiptSettings.receiptLanguage || 'en');

  const rLang = receiptSettings.receiptLanguage || 'en';
  
  const tr = {
    en: {
      date: 'Date', orderNo: 'Order No', type: 'Type',
      table: 'Table',
      item: 'Item', qty: 'Qty', price: 'Price',
      subtotal: 'Subtotal', discount: 'Discount', serviceCharge: 'Service Charge', total: 'TOTAL',
      payment: 'Payment'
    },
    ku: {
      date: 'بەروار', orderNo: 'ژمارەی پسوولە', type: 'جۆر',
      table: 'مێز',
      item: 'بابەت', qty: 'دانە', price: 'نرخ',
      subtotal: 'کۆی گشتی', discount: 'داشکاندن', serviceCharge: 'خزمەتگوزاری', total: 'کۆی کۆتایی',
      payment: 'شێوازی پارەدان'
    },
    ar: {
      date: 'التاريخ', orderNo: 'رقم الطلب', type: 'النوع',
      table: 'الطاولة',
      item: 'الصنف', qty: 'الكمية', price: 'السعر',
      subtotal: 'المجموع الإجمالي', discount: 'الخصم', serviceCharge: 'رسوم الخدمة', total: 'الإجمالي',
      payment: 'طريقة الدفع'
    }
  }[rLang];

  const paperWidth = receiptSettings.paperWidth || '80mm';
  const is58mm = paperWidth === '58mm';
  const receiptWidthStyle = is58mm ? '230px' : '300px';

  return (
    <div
      className={`receipt-paper bg-white text-black p-4 sm:p-5 text-xs shadow-md mx-auto print:shadow-none print:p-0 print:m-0 print:border-none ${
        (rLang === 'ku' || rLang === 'ar') ? 'text-right font-sans' : 'text-left font-mono'
      }`}
      style={{
        width: receiptWidthStyle,
        maxWidth: '100%',
        direction: (rLang === 'ku' || rLang === 'ar') ? 'rtl' : 'ltr',
        color: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.4,
      }}
    >
      {/* Brand Header */}
      <div className="text-center mb-4">
        {receiptSettings.logo ? (
          <div className="flex justify-center items-center mb-2.5">
            <img
              src={receiptSettings.logo}
              alt="Logo"
              className="max-h-20 max-w-[130px] object-contain mx-auto grayscale"
              style={{
                filter: 'grayscale(100%) contrast(140%)',
                imageRendering: 'crisp-edges',
              }}
            />
          </div>
        ) : null}
        <h1 className="text-lg sm:text-xl font-black tracking-wider uppercase text-black">
          {receiptSettings.cafeName || 'MAS CAFE'}
        </h1>
        {receiptSettings.headerText && (
          <p className="whitespace-pre-wrap text-[11px] font-medium text-black/90 mt-1">
            {receiptSettings.headerText}
          </p>
        )}
        {receiptSettings.address && (
          <p className="whitespace-pre-wrap text-[10px] text-black/80 mt-0.5">{receiptSettings.address}</p>
        )}
        {receiptSettings.phone && (
          <p className="text-[10px] text-black/80 mt-0.5">📞 {receiptSettings.phone}</p>
        )}
        {receiptSettings.showVat && receiptSettings.taxId && (
          <p className="text-[10px] text-black/80 mt-0.5">VAT / Tax: {receiptSettings.taxId}</p>
        )}
      </div>

      {/* Separator */}
      <div className="border-t-2 border-black my-2"></div>

      {/* Invoice Meta Grid */}
      <div className="bg-black/5 p-2 rounded-lg mb-3 text-[11px] space-y-1 text-black font-medium">
        <div className="flex justify-between items-center">
          <span className="opacity-75">{tr.orderNo}:</span>
          <span className="font-mono font-black text-xs">
            {displayOrder.invoiceCode || `#${displayOrder.id.slice(0, 8)}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="opacity-75">{tr.date}:</span>
          <span>{formattedDate} - {formattedTime}</span>
        </div>
        <div className="flex justify-between items-center pt-0.5 border-t border-black/10">
          <span className="opacity-75">{tr.type}:</span>
          <span className="font-bold uppercase">
            {displayOrder.type === 'dine_in' ? '🍽️ Dine-in' : displayOrder.type === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}
          </span>
        </div>
        {displayOrder.type === 'dine_in' && displayOrder.tableId && (
          <div className="flex justify-between items-center">
            <span className="opacity-75">{tr.table}:</span>
            <span className="font-black text-xs">
              {tables?.find((t) => t.id === displayOrder.tableId)?.number || displayOrder.tableId}
            </span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-3 text-black">
        <div className="flex justify-between font-black text-[11px] border-b-2 border-black pb-1 mb-1.5 uppercase">
          <span className="w-1/2">{tr.item}</span>
          <span className="w-1/4 text-center">{tr.qty}</span>
          <span className="w-1/4 text-right">{tr.price}</span>
        </div>
        {displayOrder.items.map((item, idx) => {
          const menuItem = menuItems.find((m) => m.id === item.menuItemId);
          const itemName = menuItem
            ? rLang === 'ku'
              ? menuItem.nameKu
              : rLang === 'ar'
              ? menuItem.nameAr
              : menuItem.nameEn
            : `Item #${item.menuItemId}`;
          const itemTotal = item.price * item.quantity;
          const addonsText =
            item.selectedAddons && item.selectedAddons.length > 0
              ? item.selectedAddons
                  .map((a) => (rLang === 'ku' ? a.nameKu : rLang === 'ar' ? a.nameAr : a.nameEn))
                  .join(', ')
              : null;

          return (
            <div key={idx} className="py-1 border-b border-dashed border-black/20 text-[11px]">
              <div className="flex justify-between items-start">
                <div className="w-1/2 pr-1 font-bold text-black leading-tight">
                  {itemName}
                  {item.variantName && (
                    <span className="block text-[10px] font-normal text-black/75">
                      ({item.variantName})
                    </span>
                  )}
                </div>
                <div className="w-1/4 text-center font-black text-black">{item.quantity}</div>
                <div className="w-1/4 text-right font-bold text-black font-mono">
                  {itemTotal.toLocaleString()}
                </div>
              </div>
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="text-[10px] text-black/80 pl-2 mt-0.5 space-y-0.5">
                  {item.selectedAddons.map((addon, aIdx) => {
                    const addonName = rLang === 'ku' ? addon.nameKu : rLang === 'ar' ? addon.nameAr : addon.nameEn;
                    return (
                      <div key={aIdx} className="flex justify-between items-center italic">
                        <span>↳ + {addonName}</span>
                        {addon.price > 0 && (
                          <span className="font-mono not-italic text-[9px] font-bold text-black/90">
                            (+{addon.price.toLocaleString()} {receiptSettings.currency})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayOrder.notes && (
        <div className="bg-black/5 p-2 rounded mb-3 text-[10px] text-black italic">
          <span className="font-bold not-italic">📝 {tr.notes || (rLang === 'ku' ? 'تێبینی' : 'Note')}:</span> {displayOrder.notes}
        </div>
      )}

      {/* Totals Summary */}
      <div className="space-y-1 text-xs text-black border-t-2 border-black pt-2 mb-3">
        <div className="flex justify-between">
          <span className="font-medium text-black/80">{tr.subtotal}:</span>
          <span className="font-mono font-bold">{displayOrder.subtotal.toLocaleString()} {receiptSettings.currency}</span>
        </div>
        {displayOrder.discount > 0 && (
          <div className="flex justify-between text-black font-medium">
            <span>{tr.discount}:</span>
            <span className="font-mono">-{displayOrder.discount.toLocaleString()} {receiptSettings.currency}</span>
          </div>
        )}
        {displayOrder.serviceCharge && displayOrder.serviceCharge > 0 ? (
          <div className="flex justify-between text-black font-medium">
            <span>{tr.serviceCharge || 'Service Charge'}:</span>
            <span className="font-mono">+{displayOrder.serviceCharge.toLocaleString()} {receiptSettings.currency}</span>
          </div>
        ) : null}

        {/* Grand Total Box */}
        <div className="flex justify-between items-center font-black text-sm sm:text-base mt-2 p-2 bg-black text-white rounded">
          <span className="uppercase tracking-wider">{tr.total}:</span>
          <span className="font-mono font-black text-base">
            {displayOrder.total.toLocaleString()} {receiptSettings.currency}
          </span>
        </div>

        {displayOrder.paymentMethod && (
          <div className="flex justify-between text-[11px] pt-1 text-black/80 font-medium">
            <span>{tr.payment}:</span>
            <span className="uppercase font-bold">💳 {displayOrder.paymentMethod}</span>
          </div>
        )}
      </div>

      {/* Footer & Barcode Decorative */}
      <div className="text-center text-[10px] space-y-1.5 mt-4 text-black border-t-2 border-dashed border-black/40 pt-3">
        {receiptSettings.footerText && (
          <p className="whitespace-pre-wrap font-medium leading-relaxed">{receiptSettings.footerText}</p>
        )}
        <div className="py-1 text-xs tracking-widest opacity-60 font-mono">
          ★ ★ ★ ★ ★
        </div>
        <p className="text-[9px] font-black tracking-widest uppercase opacity-70">
          POWERED BY MAS POS
        </p>
      </div>
    </div>
  );
};


