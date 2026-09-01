import { FormattedReceiptData } from "./receiptFormatter";

export interface RasterReceiptResult {
  rasterData: string;
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
    const width = is58mm ? 384 : 576; // standard thermal print width
    const bytesWidth = Math.ceil(width / 8);
    const lang = data.receiptLanguage || "en";
    const isRtl = lang === "ku" || lang === "ar";
    const curr = data.currencySymbol || "IQD";

    const tr = {
      en: {
        date: "Date:",
        orderNo: "Order No:",
        type: "Type:",
        table: "Table:",
        item: "Item",
        qty: "Qty",
        price: "Price",
        subtotal: "Subtotal:",
        discount: "Discount:",
        service: "Service:",
        total: "TOTAL:",
        payment: "Payment:",
        thanks: "Thank you for your visit!",
        dineIn: "DINE IN",
        takeaway: "TAKEAWAY",
        delivery: "DELIVERY",
        cash: "CASH",
        card: "CARD",
      },
      ku: {
        date: "È?ÑæÇÑ:",
        orderNo: "ŽãÇÑ?í Óææá?:",
        type: "Ì?Ñ:",
        table: "ã?Ò:",
        item: "ÈÇÈ?Ê",
        qty: "ÏÇä?",
        price: "äÑÎ",
        subtotal: "˜?í ÔÊí:",
        discount: "ÏÇÔ˜ÇäÏä:",
        service: "ÎÒã?ÊæÒÇÑí:",
        total: "˜?í ˜?ÊÇíí:",
        payment: "Ô?æÇÒí ÇÑ?ÏÇä:",
        thanks: "Ó?ÑÏÇä?˜?Ê Ì??í Ï?Î?ÔíãÇä?",
        dineIn: "DINE IN",
        takeaway: "TAKEAWAY",
        delivery: "DELIVERY",
        cash: "CASH",
        card: "CARD",
      },
      ar: {
        date: "ÇáÊÇÑíÎ:",
        orderNo: "ÑÞã ÇáØáÈ:",
        type: "ÇáäæÚ:",
        table: "ÇáØÇæáÉ:",
        item: "ÇáÕäÝ",
        qty: "ÇáßãíÉ",
        price: "ÇáÓÚÑ",
        subtotal: "ÇáãÌãæÚ ÇáÅÌãÇáí:",
        discount: "ÇáÎÕã:",
        service: "ÇáÎÏãÉ:",
        total: "ÇáÅÌãÇáí:",
        payment: "ØÑíÞÉ ÇáÏÝÚ:",
        thanks: "ÔßÑÇð áÒíÇÑÊßã",
        dineIn: "DINE IN",
        takeaway: "TAKEAWAY",
        delivery: "DELIVERY",
        cash: "CASH",
        card: "CARD",
      },
    }[lang] || {
      date: "Date:",
      orderNo: "Order No:",
      type: "Type:",
      table: "Table:",
      item: "Item",
      qty: "Qty",
      price: "Price",
      subtotal: "Subtotal:",
      discount: "Discount:",
      service: "Service:",
      total: "TOTAL:",
      payment: "Payment:",
      thanks: "Thank you for your visit!",
      dineIn: "DINE IN",
      takeaway: "TAKEAWAY",
      delivery: "DELIVERY",
      cash: "CASH",
      card: "CARD",
    };

    // Calculate canvas height
    let estimatedHeight = 300;
    if (logoUrl) estimatedHeight += 100;
    if (data.headerText) estimatedHeight += 24;
    if (data.address) estimatedHeight += 24;
    if (data.phone) estimatedHeight += 24;

