import { FormattedReceiptData } from "./receiptFormatter";

export interface RasterReceiptResult {
  rasterData: string; // base64 encoded 1-bit raster buffer
  width: number;
  height: number;
  bytesWidth: number;
}

export class ReceiptImageRenderer {
  public static async renderToRaster(
    data: FormattedReceiptData,
    paperWidth: "80mm" | "58mm" = "80mm",
    logoUrl?: string
  ): Promise<RasterReceiptResult> {
    const is58mm = paperWidth === "58mm";
    const width = is58mm ? 384 : 576; // 80mm thermal standard is 576 dots
    const bytesWidth = Math.ceil(width / 8);
    const lang = data.receiptLanguage || "en";
    const isRtl = lang === "ku" || lang === "ar";
    const curr = data.currencySymbol || "IQD";

    const labels = {
      en: {
        orderNo: "Order #:",
        date: "Date:",
        table: "Table:",
        type: "Type:",
        pay: "Pay:",
        item: "ITEM",
        qty: "QTY",
        price: "PRICE",
        subtotal: "Subtotal:",
        discount: "Discount:",
        service: "Service:",
        total: "TOTAL DUE:",
        thanks: "Thank you for your visit!",
        dineIn: "DINE-IN",
        takeaway: "TAKEAWAY",
        delivery: "DELIVERY",
        cash: "CASH",
        card: "CARD",
      },
      ku: {
        orderNo: "ŽãÇÑ?í Óææá?:",
        date: "È?ÑæÇÑ:",
        table: "ã?Ò:",
        type: "Ì?Ñ:",
        pay: "Ô?æÇÒí ÇÑ?ÏÇä:",
        item: "ÈÇÈ?Ê",
        qty: "ÏÇä?",
        price: "äÑÎ",
        subtotal: "˜?í ÔÊí:",
        discount: "ÏÇÔ˜ÇäÏä:",
        service: "ÎÒã?ÊæÒÇÑí:",
        total: "˜?í ˜?ÊÇíí:",
        thanks: "Ó?ÑÏÇä?˜?Ê Ì??í Ï?Î?ÔíãÇä?",
        dineIn: "å??",
        takeaway: "Ó?Ý?Ñí",
        delivery: "?íÇäÏä",
        cash: "˜ÇÔ",
        card: "˜ÇÑÊ",
      },
      ar: {
        orderNo: "ÑÞã ÇáØáÈ:",
        date: "ÇáÊÇÑíÎ:",
        table: "ÇáØÇæáÉ:",
        type: "ÇáäæÚ:",
        pay: "ØÑíÞÉ ÇáÏÝÚ:",
        item: "ÇáÕäÝ",
        qty: "ÇáßãíÉ",
        price: "ÇáÓÚÑ",
        subtotal: "ÇáãÌãæÚ:",
        discount: "ÇáÎÕã:",
        service: "ÇáÎÏãÉ:",
        total: "ÇáÅÌãÇáí Çáßáí:",
        thanks: "ÔßÑÇð áÒíÇÑÊßã",
        dineIn: "ÕÇáÉ",
        takeaway: "ÓÝÑí",
        delivery: "ÊæÕíá",
        cash: "äÞÏí",
        card: "ÈØÇÞÉ",
      },
    }[lang] || {
      orderNo: "Order #:",
      date: "Date:",
      table: "Table:",
      type: "Type:",
      pay: "Pay:",
      item: "ITEM",
      qty: "QTY",
      price: "PRICE",
      subtotal: "Subtotal:",
      discount: "Discount:",
      service: "Service:",
      total: "TOTAL DUE:",
      thanks: "Thank you for your visit!",
      dineIn: "DINE-IN",
      takeaway: "TAKEAWAY",
      delivery: "DELIVERY",
      cash: "CASH",
      card: "CARD",
    };

    // Calculate dynamic canvas height
    let estimatedHeight = 240;
    if (logoUrl) estimatedHeight += 90;
    if (data.headerText) estimatedHeight += 30;
    if (data.address) estimatedHeight += 25;
    if (data.phone) estimatedHeight += 25;

    data.order.items.forEach((item) => {
      estimatedHeight += 42;
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        estimatedHeight += item.selectedAddons.length * 24;
      }
      if (item.notes) estimatedHeight += 24;
    });

