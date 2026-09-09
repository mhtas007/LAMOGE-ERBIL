import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Order } from '../types';

interface ReceiptProps {
  order?: Order;
  settingsOverride?: any;
}

export const Receipt: React.FC<ReceiptProps> = ({ order, settingsOverride }) => {
  const { receiptSettings: globalReceiptSettings, menuItems, tables } = useAppContext();
  
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
  
  const rLang = receiptSettings.receiptLanguage || 'en';
  const isRtl = rLang === 'ku' || rLang === 'ar';

  const formatReceiptDate = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    let h = date.getHours();
    const min = String(date.getMinutes()).padStart(2, '0');
    let period = '';
    if (rLang === 'ku') {
      period = h >= 12 ? 'ئێوارە' : 'بەیانی';
    } else if (rLang === 'ar') {
      period = h >= 12 ? 'مساءً' : 'صباحاً';
    } else {
      period = h >= 12 ? 'PM' : 'AM';
    }
    h = h % 12 || 12;
    return `${y}/${m}/${d} ${h}:${min} ${period}`;
  };

  const formattedDateTime = formatReceiptDate(dateObj);

  const tr = {
    en: {
      date: 'Date:',
      orderNo: 'Invoice #:',
      type: 'Type:',
      table: 'Table',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      discount: 'Discount',
      serviceCharge: 'Service',
      total: 'Total',
      payment: 'Payment - Cash',
      dineIn: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      welcome: 'Welcome to',
      thanks: 'Thank you for your visit!',
      pleasure: 'The Pleasure of Taste',
    },
    ku: {
      date: 'بەروار:',
      orderNo: 'ژمارەی پسوولە:',
      type: 'جۆر:',
      table: 'مێزی',
      item: 'بابەت',
      qty: 'دانە',
      price: 'نرخ',
      subtotal: 'کۆی گشتی',
      discount: 'داشکاندن',
      serviceCharge: 'خزمەتگوزاری',
      total: 'کۆی کۆتایی',
      payment: 'شێوازی پارەدان - نەختینە',
      dineIn: 'هۆڵ',
      takeaway: 'سەفەری',
      delivery: 'گەیاندن',
      welcome: 'بەخێر بێن بۆ',
      thanks: 'سوپاس بۆ سەردانەکەت',
      pleasure: 'چێژی تایبەتی تامی خۆش',
    },
    ar: {
      date: 'التاريخ:',
      orderNo: 'رقم الفاتورة:',
      type: 'النوع:',
      table: 'طاولة',
      item: 'الصنف',
      qty: 'الكمية',
      price: 'السعر',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      serviceCharge: 'رسوم الخدمة',
      total: 'الإجمالي',
      payment: 'طريقة الدفع - نقدي',
      dineIn: 'صالة',
      takeaway: 'سفري',
      delivery: 'توصيل',
      welcome: 'أهلاً وسهلاً بكم في',
      thanks: 'شكراً لزيارتكم',
      pleasure: 'متعة المذاق الرفيع',
    }
  }[rLang] || {
    date: 'Date:',
    orderNo: 'Invoice #:',
    type: 'Type:',
    table: 'Table',
    item: 'Item',
    qty: 'Qty',
    price: 'Price',
    subtotal: 'Subtotal',
    discount: 'Discount',
    serviceCharge: 'Service',
    total: 'Total',
    payment: 'Payment - Cash',
    dineIn: 'Dine In',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    welcome: 'Welcome to',
    thanks: 'Thank you for your visit!',
    pleasure: 'The Pleasure of Taste',
  };

  const paperWidth = receiptSettings.paperWidth || '80mm';
  const is58mm = paperWidth === '58mm';
  const receiptWidthStyle = is58mm ? '240px' : '310px';

  const totalItemCount = displayOrder.items.reduce((sum, it) => sum + it.quantity, 0);

  const curr = receiptSettings.currency || 'IQD';

  const formatPrice = (val: number) => {
    return `${curr} ${val.toLocaleString()}`;
  };

  return (
    <div
      className={`receipt-paper bg-white text-black p-4 mx-auto print:p-0 print:m-0 print:border-none ${
        isRtl ? 'font-sans text-right' : 'font-sans text-left'
      }`}
      style={{
        width: receiptWidthStyle,
        maxWidth: '100%',
        direction: isRtl ? 'rtl' : 'ltr',
        color: '#000000',
        backgroundColor: '#ffffff',
        lineHeight: 1.45,
        fontSize: '12px',
      }}
    >
      {/* 1. Top Logo */}
      <div className="flex justify-center mb-2">
        {receiptSettings.logo ? (
          <img
            src={receiptSettings.logo}
            alt="Logo"
            className="h-14 max-w-[140px] object-contain"
            style={{ filter: 'grayscale(100%)' }}
          />
        ) : (
          <div className="text-xl font-bold tracking-wider text-black">
            {receiptSettings.cafeName || 'LAMOGE'}
          </div>
        )}
      </div>

      {/* 2. Cafe Info Header */}
      <div className="text-center mb-2.5 space-y-0.5 text-[11px] text-black">
        <div className="font-semibold text-xs text-black">
          {receiptSettings.cafeName || 'Lamoge - Branch 1'}
        </div>
        <div>
          {(!receiptSettings.headerText || receiptSettings.headerText.startsWith('Welcome to') || receiptSettings.headerText.startsWith('بەخێر بێن بۆ') || receiptSettings.headerText.startsWith('أهلاً'))
            ? `${tr.welcome} ${receiptSettings.cafeName || 'LAMOGE'}`
            : receiptSettings.headerText}
        </div>
        {receiptSettings.address && (
          <div>{receiptSettings.address}</div>
        )}
      </div>

      {/* 3. Date & Order Meta (Balanced Key-Value Rows) */}
      <div className="border-t border-dashed border-black/40 my-2"></div>
      <div className="space-y-1.5 text-xs text-black mb-2">
        <div className="flex justify-between items-center">
          <span className="text-[11.5px] font-bold text-black/80">{tr.date}</span>
          <span className="font-semibold text-xs text-black">{formattedDateTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11.5px] font-bold text-black/80">{tr.orderNo}</span>
          <span className="font-mono font-bold text-xs text-black">{displayOrder.invoiceCode || displayOrder.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11.5px] font-bold text-black/80">{tr.type}</span>
          <span className="font-semibold text-xs text-black">
            {displayOrder.type === 'dine_in' ? tr.dineIn : displayOrder.type === 'takeaway' ? tr.takeaway : tr.delivery}
            {displayOrder.type === 'dine_in' && displayOrder.tableId && (
              <span className="mx-1">
                ({tr.table} {tables?.find((t) => t.id === displayOrder.tableId)?.number || displayOrder.tableId})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 4. Table Header */}
      <div className="border-t border-black/50 my-1.5"></div>
      <div className="flex justify-between items-center text-[11.5px] font-semibold text-black py-0.5">
        <span className="w-10 text-left">{tr.qty}</span>
        <span className="flex-1 px-1">{tr.item}</span>
        <span className="w-24 text-right">{tr.price}</span>
      </div>
      <div className="border-t border-black/30 mb-1.5"></div>

      {/* 5. Items List */}
      <div className="space-y-1.5 mb-2 text-black">
        {displayOrder.items.map((item, idx) => {
          const menuItem = menuItems.find((m) => m.id === item.menuItemId);
          let itemName = 'Item';
          if (menuItem) {
            if (rLang === 'ku' && menuItem.nameKu) itemName = menuItem.nameKu;
            else if (rLang === 'ar' && menuItem.nameAr) itemName = menuItem.nameAr;
            else itemName = menuItem.nameEn || menuItem.nameKu || menuItem.nameAr || 'Item';
          }
          const itemTotal = item.price * item.quantity;

          return (
            <div key={idx} className="text-[11.5px]">
              <div className="flex justify-between items-start">
                <span className="w-10 text-left font-medium">{item.quantity}</span>
                <span className="flex-1 px-1 font-medium">
                  {itemName}
                  {item.variantName && (
                    <span className="text-[10.5px] text-black/80 block">
                      ({item.variantName})
                    </span>
                  )}
                </span>
                <span className="w-24 text-right font-medium">
                  {formatPrice(itemTotal)}
                </span>
              </div>
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="text-[10px] text-black/80 pl-10 space-y-0.5 mt-0.5">
                  {item.selectedAddons.map((addon, aIdx) => {
                    const aName = rLang === 'ku' ? addon.nameKu : rLang === 'ar' ? addon.nameAr : addon.nameEn;
                    return (
                      <div key={aIdx} className="flex justify-between">
                        <span>↳ + {aName}</span>
                        {addon.price > 0 && (
                          <span>+{formatPrice(addon.price * item.quantity)}</span>
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
        <div className="p-1 rounded mb-2 text-[10.5px] text-black italic border border-dashed border-black/30">
          <span className="font-semibold not-italic">Note:</span> {displayOrder.notes}
        </div>
      )}

      {/* 6. Summary Rows */}
      <div className="border-t border-black/30 my-2"></div>
      <div className="space-y-1 text-xs text-black">
        {displayOrder.discount > 0 && (
          <div className="flex justify-between font-medium">
            <span>{tr.discount}</span>
            <span>-{formatPrice(displayOrder.discount)}</span>
          </div>
        )}
        {displayOrder.serviceCharge && displayOrder.serviceCharge > 0 ? (
          <div className="flex justify-between font-medium">
            <span>{tr.serviceCharge}</span>
            <span>+{formatPrice(displayOrder.serviceCharge)}</span>
          </div>
        ) : null}

        {/* 7. Total Row - Large Bold Total */}
        <div className="border-t-2 border-black my-2"></div>
        <div className="flex justify-between items-center text-lg font-black text-black py-1">
          <span className="font-black uppercase">{tr.total}</span>
          <span className="font-black">{formatPrice(displayOrder.total)}</span>
        </div>
        <div className="border-t-2 border-black my-2"></div>
      </div>

      {/* 8. Footer */}
      <div className="text-center text-xs space-y-1 mt-3 text-black">
        <div className="text-xs">
          {(!receiptSettings.footerText || receiptSettings.footerText === 'Thank you for your visit!' || receiptSettings.footerText === 'سەردانەکەت جێگەی دڵخۆشیمانە' || receiptSettings.footerText === 'شكراً لزيارتكم' || receiptSettings.footerText === 'سوپاس بۆ سەردانەکەت')
            ? tr.thanks
            : receiptSettings.footerText}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-black/60 pt-1 font-bold">
          POWERED BY MAS MENU
        </div>
      </div>
    </div>
  );
};


