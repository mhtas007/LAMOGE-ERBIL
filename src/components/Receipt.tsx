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
      className={`receipt-paper bg-white text-black p-4 text-xs mx-auto print:p-0 print:m-0 print:border-none font-mono ${
        (rLang === 'ku' || rLang === 'ar') ? 'text-right' : 'text-left'
      }`}
      style={{
        width: receiptWidthStyle,
        maxWidth: '100%',
        direction: (rLang === 'ku' || rLang === 'ar') ? 'rtl' : 'ltr',
        color: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.5,
      }}
    >
      {/* Centered Circular Logo */}
      <div className="flex justify-center mb-3">
        <div className="w-16 h-16 rounded-full border border-gray-300 p-1 flex items-center justify-center overflow-hidden bg-white">
          {receiptSettings.logo ? (
            <img
              src={receiptSettings.logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-full grayscale"
              style={{ filter: 'grayscale(100%) contrast(140%)' }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-xl">
              ☕
            </div>
          )}
        </div>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-2 space-y-0.5 font-mono">
        <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-black">
          {receiptSettings.cafeName || 'LAMOGE CAFE'}
        </h1>
        <p className="text-[11px] text-black">
          {receiptSettings.headerText || `Welcome to ${receiptSettings.cafeName || 'Lamoge Cafe'}`}
        </p>
        {receiptSettings.address && (
          <p className="text-[11px] text-black">{receiptSettings.address}</p>
        )}
        <p className="text-[11px] text-black">
          {receiptSettings.phone ? `Tel: ${receiptSettings.phone}` : 'Tel:'}
        </p>
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Order Meta Info */}
      <div className="space-y-1 text-[11px] text-black font-mono">
        <div className="flex justify-between items-center">
          <span>{tr.date}:</span>
          <span>{formattedDate} {formattedTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>{tr.orderNo}:</span>
          <span className="font-bold">
            {displayOrder.invoiceCode || `INV-${displayOrder.id.slice(0, 8).toUpperCase()}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>{tr.type}:</span>
          <span className="font-bold uppercase">
            {displayOrder.type === 'dine_in' ? 'DINE IN' : displayOrder.type === 'takeaway' ? 'TAKEAWAY' : 'DELIVERY'}
          </span>
        </div>
        {displayOrder.type === 'dine_in' && displayOrder.tableId && (
          <div className="flex justify-between items-center">
            <span>{tr.table}:</span>
            <span className="font-bold">
              {tables?.find((t) => t.id === displayOrder.tableId)?.number || displayOrder.tableId}
            </span>
          </div>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items Table */}
      <div className="mb-2 text-black font-mono">
        <div className="flex justify-between font-bold text-[11px] pb-1 mb-1">
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
            <div key={idx} className="py-0.5 text-[11px]">
              <div className="flex justify-between items-start font-bold">
                <div className="w-1/2 pr-1 text-black">
                  {itemName}
                  {item.variantName && (
                    <span className="block text-[10px] font-normal text-black/70">
                      ({item.variantName})
                    </span>
                  )}
                </div>
                <div className="w-1/4 text-center text-black font-normal">{item.quantity}</div>
                <div className="w-1/4 text-right font-normal">
                  {itemTotal.toLocaleString()}
                </div>
              </div>
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="text-[10px] text-black/80 pl-2 mt-0.5 space-y-0.5 font-normal">
                  {item.selectedAddons.map((addon, aIdx) => {
                    const addonName = rLang === 'ku' ? addon.nameKu : rLang === 'ar' ? addon.nameAr : addon.nameEn;
                    return (
                      <div key={aIdx} className="flex justify-between items-center">
                        <span>↳ + {addonName}</span>
                        {addon.price > 0 && (
                          <span className="text-[9px]">
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
        <div className="p-1.5 rounded mb-2 text-[10px] text-black italic border border-dashed border-gray-300">
          <span className="font-bold not-italic">Note:</span> {displayOrder.notes}
        </div>
      )}

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Totals Summary */}
      <div className="space-y-1 text-[11px] text-black font-mono">
        <div className="flex justify-between">
          <span>{tr.subtotal}:</span>
          <span>{displayOrder.subtotal.toLocaleString()}</span>
        </div>
        {displayOrder.discount > 0 && (
          <div className="flex justify-between">
            <span>{tr.discount}:</span>
            <span>-{displayOrder.discount.toLocaleString()}</span>
          </div>
        )}
        {displayOrder.serviceCharge && displayOrder.serviceCharge > 0 ? (
          <div className="flex justify-between">
            <span>{tr.serviceCharge}:</span>
            <span>+{displayOrder.serviceCharge.toLocaleString()}</span>
          </div>
        ) : null}

        {/* Solid Line Separator */}
        <div className="border-t border-gray-300 my-1"></div>

        {/* Grand Total */}
        <div className="flex justify-between items-center font-black text-sm pt-0.5">
          <span className="uppercase">{tr.total}:</span>
          <span>
            {(rLang === 'ku' || rLang === 'ar') ? `IQD ${displayOrder.total.toLocaleString()}` : `${displayOrder.total.toLocaleString()} IQD`}
          </span>
        </div>

        {/* Payment */}
        <div className="flex justify-between text-[11px] pt-0.5">
          <span>{tr.payment}:</span>
          <span className="uppercase font-normal">{displayOrder.paymentMethod ? displayOrder.paymentMethod.toUpperCase() : 'CASH'}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="border-t border-dashed border-gray-400 my-2.5"></div>

      {/* Footer */}
      <div className="text-center text-[11px] space-y-1 mt-2 text-black font-mono">
        <p className="font-normal">
          {receiptSettings.footerText || 'Thank you for your visit!'}
        </p>
        <div className="py-0.5 tracking-widest text-xs font-mono">
          ***
        </div>
        <p className="text-[9px] uppercase tracking-wider text-gray-500 pt-1">
          POWERED BY MAS MENU
        </p>
      </div>
    </div>
  );
};


