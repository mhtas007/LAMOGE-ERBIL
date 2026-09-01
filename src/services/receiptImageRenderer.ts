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

    // 1. Check if #receipt-print-root or .receipt-paper is already in DOM
    const sourceElement = document.getElementById('receipt-print-root') || document.querySelector('.receipt-paper');
    let tempContainer: HTMLElement | null = null;
    let canvas: HTMLCanvasElement | null = null;

    if (sourceElement) {
      // Clone element into off-screen visible wrapper to capture perfectly with CSS styles
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = is58mm ? '280px' : '380px';
      tempContainer.style.background = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-99999';
      tempContainer.style.display = 'block';
      tempContainer.style.visibility = 'visible';

      const clone = sourceElement.cloneNode(true) as HTMLElement;
      clone.style.display = 'block';
      clone.style.visibility = 'visible';
      clone.style.boxShadow = 'none';
      clone.style.margin = '0 auto';
      clone.style.background = '#ffffff';
      clone.style.color = '#000000';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      try {
        canvas = await html2canvas(clone, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
        });
      } catch (domErr) {
        console.warn('[ReceiptImageRenderer] html2canvas DOM capture fallback:', domErr);
      } finally {
        if (tempContainer && tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
      }
    }

    // Fallback: If DOM capture wasn't available, generate canvas directly
    if (!canvas) {
      canvas = await this.renderCanvasFallback(data, is58mm, logoUrl);
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

    // Convert to 1-bit monochrome raster buffer (1 = black, 0 = white)
    const rasterBuffer = new Uint8Array(bytesWidth * finalHeight);
    for (let row = 0; row < finalHeight; row++) {
      for (let col = 0; col < targetWidth; col++) {
        const pIdx = (row * targetWidth + col) * 4;
        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];
        const a = pixels[pIdx + 3];

        // Strict luminance threshold for thermal paper (< 175 is black)
        const isBlack = a > 40 && (r * 0.299 + g * 0.587 + b * 0.114) < 175;
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

  private static async renderCanvasFallback(
    data: FormattedReceiptData,
    is58mm: boolean,
    logoUrl?: string
  ): Promise<HTMLCanvasElement> {
    const width = is58mm ? 384 : 576;
    const lang = data.receiptLanguage || 'en';
    const isRtl = lang === 'ku' || lang === 'ar';
    const curr = data.currencySymbol || 'IQD';

    const tr = {
      en: {
        date: 'Date:',
        orderNo: 'Order No:',
        type: 'Type:',
        table: 'Table:',
        item: 'Item',
        qty: 'Qty',
        price: 'Price',
        subtotal: 'Subtotal:',
        discount: 'Discount:',
        service: 'Service:',
        total: 'TOTAL:',
        payment: 'Payment:',
        thanks: 'Thank you for your visit!',
        dineIn: 'DINE IN',
        takeaway: 'TAKEAWAY',
      },
      ku: {
        date: 'بەروار:',
        orderNo: 'ژمارەی پسوولە:',
        type: 'جۆر:',
        table: 'مێز:',
        item: 'بابەت',
        qty: 'دانە',
        price: 'نرخ',
        subtotal: 'کۆی گشتی:',
        discount: 'داشکاندن:',
        service: 'خزمەتگوزاری:',
        total: 'کۆی کۆتایی:',
        payment: 'شێوازی پارەدان:',
        thanks: 'سەردانەکەت جێگەی دڵخۆشیمانە',
        dineIn: 'DINE IN',
        takeaway: 'TAKEAWAY',
      },
      ar: {
        date: 'التاريخ:',
        orderNo: 'رقم الطلب:',
        type: 'النوع:',
        table: 'الطاولة:',
        item: 'الصنف',
        qty: 'الكمية',
        price: 'السعر',
        subtotal: 'المجموع الإجمالي:',
        discount: 'الخصم:',
        service: 'الخدمة:',
        total: 'الإجمالي:',
        payment: 'طريقة الدفع:',
        thanks: 'شكراً لزيارتكم',
        dineIn: 'DINE IN',
        takeaway: 'TAKEAWAY',
      },
    }[lang] || {
      date: 'Date:',
      orderNo: 'Order No:',
      type: 'Type:',
      table: 'Table:',
      item: 'Item',
      qty: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal:',
      discount: 'Discount:',
      service: 'Service:',
      total: 'TOTAL:',
      payment: 'Payment:',
      thanks: 'Thank you for your visit!',
      dineIn: 'DINE IN',
      takeaway: 'TAKEAWAY',
    };

    let estimatedHeight = 350;
    if (logoUrl) estimatedHeight += 120;
    data.order.items.forEach((item) => {
      estimatedHeight += 50;
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        estimatedHeight += item.selectedAddons.length * 28;
      }
    });
    estimatedHeight += 250;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas fallback failed');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    let y = 20;

    // Logo
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoUrl;
        });
        if (img.width && img.height) {
          const lSize = 90;
          ctx.save();
          ctx.beginPath();
          ctx.arc(width / 2, y + lSize / 2, lSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.clip();
          ctx.drawImage(img, (width - lSize) / 2, y, lSize, lSize);
          ctx.restore();
          y += lSize + 16;
        }
      } catch (e) {
        console.warn('Logo error:', e);
      }
    }

    const fontPrimary = isRtl ? "'Segoe UI', Tahoma, Arial, sans-serif" : "'Courier New', monospace, sans-serif";

    ctx.font = '900 26px ' + fontPrimary;
    ctx.textAlign = 'center';
    ctx.fillText((data.cafeName || 'LAMOGE CAFE').toUpperCase(), width / 2, y);
    y += 36;

    ctx.font = 'bold 15px ' + fontPrimary;
    ctx.fillText(data.headerText || ('Welcome to ' + (data.cafeName || 'Lamoge Cafe')), width / 2, y);
    y += 24;

    if (data.address) {
      ctx.fillText(data.address, width / 2, y);
      y += 22;
    }
    ctx.fillText(data.phone ? ('Tel: ' + data.phone) : 'Tel:', width / 2, y);
    y += 28;

    // Dashed line
    const drawDash = (curY: number) => {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(14, curY);
      ctx.lineTo(width - 14, curY);
      ctx.stroke();
      ctx.restore();
    };

    drawDash(y);
    y += 16;

    const startX = isRtl ? width - 14 : 14;
    const endX = isRtl ? 14 : width - 14;
    const alignStart = isRtl ? 'right' : 'left';
    const alignEnd = isRtl ? 'left' : 'right';

    ctx.font = 'bold 16px ' + fontPrimary;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.date, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(new Date(data.order.createdAt).toLocaleDateString(), endX, y);
    y += 26;

    ctx.textAlign = alignStart;
    ctx.fillText(tr.orderNo, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(data.order.invoiceCode || ('INV-' + data.order.id.slice(0, 8)), endX, y);
    y += 26;

    ctx.textAlign = alignStart;
    ctx.fillText(tr.type, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(data.order.type === 'dine_in' ? tr.dineIn : tr.takeaway, endX, y);
    y += 26;

    drawDash(y);
    y += 16;

    // Items
    ctx.font = '900 17px ' + fontPrimary;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.item, startX, y);
    ctx.textAlign = 'center';
    ctx.fillText(tr.qty, width * 0.62, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(tr.price, endX, y);
    y += 28;

    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      let name = menuItem?.nameKu || menuItem?.nameAr || menuItem?.nameEn || 'Item';
      if (lang === 'ku' && menuItem?.nameKu) name = menuItem.nameKu;
      if (lang === 'ar' && menuItem?.nameAr) name = menuItem.nameAr;
      if (lang === 'en' && menuItem?.nameEn) name = menuItem.nameEn;

      ctx.font = 'bold 16px ' + fontPrimary;
      ctx.textAlign = alignStart;
      ctx.fillText(name, startX, y);
      ctx.textAlign = 'center';
      ctx.fillText(String(item.quantity), width * 0.62, y);
      ctx.textAlign = alignEnd;
      ctx.fillText((item.price * item.quantity).toLocaleString(), endX, y);
      y += 26;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          let addonName = addon.nameKu || addon.nameAr || addon.nameEn || 'Addon';
          if (lang === 'ku' && addon.nameKu) addonName = addon.nameKu;
          if (lang === 'ar' && addon.nameAr) addonName = addon.nameAr;
          if (lang === 'en' && addon.nameEn) addonName = addon.nameEn;

          ctx.font = 'bold 14px ' + fontPrimary;
          ctx.textAlign = alignStart;
          ctx.fillText('  ↳ + ' + addonName + ' (+' + addon.price.toLocaleString() + ')', startX, y);
          y += 22;
        });
      }
    });

    drawDash(y);
    y += 16;

    ctx.font = 'bold 17px ' + fontPrimary;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.subtotal, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(data.order.subtotal.toLocaleString(), endX, y);
    y += 28;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(width - 14, y);
    ctx.stroke();
    ctx.restore();
    y += 14;

    ctx.font = '900 22px ' + fontPrimary;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.total, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(isRtl ? ('IQD ' + data.order.total.toLocaleString()) : (data.order.total.toLocaleString() + ' IQD'), endX, y);
    y += 32;

    ctx.font = 'bold 15px ' + fontPrimary;
    ctx.textAlign = alignStart;
    ctx.fillText(tr.payment, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(data.order.paymentMethod ? data.order.paymentMethod.toUpperCase() : 'CASH', endX, y);
    y += 26;

    drawDash(y);
    y += 18;

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px ' + fontPrimary;
    ctx.fillText(data.footerText || tr.thanks, width / 2, y);
    y += 26;

    ctx.font = '900 18px ' + fontPrimary;
    ctx.fillText('***', width / 2, y);
    y += 26;

    ctx.font = 'bold 12px ' + fontPrimary;
    ctx.fillText('POWERED BY MAS MENU', width / 2, y);
    y += 30;

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = width;
    trimmedCanvas.height = y;
    const trimCtx = trimmedCanvas.getContext('2d');
    if (trimCtx) {
      trimCtx.drawImage(canvas, 0, 0, width, y, 0, 0, width, y);
      return trimmedCanvas;
    }

    return canvas;
  }
}