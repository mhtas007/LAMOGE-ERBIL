import { FormattedReceiptData, ZReportData, KitchenTicketData } from './receiptFormatter';

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
        date: 'Date:',
        orderNo: 'Invoice #:',
        type: 'Type:',
        table: 'Table',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        discount: 'Discount:',
        serviceCharge: 'Service:',
        total: 'TOTAL:',
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
        discount: 'داشکاندن:',
        serviceCharge: 'خزمەتگوزاری:',
        total: 'کۆی کۆتایی:',
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
        discount: 'الخصم:',
        serviceCharge: 'رسوم الخدمة:',
        total: 'الإجمالي:',
        dineIn: 'صالة',
        takeaway: 'سفري',
        delivery: 'توصيل',
        welcome: 'أهلاً وسهلاً بكم في',
        thanks: 'شكراً لزيارتكم',
        pleasure: 'متعة المذاق الرفيع',
      },
    }[lang] || {
      date: 'Date:',
      orderNo: 'Invoice #:',
      type: 'Type:',
      table: 'Table',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      discount: 'Discount:',
      serviceCharge: 'Service:',
      total: 'TOTAL:',
      dineIn: 'Dine In',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      welcome: 'Welcome to',
      thanks: 'Thank you for your visit!',
      pleasure: 'The Pleasure of Taste',
    };

    // 1. Calculate dynamic height
    let estimatedHeight = is58mm ? 480 : 580;
    estimatedHeight += is58mm ? 120 : 160;
    if (data.address) estimatedHeight += 36;
    data.order.items.forEach((it) => {
      estimatedHeight += is58mm ? 36 : 46;
      if (it.selectedAddons && it.selectedAddons.length > 0) {
        estimatedHeight += it.selectedAddons.length * (is58mm ? 28 : 34);
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

    // --- 1. DRAW LOGO (Dynamic from Settings) ---
    let logoSource: string | null = null;
    if (data.logo !== undefined) {
      logoSource = data.logo; // can be custom data: URL, image URL, or null if removed
    } else if (logoUrl) {
      logoSource = logoUrl;
    } else {
      logoSource = '/lamoge_logo.png';
    }

    if (logoSource) {
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          logoImg.src = logoSource!;
          if (logoImg.complete) resolve(null);
        });

        if (logoImg.width && logoImg.height) {
          const maxLogoW = is58mm ? 220 : 320;
          const maxLogoH = is58mm ? 90 : 130;
          let drawW = maxLogoW;
          let drawH = (logoImg.height / logoImg.width) * drawW;
          if (drawH > maxLogoH) {
            drawH = maxLogoH;
            drawW = (logoImg.width / logoImg.height) * drawH;
          }

          ctx.drawImage(logoImg, centerX - drawW / 2, y, drawW, drawH);
          y += drawH + (is58mm ? 12 : 16);
        }
      } catch (err) {
        console.warn('[ReceiptImageRenderer] Logo render error:', err);
      }
    }

    // --- 2. CAFE NAME & INFO (Dynamic from Settings) ---
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';

    ctx.font = `bold ${is58mm ? '24px' : '30px'} ${fontPrimary}`;
    ctx.fillText((data.cafeName || 'LAMOGE CAFE').toUpperCase(), centerX, y);
    y += is58mm ? 30 : 38;

    ctx.font = `500 ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    const defaultWelcome = `${tr.welcome} ${data.cafeName || 'LAMOGE'}`;
    const headerDisplay = (!data.headerText || data.headerText.startsWith('Welcome to') || data.headerText.startsWith('بەخێر بێن بۆ') || data.headerText.startsWith('أهلاً'))
      ? defaultWelcome
      : data.headerText;
    ctx.fillText(headerDisplay, centerX, y);
    y += is58mm ? 22 : 26;

    if (data.address) {
      ctx.font = `400 ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
      ctx.fillText(data.address, centerX, y);
      y += is58mm ? 20 : 24;
    }

    if (data.isReprint) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `bold ${is58mm ? '16px' : '20px'} ${fontPrimary}`;
      ctx.fillText(isRtl ? '*** وەسڵی دووبارە / REPRINT ***' : '*** REPRINT / DUPLICATE ***', centerX, y);
      y += is58mm ? 22 : 28;
      ctx.restore();
    }

    y += 8;

    // --- 3. METADATA SECTION (Stacked Vertically Under Each Other) ---
    const dateObj = new Date(data.order.createdAt);
    const dateY = dateObj.getFullYear();
    const dateM = dateObj.getMonth() + 1;
    const dateD = dateObj.getDate();
    let dateH = dateObj.getHours();
    const dateMin = String(dateObj.getMinutes()).padStart(2, '0');
    let period = '';
    if (lang === 'ku') {
      period = dateH >= 12 ? 'ئێوارە' : 'بەیانی';
    } else if (lang === 'ar') {
      period = dateH >= 12 ? 'مساءً' : 'صباحاً';
    } else {
      period = dateH >= 12 ? 'PM' : 'AM';
    }
    dateH = dateH % 12 || 12;
    const formattedDateTime = `${dateY}/${dateM}/${dateD} ${dateH}:${dateMin} ${period}`;

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
    y += 14;

    const alignStart: CanvasTextAlign = isRtl ? 'right' : 'left';
    const alignEnd: CanvasTextAlign = isRtl ? 'left' : 'right';
    const posStart = isRtl ? rightX : leftX;
    const posEnd = isRtl ? leftX : rightX;

    const labelPos = posStart;
    const valPos = posEnd;
    const labelAlign = alignStart;
    const valAlign = alignEnd;
    const rowGap = is58mm ? 22 : 26;
    const valWeight = isRtl ? '500' : 'bold';

    // 1. Date
    ctx.textAlign = labelAlign;
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.date, labelPos, y);

    ctx.textAlign = valAlign;
    ctx.font = `${valWeight} ${is58mm ? '15px' : '19px'} ${fontPrimary}`;
    ctx.fillText(formattedDateTime, valPos, y);
    y += rowGap;

    // 2. Invoice / Order #
    ctx.textAlign = labelAlign;
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.orderNo, labelPos, y);

    const invoiceVal = data.order.invoiceCode || data.order.id.slice(0, 8).toUpperCase();
    ctx.textAlign = valAlign;
    ctx.font = `bold ${is58mm ? '16px' : '20px'} ${fontPrimary}`;
    ctx.fillText(invoiceVal, valPos, y);
    y += rowGap;

    // 3. Order Type
    ctx.textAlign = labelAlign;
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.type, labelPos, y);

    const orderTypeLabel = data.order.type === 'dine_in' ? tr.dineIn : data.order.type === 'takeaway' ? tr.takeaway : tr.delivery;
    const tableLabel = data.tableName || (data.order.tableId ? `${tr.table} ${data.order.tableId}` : '');
    const typeVal = `${orderTypeLabel} ${tableLabel ? `(${tableLabel})` : ''}`.trim();
    ctx.textAlign = valAlign;
    ctx.font = `${valWeight} ${is58mm ? '15px' : '19px'} ${fontPrimary}`;
    ctx.fillText(typeVal, valPos, y);
    y += rowGap + 4;

    if (data.isReprint) {
      ctx.textAlign = 'center';
      ctx.font = `bold ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
      const reprintText = lang === 'ku' ? '** دووبارە چاپکراوە / REPRINT **' : lang === 'ar' ? '** نسخة معادة / REPRINT **' : '** REPRINT **';
      ctx.fillText(reprintText, centerX, y);
      y += is58mm ? 20 : 24;
    }

    // --- 4. TABLE HEADER ---
    drawSolidLine(y, 2);
    y += 8;

    const qtyWidth = is58mm ? 45 : 55;

    const qtyX = isRtl ? rightX : leftX;
    const itemX = isRtl ? rightX - qtyWidth - 10 : leftX + qtyWidth + 10;
    const priceX = isRtl ? leftX : rightX;

    const tableHeaderWeight = isRtl ? '600' : 'bold';
    ctx.font = `${tableHeaderWeight} ${is58mm ? '17px' : '22px'} ${fontPrimary}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(tr.qty, qtyX, y);

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(tr.item, itemX, y);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(tr.price, priceX, y);
    y += is58mm ? 26 : 30;

    drawSolidLine(y, 2);
    y += 10;

    // --- 5. ITEMS LIST (Lighter 500 for Kurdish/Arabic, Bold for English) ---
    const itemWeight = isRtl ? '500' : 'bold';
    const addonWeight = isRtl ? '400' : '500';

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

      ctx.font = `${itemWeight} ${is58mm ? '20px' : '25px'} ${fontPrimary}`;
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(String(item.quantity), qtyX, y);

      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(itemName, itemX, y);

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.fillText(`${curr} ${itemTotal.toLocaleString()}`, priceX, y);
      y += is58mm ? 28 : 34;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          const aName = lang === 'ku' ? (addon.nameKu || addon.nameEn) : lang === 'ar' ? (addon.nameAr || addon.nameEn) : (addon.nameEn || 'Addon');
          ctx.font = `${addonWeight} ${is58mm ? '17px' : '22px'} ${fontPrimary}`;
          ctx.textAlign = isRtl ? 'right' : 'left';
          ctx.fillText(`  ↳ + ${aName} ${addon.price > 0 ? `(+${curr} ${(addon.price * item.quantity).toLocaleString()})` : ''}`, itemX, y);
          y += is58mm ? 24 : 28;
        });
      }

      if (item.notes) {
        ctx.font = `italic 400 ${is58mm ? '13px' : '16px'} ${fontPrimary}`;
        ctx.textAlign = isRtl ? 'right' : 'left';
        ctx.fillText(`  * Note: ${item.notes}`, itemX, y);
        y += is58mm ? 20 : 24;
      }
    });

    // --- 6. SUMMARY ---
    y += 4;
    drawDashedLine(y);
    y += 10;

    if (data.order.discount > 0) {
      ctx.font = `${itemWeight} ${is58mm ? '16px' : '20px'} ${fontPrimary}`;
      ctx.textAlign = alignStart;
      ctx.fillText(tr.discount, posStart, y);
      ctx.textAlign = alignEnd;
      ctx.fillText(`-${curr} ${data.order.discount.toLocaleString()}`, posEnd, y);
      y += is58mm ? 24 : 28;
    }

    if (data.order.serviceCharge && data.order.serviceCharge > 0) {
      ctx.font = `${itemWeight} ${is58mm ? '16px' : '20px'} ${fontPrimary}`;
      ctx.textAlign = alignStart;
      ctx.fillText(tr.serviceCharge, posStart, y);
      ctx.textAlign = alignEnd;
      ctx.fillText(`+${curr} ${data.order.serviceCharge.toLocaleString()}`, posEnd, y);
      y += is58mm ? 24 : 28;
    }

    drawSolidLine(y, 3);
    y += 10;

    // --- 7. GRAND TOTAL (700 for Kurdish/Arabic, 900 for English) ---
    const totalWeight = isRtl ? '700' : '900';
    ctx.font = `${totalWeight} ${is58mm ? '24px' : '30px'} ${fontPrimary}`;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.total, posStart, y);

    ctx.textAlign = alignEnd;
    ctx.fillText(`${curr} ${data.order.total.toLocaleString()}`, posEnd, y);
    y += is58mm ? 36 : 42;

    drawSolidLine(y, 3);
    y += 12;

    // --- 8. FOOTER ---
    ctx.textAlign = 'center';

    ctx.font = `500 ${is58mm ? '14px' : '17px'} ${fontPrimary}`;
    const defaultThanks = tr.thanks;
    const footerDisplay = (!data.footerText || data.footerText === 'Thank you for your visit!' || data.footerText === 'سەردانەکەت جێگەی دڵخۆشیمانە' || data.footerText === 'شكراً لزيارتكم' || data.footerText === 'سوپاس بۆ سەردانەکەت')
      ? defaultThanks
      : data.footerText;
    ctx.fillText(footerDisplay, centerX, y);
    y += is58mm ? 24 : 28;

    ctx.font = `bold ${is58mm ? '11px' : '13px'} ${fontPrimary}`;
    ctx.fillStyle = '#333333';
    ctx.fillText('POWERED BY MAS MENU', centerX, y);
    y += is58mm ? 24 : 30;

    const finalHeight = y;

    return this.canvasToMonochromeRaster(canvas, width, finalHeight, bytesWidth);
  }

  /**
   * Helper to convert an HTML5 Canvas into a 1-bit monochrome raster buffer
   */
  public static canvasToMonochromeRaster(
    sourceCanvas: HTMLCanvasElement,
    width: number,
    finalHeight: number,
    bytesWidth: number
  ): RasterReceiptResult {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Could not create final canvas context');

    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, width, finalHeight);
    finalCtx.drawImage(sourceCanvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);

    const imgData = finalCtx.getImageData(0, 0, width, finalHeight);
    const pixels = imgData.data;

    const rasterBuffer = new Uint8Array(bytesWidth * finalHeight);
    for (let row = 0; row < finalHeight; row++) {
      for (let col = 0; col < width; col++) {
        const pIdx = (row * width + col) * 4;
        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];
        const a = pixels[pIdx + 3];

        const lum = r * 0.299 + g * 0.587 + b * 0.114;
        const isBlack = a > 50 && lum < 205;
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

  /**
   * Renders Shift Closure (Z-Report) to 1-bit monochrome thermal raster
   */
  public static async renderZReportToRaster(
    data: ZReportData,
    paperWidth: '80mm' | '58mm' = '80mm'
  ): Promise<RasterReceiptResult> {
    const is58mm = paperWidth === '58mm';
    const width = is58mm ? 384 : 576;
    const bytesWidth = Math.ceil(width / 8);
    const leftX = is58mm ? 10 : 16;
    const rightX = is58mm ? 374 : 560;
    const centerX = width / 2;
    const curr = data.currencySymbol || 'IQD';
    const font = "'Segoe UI', Tahoma, Arial, 'Noto Sans Arabic', sans-serif";

    const estimatedHeight = is58mm ? 700 : 850;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    let y = 16;

    // Header Title
    ctx.textAlign = 'center';
    ctx.font = `bold ${is58mm ? '20px' : '26px'} ${font}`;
    ctx.fillText(data.cafeName || 'LAMOGE CAFE', centerX, y);
    y += is58mm ? 26 : 34;

    ctx.fillStyle = '#000000';
    ctx.fillRect(leftX, y, rightX - leftX, is58mm ? 30 : 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${is58mm ? '15px' : '19px'} ${font}`;
    ctx.fillText('ڕاپۆرتی داخستنی شیفت / Z-REPORT', centerX, y + (is58mm ? 6 : 8));
    ctx.fillStyle = '#000000';
    y += is58mm ? 40 : 50;

    // Shift Meta
    ctx.textAlign = 'right';
    ctx.font = `600 ${is58mm ? '13px' : '16px'} ${font}`;
    ctx.fillText(`کارمەند: ${data.userName} (${data.userRole})`, rightX, y);
    y += is58mm ? 22 : 26;

    const formatDt = (dtStr: string) => {
      try {
        const d = new Date(dtStr);
        return d.toLocaleDateString('ku-IQ') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return dtStr;
      }
    };

    ctx.fillText(`دەستپێک: ${formatDt(data.clockInTime)}`, rightX, y);
    y += is58mm ? 22 : 26;
    ctx.fillText(`کۆتایی: ${formatDt(data.clockOutTime)}`, rightX, y);
    y += is58mm ? 22 : 26;
    ctx.fillText(`ماوەی کارکردن: ${data.totalHours.toFixed(1)} کاتژمێر`, rightX, y);
    y += is58mm ? 26 : 32;

    // Divider
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
    y += 12;

    // Sales Section
    ctx.font = `bold ${is58mm ? '14px' : '17px'} ${font}`;
    ctx.fillText('پوختەی فرۆشتن و داهات:', rightX, y);
    y += is58mm ? 24 : 28;

    const drawRow = (label: string, val: string, isBold = false) => {
      ctx.font = `${isBold ? 'bold' : '500'} ${is58mm ? '13px' : '16px'} ${font}`;
      ctx.textAlign = 'right';
      ctx.fillText(label, rightX, y);
      ctx.textAlign = 'left';
      ctx.fillText(val, leftX, y);
      y += is58mm ? 22 : 26;
    };

    drawRow('کۆی پسوولەکان:', `${data.totalOrders} وەسڵ`);
    if (data.cashSales !== undefined) drawRow('فرۆشی کاش:', `${curr} ${data.cashSales.toLocaleString()}`);
    if (data.cardSales !== undefined && data.cardSales > 0) drawRow('فرۆشی کارت:', `${curr} ${data.cardSales.toLocaleString()}`);
    if (data.digitalSales !== undefined && data.digitalSales > 0) drawRow('فرۆشی FIB / FastPay:', `${curr} ${data.digitalSales.toLocaleString()}`);
    drawRow('کۆی گشتی داهات:', `${curr} ${data.totalSales.toLocaleString()}`, true);

    y += 8;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
    y += 12;

    // Cash Reconciliation Section
    ctx.font = `bold ${is58mm ? '14px' : '17px'} ${font}`;
    ctx.textAlign = 'right';
    ctx.fillText('تەرازوی سندوق (Cash Drawer):', rightX, y);
    y += is58mm ? 24 : 28;

    drawRow('سەرمایەی سەرەتا:', `${curr} ${(data.startingCash || 0).toLocaleString()}`);
    drawRow('کاشی چاوەڕوانکراو:', `${curr} ${data.expectedCash.toLocaleString()}`);
    drawRow('کاشی ژمێردراوی کاشێر:', `${curr} ${data.declaredCash.toLocaleString()}`, true);

    // Discrepancy with highlight
    const disc = data.discrepancy;
    let discText = 'تەواو و بێ جیاوازی (0)';
    if (disc > 0) discText = `+${disc.toLocaleString()} ${curr} (زیادە)`;
    if (disc < 0) discText = `${disc.toLocaleString()} ${curr} (کورتێنان)`;
    drawRow('جیاوازی سندوق:', discText, true);

    y += 16;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
    y += 24;

    // Signatures
    ctx.textAlign = 'right';
    ctx.font = `500 ${is58mm ? '12px' : '15px'} ${font}`;
    ctx.fillText('واژۆی کاشێر:  ___________________', rightX, y);
    y += is58mm ? 30 : 38;
    ctx.fillText('واژۆی بەڕێوەبەر: ___________________', rightX, y);
    y += is58mm ? 36 : 46;

    ctx.textAlign = 'center';
    ctx.font = `bold 11px ${font}`;
    ctx.fillText('LAMOGE POS • SHIFT CLOSING VERIFIED', centerX, y);
    y += 24;

    return this.canvasToMonochromeRaster(canvas, width, y, bytesWidth);
  }

  /**
   * Renders Kitchen / Bar Order Ticket (KOT) without pricing
   */
  public static async renderKitchenTicketToRaster(
    data: KitchenTicketData,
    paperWidth: '80mm' | '58mm' = '80mm'
  ): Promise<RasterReceiptResult> {
    const is58mm = paperWidth === '58mm';
    const width = is58mm ? 384 : 576;
    const bytesWidth = Math.ceil(width / 8);
    const leftX = is58mm ? 10 : 16;
    const rightX = is58mm ? 374 : 560;
    const centerX = width / 2;
    const font = "'Segoe UI', Tahoma, Arial, 'Noto Sans Arabic', sans-serif";

    let estimatedHeight = is58mm ? 400 : 500;
    data.order.items.forEach((it) => {
      estimatedHeight += is58mm ? 44 : 56;
      if (it.notes) estimatedHeight += 24;
      if (it.selectedAddons) estimatedHeight += it.selectedAddons.length * 20;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    let y = 14;

    // Header banner
    ctx.fillRect(leftX, y, rightX - leftX, is58mm ? 34 : 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${is58mm ? '17px' : '22px'} ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText('*** چێشتخانە و بار / KITCHEN TICKET ***', centerX, y + (is58mm ? 6 : 8));
    ctx.fillStyle = '#000000';
    y += is58mm ? 44 : 54;

    // Table / Type Big
    ctx.textAlign = 'center';
    ctx.font = `900 ${is58mm ? '24px' : '32px'} ${font}`;
    const destination = data.tableName ? data.tableName : (data.order.type === 'dine_in' ? 'هۆڵ' : 'سەفەری (TAKEAWAY)');
    ctx.fillText(destination, centerX, y);
    y += is58mm ? 32 : 40;

    ctx.textAlign = 'right';
    ctx.font = `600 ${is58mm ? '13px' : '16px'} ${font}`;
    const invoiceNo = data.order.invoiceCode || `#${data.order.id.slice(0, 8)}`;
    ctx.fillText(`ژمارەی پسوولە: ${invoiceNo}`, rightX, y);
    ctx.textAlign = 'left';
    const timeStr = new Date(data.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ctx.fillText(`کات: ${timeStr}`, leftX, y);
    y += is58mm ? 24 : 30;

    // Solid line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
    y += 12;

    // Items
    for (const item of data.order.items) {
      const menuObj = data.menuItems.find((m) => m.id === item.menuItemId);
      const itemName = menuObj ? (menuObj.nameKu || menuObj.nameAr || menuObj.nameEn) : 'کاڵا';

      ctx.textAlign = 'right';
      ctx.font = `bold ${is58mm ? '18px' : '23px'} ${font}`;
      ctx.fillText(`${itemName}`, rightX - 60, y);

      // Big Qty box
      ctx.textAlign = 'left';
      ctx.font = `900 ${is58mm ? '19px' : '24px'} ${font}`;
      ctx.fillText(`[ ${item.quantity}x ]`, leftX, y);
      y += is58mm ? 26 : 32;

      if (item.variantName) {
        ctx.textAlign = 'right';
        ctx.font = `600 ${is58mm ? '12px' : '15px'} ${font}`;
        ctx.fillText(`  سایز: ${item.variantName}`, rightX - 20, y);
        y += is58mm ? 18 : 22;
      }

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        ctx.textAlign = 'right';
        ctx.font = `500 ${is58mm ? '12px' : '14px'} ${font}`;
        const addonsStr = item.selectedAddons.map((a) => a.nameKu || a.nameAr || a.nameEn).join(' + ');
        ctx.fillText(`  زیادکراو: + ${addonsStr}`, rightX - 20, y);
        y += is58mm ? 18 : 22;
      }

      if (item.notes) {
        ctx.textAlign = 'right';
        ctx.font = `italic 600 ${is58mm ? '12px' : '14px'} ${font}`;
        ctx.fillText(`  * تێبینی: ${item.notes}`, rightX - 20, y);
        y += is58mm ? 18 : 22;
      }

      y += 8;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();
      y += 10;
    }

    if (data.order.notes) {
      y += 6;
      ctx.font = `bold ${is58mm ? '13px' : '16px'} ${font}`;
      ctx.textAlign = 'right';
      ctx.fillText(`تێبینی گشتی: ${data.order.notes}`, rightX, y);
      y += is58mm ? 22 : 28;
    }

    y += 16;
    return this.canvasToMonochromeRaster(canvas, width, y, bytesWidth);
  }
}