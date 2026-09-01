import { FormattedReceiptData } from './receiptFormatter';

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
    const width = is58mm ? 384 : 576; // exact dot width of thermal head
    const bytesWidth = Math.ceil(width / 8);
    const lang = data.receiptLanguage || 'en';
    const isRtl = lang === 'ku' || lang === 'ar';
    const curr = data.currencySymbol || 'IQD';

    const leftX = is58mm ? 10 : 16;
    const rightX = is58mm ? 374 : 560;
    const centerX = width / 2;

    const tr = {
      en: {
        printedAt: 'Printed At:',
        orderNo: 'Check#',
        type: 'Type:',
        table: 'Table:',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        subtotal: 'Subtotal:',
        discount: 'Discount:',
        serviceCharge: 'Service:',
        total: 'TOTAL:',
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
        subtotal: 'کۆی گشتی:',
        discount: 'داشکاندن:',
        serviceCharge: 'خزمەتگوزاری:',
        total: 'کۆی کۆتایی:',
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
        subtotal: 'المجموع الفرعي:',
        discount: 'الخصم:',
        serviceCharge: 'رسوم الخدمة:',
        total: 'الإجمالي:',
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
      subtotal: 'Subtotal:',
      discount: 'Discount:',
      serviceCharge: 'Service:',
      total: 'TOTAL:',
      payment: 'Payment - Cash',
      productsCount: 'Products Count',
      dineIn: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      thanks: 'Thank you for your visit!',
      pleasure: 'The Pleasure of Taste',
    };

    // 1. Calculate dynamic height
    let estimatedHeight = is58mm ? 400 : 480;
    estimatedHeight += is58mm ? 120 : 160;
    if (data.address) estimatedHeight += 32;
    data.order.items.forEach((it) => {
      estimatedHeight += is58mm ? 36 : 44;
      if (it.selectedAddons && it.selectedAddons.length > 0) {
        estimatedHeight += it.selectedAddons.length * (is58mm ? 26 : 30);
      }
      if (it.notes) estimatedHeight += 28;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create canvas context');

    // Fill pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    const fontPrimary = isRtl
      ? "'Segoe UI', Tahoma, Arial, 'Noto Sans Arabic', sans-serif"
      : "'Segoe UI', Arial, -apple-system, sans-serif";

    let y = is58mm ? 12 : 18;

    // --- 1. DRAW LOGO ---
    const logoSource = logoUrl || data.logo || '/lamoge_logo.png';
    if (logoSource) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          logoImg.src = logoSource;
          if (logoImg.complete) resolve(null);
        });

        if (logoImg.width && logoImg.height) {
          const maxLogoW = is58mm ? 220 : 300;
          const maxLogoH = is58mm ? 90 : 120;
          let drawW = maxLogoW;
          let drawH = (logoImg.height / logoImg.width) * drawW;
          if (drawH > maxLogoH) {
            drawH = maxLogoH;
            drawW = (logoImg.width / logoImg.height) * drawH;
          }

          ctx.drawImage(logoImg, centerX - drawW / 2, y, drawW, drawH);
          y += drawH + (is58mm ? 10 : 14);
        }
      } catch (err) {
        console.warn('[ReceiptImageRenderer] Logo render error:', err);
      }
    }

    // --- 2. CAFE INFO ---
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.font = `bold ${is58mm ? '21px' : '26px'} ${fontPrimary}`;
    ctx.fillText((data.cafeName || 'LAMOGE CAFE').toUpperCase(), centerX, y);
    y += is58mm ? 26 : 32;

    ctx.font = `500 ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
    ctx.fillText(data.headerText || `Welcome to ${data.cafeName || 'Lamoge'}`, centerX, y);
    y += is58mm ? 20 : 24;

    if (data.address) {
      ctx.font = `400 ${is58mm ? '13px' : '15px'} ${fontPrimary}`;
      ctx.fillText(data.address, centerX, y);
      y += is58mm ? 18 : 22;
    }

    y += 6;

    // --- 3. DATE & ORDER META ---
    const dateObj = new Date(data.order.createdAt);
    const dateY = dateObj.getFullYear();
    const dateM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dateD = String(dateObj.getDate()).padStart(2, '0');
    let dateH = dateObj.getHours();
    const dateMin = String(dateObj.getMinutes()).padStart(2, '0');
    const dateSec = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = dateH >= 12 ? 'PM' : 'AM';
    dateH = dateH % 12 || 12;
    const formattedDateTime = `${dateY}/${dateM}/${dateD} ${String(dateH).padStart(2, '0')}:${dateMin}:${dateSec} ${ampm}`;

    ctx.font = `400 ${is58mm ? '13px' : '15px'} ${fontPrimary}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${tr.printedAt} ${formattedDateTime}`, centerX, y);
    y += is58mm ? 22 : 26;

    const drawDashedLine = (curY: number) => {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(leftX, curY);
      ctx.lineTo(rightX, curY);
      ctx.stroke();
      ctx.restore();
    };

    const drawSolidLine = (curY: number, lineW = 1.5) => {
      ctx.save();
      ctx.lineWidth = lineW;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(leftX, curY);
      ctx.lineTo(rightX, curY);
      ctx.stroke();
      ctx.restore();
    };

    drawDashedLine(y);
    y += 10;

    const orderTypeLabel = data.order.type === 'dine_in' ? tr.dineIn : data.order.type === 'takeaway' ? tr.takeaway : tr.delivery;
    const tableLabel = data.tableName || (data.order.tableId ? `${tr.table} ${data.order.tableId}` : '');

    const alignStart = isRtl ? 'right' : 'left';
    const alignEnd = isRtl ? 'left' : 'right';
    const posStart = isRtl ? rightX : leftX;
    const posEnd = isRtl ? leftX : rightX;

    ctx.font = `bold ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
    ctx.textAlign = alignStart;
    ctx.fillText(`${orderTypeLabel} ${tableLabel ? `(${tableLabel})` : ''}`, posStart, y);

    ctx.textAlign = alignEnd;
    ctx.fillText(`${tr.orderNo} ${data.order.invoiceCode || data.order.id.slice(0, 8).toUpperCase()}`, posEnd, y);
    y += is58mm ? 24 : 28;

    // --- 4. TABLE HEADER ---
    drawSolidLine(y, 1.5);
    y += 6;

    const qtyWidth = is58mm ? 40 : 50;

    const qtyX = isRtl ? rightX : leftX;
    const itemX = isRtl ? rightX - qtyWidth - 10 : leftX + qtyWidth + 10;
    const priceX = isRtl ? leftX : rightX;

    ctx.font = `bold ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(tr.qty, qtyX, y);

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(tr.item, itemX, y);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(tr.price, priceX, y);
    y += is58mm ? 22 : 26;

    drawSolidLine(y, 1.5);
    y += 8;

    // --- 5. ITEMS LIST ---
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      let itemName = 'Item';
      if (menuItem) {
        if (lang === 'ku' && menuItem.nameKu) itemName = menuItem.nameKu;
        else if (lang === 'ar' && menuItem.nameAr) itemName = menuItem.nameAr;
        else itemName = menuItem.nameEn || menuItem.nameKu || menuItem.nameAr || 'Item';
      }
      if (item.variantName) {
        itemName += ` (${item.variantName})`;
      }

      const itemTotal = item.price * item.quantity;

      ctx.font = `600 ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(String(item.quantity), qtyX, y);

      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(itemName, itemX, y);

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.fillText(`${curr} ${itemTotal.toLocaleString()}`, priceX, y);
      y += is58mm ? 24 : 28;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          const aName = lang === 'ku' ? (addon.nameKu || addon.nameEn) : lang === 'ar' ? (addon.nameAr || addon.nameEn) : (addon.nameEn || 'Addon');
          ctx.font = `400 ${is58mm ? '12px' : '14px'} ${fontPrimary}`;
          ctx.textAlign = isRtl ? 'right' : 'left';
          ctx.fillText(`  ↳ + ${aName} ${addon.price > 0 ? `(+${curr} ${(addon.price * item.quantity).toLocaleString()})` : ''}`, itemX, y);
          y += is58mm ? 18 : 22;
        });
      }

      if (item.notes) {
        ctx.font = `italic 400 ${is58mm ? '11px' : '13px'} ${fontPrimary}`;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(`  * Note: ${item.notes}`, itemX, y);
        y += is58mm ? 18 : 22;
      }
    });

    // --- 6. SUMMARY ---
    y += 2;
    drawDashedLine(y);
    y += 10;

    const drawSummaryRow = (label: string, value: string, isBold = false) => {
      ctx.font = `${isBold ? 'bold' : '500'} ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
      ctx.textAlign = alignStart;
      ctx.fillText(label, posStart, y);

      ctx.textAlign = alignEnd;
      ctx.fillText(value, posEnd, y);
      y += is58mm ? 22 : 26;
    };

    drawSummaryRow(tr.subtotal, `${curr} ${data.order.subtotal.toLocaleString()}`);

    if (data.order.discount > 0) {
      drawSummaryRow(tr.discount, `-${curr} ${data.order.discount.toLocaleString()}`);
    }

    if (data.order.serviceCharge && data.order.serviceCharge > 0) {
      drawSummaryRow(tr.serviceCharge, `+${curr} ${data.order.serviceCharge.toLocaleString()}`);
    }

    y += 4;
    drawSolidLine(y, 2.5);
    y += 8;

    // --- 7. GRAND TOTAL (ONLY BOLD & LARGE AS REQUESTED!) ---
    ctx.font = `900 ${is58mm ? '20px' : '26px'} ${fontPrimary}`;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.total, posStart, y);

    ctx.textAlign = alignEnd;
    ctx.fillText(`${curr} ${data.order.total.toLocaleString()}`, posEnd, y);
    y += is58mm ? 30 : 36;

    drawSolidLine(y, 2.5);
    y += 10;

    // Payment
    const paymentLabel = data.order.paymentMethod === 'card' ? (isRtl ? 'شێوازی پارەدان - کارت' : 'Payment - Card') : tr.payment;
    drawSummaryRow(paymentLabel, `${curr} ${data.order.total.toLocaleString()}`);

    // --- 8. FOOTER ---
    y += 4;
    drawSolidLine(y, 1);
    y += 12;

    const totalItemCount = data.order.items.reduce((sum, it) => sum + it.quantity, 0);

    ctx.textAlign = 'center';
    ctx.font = `600 ${is58mm ? '13px' : '15px'} ${fontPrimary}`;
    ctx.fillText(`${tr.productsCount}: ${totalItemCount}`, centerX, y);
    y += is58mm ? 20 : 24;

    ctx.font = `500 ${is58mm ? '13px' : '15px'} ${fontPrimary}`;
    ctx.fillText(data.footerText || tr.thanks, centerX, y);
    y += is58mm ? 22 : 26;

    ctx.font = `bold ${is58mm ? '11px' : '13px'} ${fontPrimary}`;
    ctx.fillStyle = '#333333';
    ctx.fillText('POWERED BY MAS MENU', centerX, y);
    y += is58mm ? 24 : 30;

    const finalHeight = y;

    // Crop to exact final height
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Could not create final canvas context');

    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, width, finalHeight);
    finalCtx.drawImage(canvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);

    const imgData = finalCtx.getImageData(0, 0, width, finalHeight);
    const pixels = imgData.data;

    // Convert to 1-bit monochrome raster buffer
    const rasterBuffer = new Uint8Array(bytesWidth * finalHeight);
    for (let row = 0; row < finalHeight; row++) {
      for (let col = 0; col < width; col++) {
        const pIdx = (row * width + col) * 4;
        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];
        const a = pixels[pIdx + 3];

        // Strict high-contrast black pixel detection for crystal clear thermal print
        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        const isBlack = a > 40 && lum < 205;
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
      width,
      height: finalHeight,
      bytesWidth,
    };
  }
}