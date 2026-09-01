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
      className={`receipt-paper bg-white text-black p-4 text-sm mx-auto print:p-0 print:m-0 print:border-none font-bold ${
        (rLang === 'ku' || rLang === 'ar') ? 'text-right font-sans' : 'text-left font-mono'
      }`}
      style={{
        width: receiptWidthStyle,
        maxWidth: '100%',
        direction: (rLang === 'ku' || rLang === 'ar') ? 'rtl' : 'ltr',
        color: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.6,
      }}
    >
      {/* Centered Circular Logo */}
      <div className="flex justify-center mb-3">
        <div className="w-20 h-20 rounded-full border-2 border-black p-1 flex items-center justify-center overflow-hidden bg-white">
          {receiptSettings.logo ? (
            <img
              src={receiptSettings.logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-full grayscale"
              style={{ filter: 'grayscale(100%) contrast(150%)' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-black flex items-center justify-center text-2xl">
              ☕
            </div>
          )}
        </div>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-2 space-y-0.5">
        <h1 className="text-lg sm:text-xl font-black tracking-widest uppercase text-black">
          {receiptSettings.cafeName || 'LAMOGE CAFE'}
        </h1>
        <p className="text-xs font-bold text-black">
          {receiptSettings.headerText || `Welcome to ${receiptSettings.cafeName || 'Lamoge Cafe'}`}
        </p>
        {receiptSettings.address && (
          <p className="text-xs font-bold text-black">{receiptSettings.address}</p>
        )}
        <p className="text-xs font-bold text-black">
          {receiptSettings.phone ? `Tel: ${receiptSettings.phone}` : 'Tel:'}
        </p>
      </div>

      {/* Dashed Separator */}
      <div className="border-t-2 border-dashed border-black my-2.5"></div>

      {/* Order Meta Info */}
      <div className="space-y-1.5 text-xs text-black font-bold">
        <div className="flex justify-between items-center">
          <span>{tr.date}:</span>
          <span className="font-black">{formattedDate} {formattedTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>{tr.orderNo}:</span>
          <span className="font-black text-sm">
            {displayOrder.invoiceCode || `INV-${displayOrder.id.slice(0, 8).toUpperCase()}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>{tr.type}:</span>
          <span className="font-black uppercase">
            {displayOrder.type === 'dine_in' ? 'DINE IN' : displayOrder.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY'}
          </span>
        </div>
        {displayOrder.type === 'dine_in' && displayOrder.tableId && (
          <div className="flex justify-between items-center">
            <span>{tr.table}:</span>
            <span className="font-black text-sm">
              {tables?.find((t) => t.id === displayOrder.tableId)?.number || displayOrder.tableId}
            </span>
          </div>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-t-2 border-dashed border-black my-2.5"></div>

      {/* Items Table */}
      <div className="mb-2 text-black">
        <div className="flex justify-between font-black text-xs pb-1 mb-1 border-b border-black">
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

          return (
            <div key={idx} className="py-1 text-xs font-bold">
              <div className="flex justify-between items-start font-black text-sm">
                <div className="w-1/2 pr-1 text-black">
                  {itemName}
                  {item.variantName && (
                    <span className="block text-xs font-bold text-black/80">
                      ({item.variantName})
                    </span>
                  )}
                </div>
                <div className="w-1/4 text-center text-black font-black text-sm">{item.quantity}</div>
                <div className="w-1/4 text-right font-black text-sm">
                  {itemTotal.toLocaleString()}
                </div>
              </div>
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="text-xs text-black pl-2 mt-0.5 space-y-0.5 font-bold">
                  {item.selectedAddons.map((addon, aIdx) => {
                    const addonName = rLang === 'ku' ? addon.nameKu : rLang === 'ar' ? addon.nameAr : addon.nameEn;
                    return (
                      <div key={aIdx} className="flex justify-between items-center">
                        <span>↳ + {addonName}</span>
                        {addon.price > 0 && (
                          <span className="font-black text-[11px]">
                            (+{addon.price.toLocaleString()})
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
        <div className="p-1.5 rounded mb-2 text-xs text-black italic border border-dashed border-black">
          <span className="font-black not-italic">Note:</span> {displayOrder.notes}
        </div>
      )}

      {/* Dashed Separator */}
      <div className="border-t-2 border-dashed border-black my-2.5"></div>

      {/* Totals Summary */}
      <div className="space-y-1 text-xs text-black font-bold">
        <div className="flex justify-between text-sm">
          <span>{tr.subtotal}:</span>
          <span className="font-black">{displayOrder.subtotal.toLocaleString()}</span>
        </div>
        {displayOrder.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span>{tr.discount}:</span>
            <span className="font-black">-{displayOrder.discount.toLocaleString()}</span>
          </div>
        )}
        {displayOrder.serviceCharge && displayOrder.serviceCharge > 0 ? (
          <div className="flex justify-between text-sm">
            <span>{tr.serviceCharge}:</span>
            <span className="font-black">+{displayOrder.serviceCharge.toLocaleString()}</span>
          </div>
        ) : null}

        {/* Solid Line Separator */}
        <div className="border-t-2 border-black my-1.5"></div>

        {/* Grand Total */}
        <div className="flex justify-between items-center font-black text-base pt-0.5">
          <span className="uppercase">{tr.total}:</span>
          <span className="text-lg font-black">
            {(rLang === 'ku' || rLang === 'ar') ? `IQD ${displayOrder.total.toLocaleString()}` : `${displayOrder.total.toLocaleString()} IQD`}
          </span>
        </div>

        {/* Payment */}
        <div className="flex justify-between text-xs pt-0.5">
          <span>{tr.payment}:</span>
          <span className="uppercase font-black">{displayOrder.paymentMethod ? displayOrder.paymentMethod.toUpperCase() : 'CASH'}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="border-t-2 border-dashed border-black my-2.5"></div>

      {/* Footer */}
      <div className="text-center text-xs space-y-1 mt-2 text-black font-bold">
        <p className="font-bold">
          {receiptSettings.footerText || 'Thank you for your visit!'}
        </p>
        <div className="py-0.5 tracking-widest text-sm font-black">
          ***
        </div>
        <p className="text-[10px] uppercase tracking-widest text-black pt-1 font-black">
          POWERED BY MAS MENU
        </p>
      </div>
    </div>
  );
};


