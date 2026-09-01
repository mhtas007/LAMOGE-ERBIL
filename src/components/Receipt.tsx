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
      className={`receipt-paper bg-white text-black p-4 sm:p-6 text-sm shadow-md mx-auto print:shadow-none print:p-0 print:m-0 print:border-none ${
        (rLang === 'ku' || rLang === 'ar') ? 'text-right font-sans' : 'text-left font-mono'
      }`}
      style={{
        width: receiptWidthStyle,
        maxWidth: '100%',
        direction: (rLang === 'ku' || rLang === 'ar') ? 'rtl' : 'ltr',
        color: '#000000',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        {receiptSettings.logo && (
          <img
            src={receiptSettings.logo}
            alt="Logo"
            className="w-16 h-16 mx-auto mb-2 object-contain grayscale"
          />
        )}
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          {receiptSettings.cafeName}
        </h1>
        {receiptSettings.headerText && (
          <p className="whitespace-pre-wrap text-xs mt-1 font-medium text-black/90">
            {receiptSettings.headerText}
          </p>
        )}
        {receiptSettings.address && (
          <p className="whitespace-pre-wrap text-xs mt-1 text-black/80">{receiptSettings.address}</p>
        )}
        {receiptSettings.phone && (
          <p className="text-xs mt-1 text-black/80">Tel: {receiptSettings.phone}</p>
        )}
        {receiptSettings.showVat && receiptSettings.taxId && (
          <p className="text-xs mt-1 text-black/80">Tax ID / VAT No: {receiptSettings.taxId}</p>
        )}
      </div>

      <div className="border-t-2 border-dashed border-black/50 my-3"></div>

      {/* Order Info */}
      <div className="mb-4 text-xs space-y-1 text-black">
        <div className="flex justify-between">
          <span className="font-semibold">{tr.date}:</span>
          <span>{formattedDate} {formattedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{tr.orderNo}:</span>
          <span className="font-mono font-bold">{displayOrder.invoiceCode || `#${displayOrder.id.slice(0, 6)}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{tr.type}:</span>
          <span className="uppercase font-medium">{displayOrder.type.replace('_', ' ')}</span>
        </div>
        {displayOrder.type === 'dine_in' && displayOrder.tableId && (
          <div className="flex justify-between">
            <span className="font-semibold">{tr.table}:</span>
            <span className="font-bold">
              {tables?.find((t) => t.id === displayOrder.tableId)?.number || displayOrder.tableId}
            </span>
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-black/50 my-3"></div>

      {/* Items */}
      <div className="mb-4 text-black">
        <div className="flex justify-between font-bold mb-2 text-xs border-b border-black/20 pb-1">
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
            <div key={idx} className="mb-2 text-xs leading-snug">
              <div className="flex justify-between items-baseline">
                <span className="w-1/2 pr-2 font-semibold text-black">
                  {itemName}{' '}
                  {item.variantName && (
                    <span className="font-normal opacity-80">({item.variantName})</span>
                  )}
                </span>
                <span className="w-1/4 text-center font-bold text-black">{item.quantity}</span>
                <span className="w-1/4 text-right font-medium text-black">
                  {itemTotal.toLocaleString()}
                </span>
              </div>
              {addonsText && (
                <div className="text-[10px] text-black/70 pl-2 font-normal italic leading-tight mt-0.5">
                  + {addonsText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-dashed border-black/50 my-3"></div>

      {displayOrder.notes && (
        <div className="mb-3 text-xs text-black">
          <div className="font-bold">
            {tr.notes || (rLang === 'ku' ? 'تێبینییەکان' : rLang === 'ar' ? 'ملاحظات' : 'Notes')}:
          </div>
          <div className="italic text-black/90 mt-0.5">{displayOrder.notes}</div>
          <div className="border-t-2 border-dashed border-black/50 mt-3"></div>
        </div>
      )}

      {/* Totals */}
      <div className="mb-5 space-y-1.5 text-xs text-black">
        <div className="flex justify-between">
          <span className="font-medium">{tr.subtotal}:</span>
          <span>{displayOrder.subtotal.toLocaleString()}</span>
        </div>
        {displayOrder.discount > 0 && (
          <div className="flex justify-between text-black">
            <span className="font-medium">{tr.discount}:</span>
            <span>-{displayOrder.discount.toLocaleString()}</span>
          </div>
        )}
        {displayOrder.serviceCharge && displayOrder.serviceCharge > 0 ? (
          <div className="flex justify-between">
            <span className="font-medium">{tr.serviceCharge || 'Service Charge'}:</span>
            <span>{displayOrder.serviceCharge.toLocaleString()}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-black text-base mt-2 pt-2 border-t-2 border-black">
          <span>{tr.total}:</span>
          <span>
            {displayOrder.total.toLocaleString()} {receiptSettings.currency}
          </span>
        </div>
        {displayOrder.paymentMethod && (
          <div className="flex justify-between text-xs mt-1 text-black/80">
            <span>{tr.payment}:</span>
            <span className="uppercase font-semibold">{displayOrder.paymentMethod}</span>
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-black/50 my-3"></div>

      {/* Footer */}
      <div className="text-center text-xs space-y-2 mt-4 text-black">
        {receiptSettings.footerText && (
          <p className="whitespace-pre-wrap leading-relaxed">{receiptSettings.footerText}</p>
        )}
        <p className="text-black/60 font-mono">***</p>
        <p className="mt-4 text-[10px] font-black tracking-widest text-center uppercase opacity-60">
          POWERED BY MAS MENU
        </p>
      </div>
    </div>
  );
};

