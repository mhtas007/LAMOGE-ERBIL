import { FormattedReceiptData } from './receiptFormatter';
import html2canvas from 'html2canvas';

export interface RasterReceiptResult {
  rasterData: string;
  width: number;
  height: number;
  bytesWidth: number;
}

export class ReceiptImageRenderer {
  public static async renderToRaster(
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm' = '80mm',
    logoUrl?: string
  ): Promise<RasterReceiptResult> {
    const is58mm = paperWidth === '58mm';
    const targetWidth = is58mm ? 384 : 576; // standard thermal print width (dots)
    const bytesWidth = Math.ceil(targetWidth / 8);
    const lang = data.receiptLanguage || 'en';
    const isRtl = lang === 'ku' || lang === 'ar';
    const curr = data.currencySymbol || 'IQD';

    const effectiveLogo = logoUrl || data.logo || '/lamoge_logo.png';

    const tr = {
      en: {
        printedAt: 'Printed At:',
        orderNo: 'Check#',
        type: 'Type:',
        table: 'Table:',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        subtotal: 'Subtotal',
        discount: 'Discount',
        serviceCharge: 'Service',
        total: 'TOTAL',
        payment: 'Payment - Cash',
        productsCount: 'Products Count',
        dineIn: 'Dine In',
        takeaway: 'Takeaway',
        delivery: 'Delivery',
        thanks: 'Thank you for your visit!',
        pleasure: 'The Pleasure of Taste',
      },
      ku: {
        printedAt: 'کاتی چاپکردن:',
        orderNo: 'ژمارەی وەسڵ#',
        type: 'جۆر:',
        table: 'مێز:',
        item: 'بابەت',
        qty: 'دانە',
        price: 'نرخ',
        subtotal: 'کۆی گشتی',
        discount: 'داشکاندن',
        serviceCharge: 'خزمەتگوزاری',
        total: 'کۆی کۆتایی',
        payment: 'شێوازی پارەدان - نەختینە',
        productsCount: 'ژمارەی بابەتەکان',
        dineIn: 'Dine In',
        takeaway: 'Takeaway',
        delivery: 'Delivery',
        thanks: 'سەردانەکەت جێگەی دڵخۆشیمانە',
        pleasure: 'چێژی تایبەتی تامی خۆش',
      },
      ar: {
        printedAt: 'وقت الطباعة:',
        orderNo: 'رقم الفاتورة#',
        type: 'النوع:',
        table: 'الطاولة:',
        item: 'الصنف',
        qty: 'الكمية',
        price: 'السعر',
        subtotal: 'المجموع الفرعي',
        discount: 'الخصم',
        serviceCharge: 'رسوم الخدمة',
        total: 'الإجمالي',
        payment: 'طريقة الدفع - نقدي',
        productsCount: 'عدد الأصناف',
        dineIn: 'Dine In',
        takeaway: 'Takeaway',
        delivery: 'Delivery',
        thanks: 'شكراً لزيارتكم',
        pleasure: 'متعة المذاق الرفيع',
      },
    }[lang] || {
      printedAt: 'Printed At:',
      orderNo: 'Check#',
      type: 'Type:',
      table: 'Table:',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      discount: 'Discount',
      serviceCharge: 'Service',
      total: 'TOTAL',
      payment: 'Payment - Cash',
      productsCount: 'Products Count',
      dineIn: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      thanks: 'Thank you for your visit!',
      pleasure: 'The Pleasure of Taste',
    };

    const dateObj = new Date(data.order.createdAt);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    let h = dateObj.getHours();
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const sec = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formattedDateTime = `${y}/${m}/${d} ${String(h).padStart(2, '0')}:${min}:${sec} ${ampm}`;

    const totalItemCount = data.order.items.reduce((sum, it) => sum + it.quantity, 0);

    const orderTypeLabel = data.order.type === 'dine_in' ? tr.dineIn : data.order.type === 'takeaway' ? tr.takeaway : tr.delivery;
    const tableLabel = data.tableName || (data.order.tableId ? `${tr.table} ${data.order.tableId}` : '');

    // Full-width container fitted exactly to 576px (80mm) or 384px (58mm) to prevent side whitespace
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.padding = is58mm ? '10px 8px' : '16px 14px';
    container.style.fontFamily = isRtl
      ? "'Segoe UI', Tahoma, Arial, 'Noto Sans Arabic', sans-serif"
      : "'Segoe UI', Arial, -apple-system, sans-serif";
    container.style.fontSize = is58mm ? '14px' : '16.5px';
    container.style.lineHeight = '1.45';
    container.style.direction = isRtl ? 'rtl' : 'ltr';
    container.style.boxSizing = 'border-box';
    container.style.zIndex = '-99999';

    // 1. Logo
    let logoHtml = '';
    if (effectiveLogo) {
      logoHtml = `<div style="text-align: center; margin-bottom: 8px;">
        <img src="${effectiveLogo}" style="max-height: ${is58mm ? '80px' : '110px'}; max-width: ${is58mm ? '180px' : '230px'}; object-fit: contain; filter: grayscale(100%) contrast(150%); display: inline-block;" />
      </div>`;
    }

    // 2. Cafe Info
    const cafeNameHtml = `<div style="text-align: center; margin-bottom: 8px;">
      <div style="font-size: ${is58mm ? '19px' : '23px'}; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
        ${data.cafeName || 'LAMOGE CAFE'}
      </div>
      <div style="font-size: ${is58mm ? '13px' : '15px'}; color: #111; margin-top: 3px; font-weight: 500;">
        ${data.headerText || `Welcome to ${data.cafeName || 'Lamoge'}`}
      </div>
      ${data.address ? `<div style="font-size: ${is58mm ? '12px' : '14px'}; color: #222; margin-top: 2px;">${data.address}</div>` : ''}
    </div>`;

    // 3. Meta lines
    const metaHtml = `<div style="margin-bottom: 10px; font-size: ${is58mm ? '13px' : '15px'};">
      <div style="text-align: center; font-size: ${is58mm ? '12px' : '14px'}; color: #222; margin-bottom: 5px;">
        ${tr.printedAt} ${formattedDateTime}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #000; padding-top: 6px;">
        <span style="font-weight: 600;">${orderTypeLabel} ${tableLabel ? `(${tableLabel})` : ''}</span>
        <span style="font-weight: 800;">${tr.orderNo} ${data.order.invoiceCode || data.order.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>`;

    // 4. Items Table
    const tableHeaderHtml = `<div style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 5px 0; margin: 6px 0; display: flex; justify-content: space-between; font-weight: 800; font-size: ${is58mm ? '13.5px' : '16px'};">
      <span style="width: 45px; text-align: ${isRtl ? 'right' : 'left'};">${tr.qty}</span>
      <span style="flex: 1; padding: 0 8px;">${tr.item}</span>
      <span style="width: 110px; text-align: ${isRtl ? 'left' : 'right'};">${tr.price}</span>
    </div>`;

    let itemsRowsHtml = '<div style="margin-bottom: 8px;">';
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      let itemName = 'Item';
      if (menuItem) {
        if (lang === 'ku' && menuItem.nameKu) itemName = menuItem.nameKu;
        else if (lang === 'ar' && menuItem.nameAr) itemName = menuItem.nameAr;
        else itemName = menuItem.nameEn || menuItem.nameKu || menuItem.nameAr || 'Item';
      }
      const itemTotal = item.price * item.quantity;

      itemsRowsHtml += `<div style="margin: 5px 0; font-size: ${is58mm ? '13px' : '15.5px'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span style="width: 45px; font-weight: 600; text-align: ${isRtl ? 'right' : 'left'};">${item.quantity}</span>
          <span style="flex: 1; padding: 0 8px; font-weight: 600;">
            ${itemName}
            ${item.variantName ? `<span style="display: block; font-size: ${is58mm ? '11.5px' : '13px'}; color: #333; font-weight: 500;">(${item.variantName})</span>` : ''}
          </span>
          <span style="width: 110px; text-align: ${isRtl ? 'left' : 'right'}; font-weight: 600;">${curr} ${itemTotal.toLocaleString()}</span>
        </div>`;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          const aName = lang === 'ku' ? (addon.nameKu || addon.nameEn) : lang === 'ar' ? (addon.nameAr || addon.nameEn) : (addon.nameEn || 'Addon');
          itemsRowsHtml += `<div style="font-size: ${is58mm ? '11.5px' : '13px'}; color: #222; padding-${isRtl ? 'right' : 'left'}: 45px; margin-top: 1px;">
            ↳ + ${aName} ${addon.price > 0 ? `(+${curr} ${(addon.price * item.quantity).toLocaleString()})` : ''}
          </div>`;
        });
      }

      if (item.notes) {
        itemsRowsHtml += `<div style="font-size: ${is58mm ? '11px' : '12.5px'}; color: #444; font-style: italic; padding-${isRtl ? 'right' : 'left'}: 45px;">* Note: ${item.notes}</div>`;
      }

      itemsRowsHtml += '</div>';
    });
    itemsRowsHtml += '</div>';

    // 5. Totals Summary
    const totalsHtml = `<div style="border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; font-size: ${is58mm ? '13.5px' : '16px'};">
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span>${tr.subtotal}:</span>
        <span style="font-weight: 600;">${curr} ${data.order.subtotal.toLocaleString()}</span>
      </div>
      ${data.order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span>${tr.discount}:</span>
        <span style="font-weight: 600;">-${curr} ${data.order.discount.toLocaleString()}</span>
      </div>` : ''}
      ${data.order.serviceCharge && data.order.serviceCharge > 0 ? `<div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span>${tr.serviceCharge}:</span>
        <span style="font-weight: 600;">+${curr} ${data.order.serviceCharge.toLocaleString()}</span>
      </div>` : ''}

      <div style="border-top: 2px solid #000; margin: 8px 0;"></div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: ${is58mm ? '18px' : '22px'}; font-weight: 900; padding: 4px 0;">
        <span style="font-weight: 900; text-transform: uppercase;">${tr.total}:</span>
        <span style="font-weight: 900;">${curr} ${data.order.total.toLocaleString()}</span>
      </div>

      <div style="border-top: 2px solid #000; margin: 8px 0;"></div>

      <div style="display: flex; justify-content: space-between; font-size: ${is58mm ? '12.5px' : '14.5px'}; margin: 4px 0;">
        <span>${data.order.paymentMethod === 'card' ? (isRtl ? 'شێوازی پارەدان - کارت' : 'Payment - Card') : tr.payment}</span>
        <span style="font-weight: 600;">${curr} ${data.order.total.toLocaleString()}</span>
      </div>
    </div>`;

    // 6. Footer
    const footerHtml = `<div style="border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; text-align: center; font-size: ${is58mm ? '12px' : '14px'};">
      <div style="margin-bottom: 4px; font-weight: 700;">${tr.productsCount}: ${totalItemCount}</div>
      <div style="margin-bottom: 6px;">${data.footerText || tr.thanks}</div>
      <div style="font-size: ${is58mm ? '10px' : '11.5px'}; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; color: #333; margin-top: 8px;">
        POWERED BY MAS MENU
      </div>
    </div>`;

    container.innerHTML = logoHtml + cafeNameHtml + metaHtml + tableHeaderHtml + itemsRowsHtml + totalsHtml + footerHtml;
    document.body.appendChild(container);

    // Wait for logo image to load completely
    const imgElement = container.querySelector('img');
    if (imgElement && !imgElement.complete) {
      await new Promise((resolve) => {
        imgElement.onload = resolve;
        imgElement.onerror = resolve;
        setTimeout(resolve, 800);
      });
    }

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }

    // Scale canvas to exact thermal target width (576 or 384 dots)
    const scaleFactor = targetWidth / canvas.width;
    const finalHeight = Math.round(canvas.height * scaleFactor);

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = targetWidth;
    scaledCanvas.height = finalHeight;
    const scaledCtx = scaledCanvas.getContext('2d');
    if (!scaledCtx) throw new Error('Could not create scaled canvas context');

    scaledCtx.fillStyle = '#ffffff';
    scaledCtx.fillRect(0, 0, targetWidth, finalHeight);
    scaledCtx.drawImage(canvas, 0, 0, targetWidth, finalHeight);

    const imgData = scaledCtx.getImageData(0, 0, targetWidth, finalHeight);
    const pixels = imgData.data;

    // Convert to 1-bit monochrome raster buffer with high-fidelity luminance threshold
    const rasterBuffer = new Uint8Array(bytesWidth * finalHeight);
    for (let row = 0; row < finalHeight; row++) {
      for (let col = 0; col < targetWidth; col++) {
        const pIdx = (row * targetWidth + col) * 4;
        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];
        const a = pixels[pIdx + 3];

        // High sensitivity luminance threshold so every text stroke is solid without broken subpixels
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        const isBlack = a > 25 && lum < 210;
        if (isBlack) {
          const byteIdx = row * bytesWidth + Math.floor(col / 8);
          const bitIdx = 7 - (col % 8);
          rasterBuffer[byteIdx] |= (1 << bitIdx);
        }
      }
    }

    let binary = '';
    const len = rasterBuffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(rasterBuffer[i]);
    }
    const base64 = btoa(binary);

    return {
      rasterData: base64,
      width: targetWidth,
      height: finalHeight,
      bytesWidth,
    };
  }
}