    estimatedHeight += 180; // totals and footer

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("Canvas 2D context not available");
    }

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";
    ctx.direction = isRtl ? "rtl" : "ltr";

    let y = 15;

    // Optional Logo
    if (logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = logoUrl;
        });

        if (img.width && img.height) {
          const maxLogoW = is58mm ? 120 : 160;
          const maxLogoH = 80;
          const scale = Math.min(maxLogoW / img.width, maxLogoH / img.height, 1);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (width - drawW) / 2;
          ctx.drawImage(img, drawX, y, drawW, drawH);
          y += drawH + 12;
        }
      } catch (err) {
        console.warn("[ReceiptImageRenderer] Logo load failed:", err);
      }
    }

    // Cafe Name (Big & Bold)
    ctx.font = "900 28px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.cafeName || "MAS CAFE", width / 2, y);
    y += 34;

    // Sub-headers
    ctx.font = "500 15px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    if (data.headerText) {
      ctx.fillText(data.headerText, width / 2, y);
      y += 22;
    }
    if (data.address) {
      ctx.fillText(data.address, width / 2, y);
      y += 20;
    }
    if (data.phone) {
      ctx.fillText(`Tel: ${data.phone}`, width / 2, y);
      y += 20;
    }

    y += 8;

    // Double line divider
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.moveTo(10, y + 4);
    ctx.lineTo(width - 10, y + 4);
    ctx.stroke();
    y += 14;

    // Order Meta Box
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    const margin = 12;
    const textStart = isRtl ? width - margin : margin;
    const textEnd = isRtl ? margin : width - margin;
    const alignStart = isRtl ? "right" : "left";
    const alignEnd = isRtl ? "left" : "right";

    const drawMetaRow = (label: string, value: string) => {
      ctx.textAlign = alignStart;
      ctx.font = "500 14px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
      ctx.fillText(label, textStart, y);
      ctx.textAlign = alignEnd;
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
      ctx.fillText(value, textEnd, y);
      y += 22;
    };

    drawMetaRow(labels.orderNo, data.order.invoiceCode || `#${data.order.id.slice(0, 8)}`);
    drawMetaRow(labels.date, new Date(data.order.createdAt).toLocaleString(isRtl ? "ar-IQ" : "en-US"));
    if (data.order.tableId || data.tableName) {
      drawMetaRow(labels.table, data.tableName || data.order.tableId);
    }
    const orderTypeLabel = data.order.type === "dine_in" ? labels.dineIn : data.order.type === "takeaway" ? labels.takeaway : labels.delivery;
    const payLabel = data.order.paymentMethod === "card" ? labels.card : labels.cash;
    drawMetaRow(labels.type, `${orderTypeLabel} | ${payLabel}`);

    y += 4;

    // Single divider
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
    y += 10;

    // Items Table Header
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    ctx.textAlign = alignStart;
    ctx.fillText(labels.item, textStart, y);

    const qtyX = width * 0.65;
    ctx.textAlign = "center";
    ctx.fillText(labels.qty, qtyX, y);

    ctx.textAlign = alignEnd;
    ctx.fillText(labels.price, textEnd, y);
    y += 22;

    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 8;

    // Items list
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      let name = "Item";
      if (menuItem) {
        if (lang === "ku" && menuItem.nameKu) name = menuItem.nameKu;
        else if (lang === "ar" && menuItem.nameAr) name = menuItem.nameAr;
        else name = menuItem.nameEn || menuItem.nameKu || menuItem.nameAr || "Item";
      }
      if (item.variantName) {
        name += ` (${item.variantName})`;
      }

      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
      ctx.textAlign = alignStart;
      ctx.fillText(name, textStart, y);

      ctx.textAlign = "center";
      ctx.fillText(`${item.quantity}`, qtyX, y);

      ctx.textAlign = alignEnd;
      ctx.fillText(`${(item.price * item.quantity).toLocaleString()}`, textEnd, y);
      y += 22;

      // Addons with individual prices
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          let addonName = addon.nameEn || "Addon";
          if (lang === "ku" && addon.nameKu) addonName = addon.nameKu;
          else if (lang === "ar" && addon.nameAr) addonName = addon.nameAr;

          const priceStr = addon.price > 0 ? ` (+${addon.price.toLocaleString()} ${curr})` : "";
          ctx.font = "normal 13px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
          ctx.textAlign = alignStart;
          ctx.fillText(`  ? + ${addonName}${priceStr}`, textStart, y);
          y += 20;
        });
      }

      if (item.notes) {
        ctx.font = "italic 13px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
        ctx.textAlign = alignStart;
        ctx.fillText(`  * Note: ${item.notes}`, textStart, y);
        y += 20;
      }
    });

    y += 4;
    // Divider
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
    y += 10;

    // Subtotal & Discount
    const drawTotalRow = (label: string, value: string, isBold = false) => {
      ctx.textAlign = alignStart;
      ctx.font = isBold ? "bold 16px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif" : "500 15px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
      ctx.fillText(label, textStart, y);
      ctx.textAlign = alignEnd;
      ctx.fillText(value, textEnd, y);
      y += 24;
    };

    drawTotalRow(labels.subtotal, `${data.order.subtotal.toLocaleString()} ${curr}`);
    if (data.order.discount > 0) {
      drawTotalRow(labels.discount, `-${data.order.discount.toLocaleString()} ${curr}`);
    }
    if (data.order.serviceCharge && data.order.serviceCharge > 0) {
      drawTotalRow(labels.service, `+${data.order.serviceCharge.toLocaleString()} ${curr}`);
    }

    y += 6;

    // Grand Total Box (High Contrast)
    const boxHeight = 42;
    ctx.fillStyle = "#000000";
    ctx.fillRect(10, y, width - 20, boxHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    ctx.textAlign = alignStart;
    ctx.fillText(labels.total, isRtl ? width - 22 : 22, y + 10);

    ctx.textAlign = alignEnd;
    ctx.fillText(`${data.order.total.toLocaleString()} ${curr}`, isRtl ? 22 : width - 22, y + 10);

    ctx.fillStyle = "#000000";
    y += boxHeight + 16;

    // Footer
    ctx.textAlign = "center";
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    if (data.footerText) {
      ctx.fillText(data.footerText, width / 2, y);
    } else {
      ctx.fillText(labels.thanks, width / 2, y);
    }
    y += 24;

    ctx.font = "normal 14px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    ctx.fillText("? ? ? ? ?", width / 2, y);
    y += 24;

    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
    ctx.fillText("POWERED BY MAS POS", width / 2, y);
    y += 28;

    const finalHeight = y;

    // Crop to actual content height
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) throw new Error("Could not create final canvas context");
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

        // Luminance threshold: 0-255 (< 160 is black)
        const isBlack = a > 50 && (r * 0.299 + g * 0.587 + b * 0.114) < 160;
        if (isBlack) {
          const byteIdx = row * bytesWidth + Math.floor(col / 8);
          const bitIdx = 7 - (col % 8);
          rasterBuffer[byteIdx] |= (1 << bitIdx);
        }
      }
    }

    // Convert Uint8Array to base64
    let binary = "";
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

