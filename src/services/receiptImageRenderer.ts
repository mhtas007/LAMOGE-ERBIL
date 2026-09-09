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
    y += 12;

    const alignPos = isRtl ? rightX : leftX;
    ctx.textAlign = isRtl ? 'right' : 'left';

    // 1. Date (Label then Value)
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.date, alignPos, y);
    y += is58mm ? 20 : 25;

    const valWeight = isRtl ? '500' : 'bold';
    ctx.font = `${valWeight} ${is58mm ? '17px' : '22px'} ${fontPrimary}`;
    ctx.fillText(formattedDateTime, alignPos, y);
    y += is58mm ? 24 : 30;

    // 2. Invoice / Order # (Label then Value)
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.orderNo, alignPos, y);
    y += is58mm ? 20 : 25;

    const invoiceVal = data.order.invoiceCode || data.order.id.slice(0, 8).toUpperCase();
    ctx.font = `bold ${is58mm ? '18px' : '23px'} ${fontPrimary}`;
    ctx.fillText(invoiceVal, alignPos, y);
    y += is58mm ? 24 : 30;

    // 3. Order Type (Label then Value)
    ctx.font = `bold ${is58mm ? '15px' : '18px'} ${fontPrimary}`;
    ctx.fillText(tr.type, alignPos, y);
    y += is58mm ? 20 : 25;

    const orderTypeLabel = data.order.type === 'dine_in' ? tr.dineIn : data.order.type === 'takeaway' ? tr.takeaway : tr.delivery;
    const tableLabel = data.tableName || (data.order.tableId ? `${tr.table} ${data.order.tableId}` : '');
    const typeVal = `${orderTypeLabel} ${tableLabel ? `(${tableLabel})` : ''}`.trim();
    ctx.font = `${valWeight} ${is58mm ? '17px' : '22px'} ${fontPrimary}`;
    ctx.fillText(typeVal, alignPos, y);
    y += is58mm ? 26 : 32;

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

        // Balanced natural black pixel detection for crisp, clean thermal print
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
}