    data.order.items.forEach((item) => {
      estimatedHeight += 38;
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        estimatedHeight += item.selectedAddons.length * 22;
      }
      if (item.notes) estimatedHeight += 22;
    });

    estimatedHeight += 220;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = estimatedHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) throw new Error("Canvas context creation failed");

    // Pure white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, estimatedHeight);
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";
    ctx.direction = isRtl ? "rtl" : "ltr";

    let y = 20;

    // 1. Centered Circular Logo
    const logoSize = 76;
    const logoCenterX = width / 2;
    const logoCenterY = y + logoSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCenterX, logoCenterY, logoSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();

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
          ctx.drawImage(img, logoCenterX - logoSize / 2, y, logoSize, logoSize);
        }
      } catch (err) {
        console.warn("[ReceiptImageRenderer] Logo render error:", err);
      }
    }
    ctx.restore();
    y += logoSize + 18;

    // 2. Cafe Name (Centered Spaced Bold Monospace)
    ctx.font = "900 24px Courier New, monospace, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((data.cafeName || "LAMOGE CAFE").toUpperCase(), width / 2, y);
    y += 32;

    // Subtitles
    ctx.font = "normal 14px Courier New, monospace, sans-serif";
    ctx.fillText(data.headerText || `Welcome to ${data.cafeName || "Lamoge Cafe"}`, width / 2, y);
    y += 22;

    if (data.address) {
      ctx.fillText(data.address, width / 2, y);
      y += 20;
    }
    ctx.fillText(data.phone ? `Tel: ${data.phone}` : "Tel:", width / 2, y);
    y += 26;

    // Dashed divider helper
    const drawDashedDivider = (currentY: number) => {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(14, currentY);
      ctx.lineTo(width - 14, currentY);
      ctx.stroke();
      ctx.restore();
    };

    const drawSolidDivider = (currentY: number) => {
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#888888";
      ctx.beginPath();
      ctx.moveTo(14, currentY);
      ctx.lineTo(width - 14, currentY);
      ctx.stroke();
      ctx.restore();
    };

    drawDashedDivider(y);
    y += 14;

    const padLeft = 14;
    const padRight = width - 14;
    const startX = isRtl ? padRight : padLeft;
    const endX = isRtl ? padLeft : padRight;
    const alignStart = isRtl ? "right" : "left";
    const alignEnd = isRtl ? "left" : "right";

    // 3. Order Meta Info
    const dateObj = new Date(data.order.createdAt);
    const dateStr = isRtl
      ? `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : dateObj.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });

    const drawMetaLine = (lbl: string, val: string, isValBold = false) => {
      ctx.font = "normal 15px Courier New, monospace, sans-serif";
      ctx.textAlign = alignStart;
      ctx.fillText(lbl, startX, y);

      ctx.font = isValBold ? "bold 15px Courier New, monospace, sans-serif" : "normal 15px Courier New, monospace, sans-serif";
      ctx.textAlign = alignEnd;
      ctx.fillText(val, endX, y);
      y += 24;
    };

    drawMetaLine(tr.date, dateStr);
    drawMetaLine(tr.orderNo, data.order.invoiceCode || `INV-${data.order.id.slice(0, 8).toUpperCase()}`, true);
    drawMetaLine(tr.type, data.order.type === "dine_in" ? tr.dineIn : tr.takeaway);
    if (data.order.tableId || data.tableName) {
      drawMetaLine(tr.table, data.tableName || `Table ${data.order.tableId}`);
    }

    y += 4;
    drawDashedDivider(y);
    y += 14;

    // 4. Items Table
    ctx.font = "bold 15px Courier New, monospace, sans-serif";
    ctx.textAlign = alignStart;
    ctx.fillText(tr.item, startX, y);

    const qtyPosX = width * 0.62;
    ctx.textAlign = "center";
    ctx.fillText(tr.qty, qtyPosX, y);

    ctx.textAlign = alignEnd;
    ctx.fillText(tr.price, endX, y);
    y += 26;

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

      ctx.font = "bold 15px Courier New, monospace, sans-serif";
      ctx.textAlign = alignStart;
      ctx.fillText(name, startX, y);

      ctx.font = "normal 15px Courier New, monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${item.quantity}`, qtyPosX, y);

      ctx.textAlign = alignEnd;
      ctx.fillText(`${(item.price * item.quantity).toLocaleString()}`, endX, y);
      y += 24;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          let addonName = addon.nameEn || "Addon";
          if (lang === "ku" && addon.nameKu) addonName = addon.nameKu;
          else if (lang === "ar" && addon.nameAr) addonName = addon.nameAr;

          const priceStr = addon.price > 0 ? ` (+${addon.price.toLocaleString()})` : "";
          ctx.font = "normal 13px Courier New, monospace, sans-serif";
          ctx.textAlign = alignStart;
          ctx.fillText(`  ? + ${addonName}${priceStr}`, startX, y);
          y += 20;
        });
      }

      if (item.notes) {
        ctx.font = "italic 13px Courier New, monospace, sans-serif";
        ctx.textAlign = alignStart;
        ctx.fillText(`  * Note: ${item.notes}`, startX, y);
        y += 20;
      }
    });

    y += 4;
    drawDashedDivider(y);
    y += 14;

    // 5. Totals
    const drawTotalRow = (lbl: string, val: string) => {
      ctx.font = "normal 15px Courier New, monospace, sans-serif";
      ctx.textAlign = alignStart;
      ctx.fillText(lbl, startX, y);
      ctx.textAlign = alignEnd;
      ctx.fillText(val, endX, y);
      y += 24;
    };

    drawTotalRow(tr.subtotal, `${data.order.subtotal.toLocaleString()}`);
    if (data.order.discount > 0) {
      drawTotalRow(tr.discount, `-${data.order.discount.toLocaleString()}`);
    }
    if (data.order.serviceCharge && data.order.serviceCharge > 0) {
      drawTotalRow(tr.service, `+${data.order.serviceCharge.toLocaleString()}`);
    }

    y += 4;
    drawSolidDivider(y);
    y += 12;

    // Grand Total (Big Bold)
    ctx.font = "900 19px Courier New, monospace, sans-serif";
    ctx.textAlign = alignStart;
    ctx.fillText(tr.total, startX, y);

    ctx.textAlign = alignEnd;
    const totalDisplay = isRtl ? `IQD ${data.order.total.toLocaleString()}` : `${data.order.total.toLocaleString()} IQD`;
    ctx.fillText(totalDisplay, endX, y);
    y += 28;

    // Payment
    ctx.font = "normal 14px Courier New, monospace, sans-serif";
    ctx.textAlign = alignStart;
    ctx.fillText(tr.payment, startX, y);
    ctx.textAlign = alignEnd;
    ctx.fillText(data.order.paymentMethod ? data.order.paymentMethod.toUpperCase() : "CASH", endX, y);
    y += 24;

    y += 6;
    drawDashedDivider(y);
    y += 16;

    // 6. Footer
    ctx.textAlign = "center";
    ctx.font = "normal 14px Courier New, monospace, sans-serif";
    ctx.fillText(data.footerText || tr.thanks, width / 2, y);
    y += 24;

    ctx.font = "normal 14px Courier New, monospace, sans-serif";
    ctx.fillText("***", width / 2, y);
    y += 26;

    ctx.font = "normal 11px Courier New, monospace, sans-serif";
    ctx.fillStyle = "#555555";
    ctx.fillText("POWERED BY MAS MENU", width / 2, y);
    y += 30;

    const finalHeight = y;

    // Crop to final height
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = finalHeight;
    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) throw new Error("Final canvas context failed");
    finalCtx.drawImage(canvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight);

    const imgData = finalCtx.getImageData(0, 0, width, finalHeight);
    const pixels = imgData.data;

    // Convert to 1-bit monochrome raster
    const rasterBuffer = new Uint8Array(bytesWidth * finalHeight);
    for (let row = 0; row < finalHeight; row++) {
      for (let col = 0; col < width; col++) {
        const pIdx = (row * width + col) * 4;
        const r = pixels[pIdx];
        const g = pixels[pIdx + 1];
        const b = pixels[pIdx + 2];
        const a = pixels[pIdx + 3];

        const isBlack = a > 50 && (r * 0.299 + g * 0.587 + b * 0.114) < 170;
        if (isBlack) {
          const byteIdx = row * bytesWidth + Math.floor(col / 8);
          const bitIdx = 7 - (col % 8);
          rasterBuffer[byteIdx] |= (1 << bitIdx);
        }
      }
    }

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

