/**
 * Receipt Formatter Service
 * Converts Order and Cafe data into formatted payloads for:
 * 1. Epson ePOS-Print XML (Direct HTTP Port 80/8008)
 * 2. Star Micronics WebPRNT XML
 * 3. Raw ESC/POS Byte Arrays & ASCII Text (for local Socket Bridge / Port 9100)
 */
import { Order, MenuItem } from '../types';

export interface FormattedReceiptData {
  order: Order;
  cafeName: string;
  address?: string;
  phone?: string;
  headerText?: string;
  footerText?: string;
  menuItems: MenuItem[];
  currencySymbol?: string;
  cashierName?: string;
  tableName?: string;
  receiptLanguage?: 'en' | 'ku' | 'ar';
  logo?: string;
}

export class ReceiptFormatter {
  private static getLabels(lang: 'en' | 'ku' | 'ar' = 'en') {
    const dict = {
      en: {
        orderNo: 'Order #:',
        date: 'Date:   ',
        table: 'Table:  ',
        type: 'Type:   ',
        pay: 'Pay: ',
        item: 'ITEM',
        qty: 'QTY',
        price: 'PRICE',
        subtotal: 'Subtotal:',
        discount: 'Discount:',
        service: 'Service:',
        total: 'TOTAL DUE:',
        thanks: 'Thank you for your visit!',
        dineIn: 'DINE-IN',
        takeaway: 'TAKEAWAY',
        delivery: 'DELIVERY',
        cash: 'CASH',
        card: 'CARD',
      },
      ku: {
        orderNo: 'ژ. پسوولە:',
        date: 'بەروار:   ',
        table: 'مێز:     ',
        type: 'جۆر:     ',
        pay: 'پارەدان: ',
        item: 'بابەت',
        qty: 'دانە',
        price: 'نرخ',
        subtotal: 'کۆی گشتی:',
        discount: 'داشکاندن:',
        service: 'خزمەتگوزاری:',
        total: 'کۆی کۆتایی:',
        thanks: 'سەردانەکەت جێگەی دڵخۆشیمانە',
        dineIn: 'هۆڵ',
        takeaway: 'سەفەری',
        delivery: 'گەیاندن',
        cash: 'کاش',
        card: 'کارت',
      },
      ar: {
        orderNo: 'رقم الطلب:',
        date: 'التاريخ:  ',
        table: 'الطاولة:  ',
        type: 'النوع:    ',
        pay: 'الدفع: ',
        item: 'الصنف',
        qty: 'الكمية',
        price: 'السعر',
        subtotal: 'المجموع:',
        discount: 'الخصم:',
        service: 'الخدمة:',
        total: 'الإجمالي الكلي:',
        thanks: 'شكراً لزيارتكم',
        dineIn: 'صالة',
        takeaway: 'سفري',
        delivery: 'توصيل',
        cash: 'نقدي',
        card: 'بطاقة',
      },
    };

    return dict[lang] || dict.en;
  }

  private static getItemName(item: any, menuItem: MenuItem | undefined, lang: 'en' | 'ku' | 'ar') {
    let name = 'Item';
    if (menuItem) {
      if (lang === 'ku' && menuItem.nameKu) name = menuItem.nameKu;
      else if (lang === 'ar' && menuItem.nameAr) name = menuItem.nameAr;
      else name = menuItem.nameEn || menuItem.nameKu || menuItem.nameAr || 'Item';
    }
    return name + (item.variantName ? ` (${item.variantName})` : '');
  }

  private static getAddonName(addon: any, lang: 'en' | 'ku' | 'ar') {
    if (lang === 'ku' && addon.nameKu) return addon.nameKu;
    if (lang === 'ar' && addon.nameAr) return addon.nameAr;
    return addon.nameEn || addon.nameKu || addon.nameAr || 'Addon';
  }

  /**
   * Builds standard Epson ePOS-Print XML payload for direct HTTP POST (Epson TM-T88VI, TM-m30, TM-T20, etc.)
   */
  public static buildEposXml(
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm' = '80mm',
    options?: { autoCut?: boolean; openCashDrawer?: boolean }
  ): string {
    const lang = data.receiptLanguage || 'en';
    const labels = this.getLabels(lang);
    const charsPerLine = paperWidth === '80mm' ? 42 : 32;
    const divider = '-'.repeat(charsPerLine);
    const dateStr = new Date(data.order.createdAt).toLocaleString(lang === 'ar' ? 'ar-IQ' : lang === 'ku' ? 'ku-IQ' : 'en-US');
    const curr = data.currencySymbol || 'IQD';

    let itemsXml = '';
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = this.getItemName(item, menuItem, lang);
      const priceStr = `${(item.price * item.quantity).toLocaleString()} ${curr}`;
      const qtyPrefix = `${item.quantity}x `;

      const availableWidth = Math.max(10, charsPerLine - priceStr.length);
      const truncatedName = (qtyPrefix + name).padEnd(availableWidth).slice(0, availableWidth);
      const line = `${truncatedName}${priceStr}`;

      itemsXml += `      <text>${this.escapeXml(line)}&#10;</text>\n`;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          const addonName = this.getAddonName(addon, lang);
          const addonPriceStr = addon.price > 0 ? ` (+${addon.price.toLocaleString()} ${curr})` : '';
          itemsXml += `      <text>  + ${this.escapeXml(addonName + addonPriceStr)}&#10;</text>\n`;
        });
      }
      if (item.notes) {
        itemsXml += `      <text>  * Note: ${this.escapeXml(item.notes)}&#10;</text>\n`;
      }
    });

    const formatRow = (label: string, value: string) => {
      const available = Math.max(5, charsPerLine - value.length);
      return label.padEnd(available).slice(0, available) + value;
    };

    const subtotalLine = formatRow(labels.subtotal, `${data.order.subtotal.toLocaleString()} ${curr}`);
    const totalLine = formatRow(labels.total, `${data.order.total.toLocaleString()} ${curr}`);

    const autoCutXml = options?.autoCut !== false ? `<feed line="3"/><cut type="feed"/>` : `<feed line="3"/>`;
    const pulseXml = options?.openCashDrawer ? `<pulse drawer="drawer_1" time="pulse_100"/>` : '';

    const orderTypeLabel = data.order.type === 'dine_in' ? labels.dineIn : data.order.type === 'takeaway' ? labels.takeaway : labels.delivery;
    const paymentLabel = data.order.paymentMethod === 'card' ? labels.card : labels.cash;

    return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      ${pulseXml}
      <text align="center" width="2" height="2" smooth="true">${this.escapeXml(data.cafeName)}&#10;</text>
      ${data.address ? `<text align="center">${this.escapeXml(data.address)}&#10;</text>` : ''}
      ${data.phone ? `<text align="center">Tel: ${this.escapeXml(data.phone)}&#10;</text>` : ''}
      ${data.headerText ? `<text align="center">${this.escapeXml(data.headerText)}&#10;</text>` : ''}
      <text align="center">${divider}&#10;</text>
      <text align="left">${labels.orderNo} ${this.escapeXml(data.order.invoiceCode || data.order.id)}&#10;</text>
      <text align="left">${labels.date} ${this.escapeXml(dateStr)}&#10;</text>
      ${data.order.tableId || data.tableName ? `<text align="left" width="1" height="2" em="true">${labels.table} ${this.escapeXml(data.tableName || data.order.tableId || '')}&#10;</text>` : ''}
      <text align="left">${labels.type} ${this.escapeXml(orderTypeLabel)} | ${labels.pay} ${this.escapeXml(paymentLabel)}&#10;</text>
      <text align="center">${divider}&#10;</text>
      <text align="left">&#10;</text>
${itemsXml}      <text align="center">${divider}&#10;</text>
      <text align="left">${this.escapeXml(subtotalLine)}&#10;</text>
      ${data.order.discount ? `<text align="left">${this.escapeXml(formatRow(labels.discount, `-${data.order.discount.toLocaleString()} ${curr}`))}&#10;</text>` : ''}
      ${data.order.serviceCharge ? `<text align="left">${this.escapeXml(formatRow(labels.service, `+${data.order.serviceCharge.toLocaleString()} ${curr}`))}&#10;</text>` : ''}
      <text align="left" width="1" height="2" em="true">${this.escapeXml(totalLine)}&#10;</text>
      <text align="center">${divider}&#10;</text>
      <text align="center">${this.escapeXml(data.footerText || labels.thanks)}&#10;</text>
      ${autoCutXml}
    </epos-print>
  </s:Body>
</s:Envelope>`;
  }

  /**
   * Builds Star Micronics WebPRNT XML
   */
  public static buildStarWebPrntXml(
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm' = '80mm',
    options?: { autoCut?: boolean }
  ): string {
    const lang = data.receiptLanguage || 'en';
    const labels = this.getLabels(lang);
    const charsPerLine = paperWidth === '80mm' ? 42 : 32;
    const divider = '-'.repeat(charsPerLine);
    const dateStr = new Date(data.order.createdAt).toLocaleString();
    const curr = data.currencySymbol || 'IQD';

    let itemsBody = '';
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = this.getItemName(item, menuItem, lang);
      const priceStr = `${(item.price * item.quantity).toLocaleString()} ${curr}`;
      const qtyPrefix = `${item.quantity}x `;
      const availableWidth = Math.max(10, charsPerLine - priceStr.length);
      const line = (qtyPrefix + name).padEnd(availableWidth).slice(0, availableWidth) + priceStr;
      itemsBody += `<text>${this.escapeXml(line)}\n</text>`;
    });

    return `<StarWebPRNT xmlns="http://www.star-m.jp/x-starwebprnt">
      <text alignment="center" width="2" height="2">${this.escapeXml(data.cafeName)}\n</text>
      ${data.address ? `<text alignment="center">${this.escapeXml(data.address)}\n</text>` : ''}
      ${data.phone ? `<text alignment="center">Tel: ${this.escapeXml(data.phone)}\n</text>` : ''}
      <text alignment="center">${divider}\n</text>
      <text alignment="left">${labels.orderNo} ${this.escapeXml(data.order.invoiceCode || data.order.id)}\n</text>
      <text alignment="left">${labels.date} ${this.escapeXml(dateStr)}\n</text>
      <text alignment="center">${divider}\n</text>
      ${itemsBody}
      <text alignment="center">${divider}\n</text>
      <text alignment="left" width="1" height="2" bold="true">${labels.total} ${data.order.total.toLocaleString()} ${curr}\n</text>
      <text alignment="center">${divider}\n</text>
      <text alignment="center">${this.escapeXml(data.footerText || labels.thanks)}\n</text>
      ${options?.autoCut !== false ? `<cut-paper type="partial"/>` : ''}
    </StarWebPRNT>`;
  }

  /**
   * Builds clean plain text / ESC/POS string formatted for bridge socket printing
   */
  public static buildPlainText(data: FormattedReceiptData, charsPerLine = 40): string {
    const lang = data.receiptLanguage || 'en';
    const labels = this.getLabels(lang);
    const divider = '-'.repeat(charsPerLine);
    const doubleDivider = '='.repeat(charsPerLine);
    const curr = data.currencySymbol || 'IQD';

    let text = '\n';
    text += `${this.centerText(data.cafeName?.toUpperCase() || 'MAS CAFE', charsPerLine)}\n`;
    if (data.headerText) text += `${this.centerText(data.headerText, charsPerLine)}\n`;
    if (data.address) text += `${this.centerText(data.address, charsPerLine)}\n`;
    if (data.phone) text += `${this.centerText(`Tel: ${data.phone}`, charsPerLine)}\n`;
    text += `${doubleDivider}\n`;

    // Order meta
    text += `${labels.orderNo} ${data.order.invoiceCode || data.order.id}\n`;
    text += `${labels.date} ${new Date(data.order.createdAt).toLocaleString()}\n`;
    if (data.order.tableId || data.tableName) {
      text += `${labels.table} ${data.tableName || data.order.tableId}\n`;
    }
    const orderTypeStr = data.order.type === 'dine_in' ? labels.dineIn : data.order.type === 'takeaway' ? labels.takeaway : labels.delivery;
    const paymentStr = data.order.paymentMethod === 'card' ? labels.card : labels.cash;
    text += `${labels.type} ${orderTypeStr} | ${labels.pay} ${paymentStr}\n`;
    text += `${divider}\n`;

    // Header
    const colItemWidth = charsPerLine - 14;
    text += labels.item.padEnd(colItemWidth) + labels.qty.padStart(4) + labels.price.padStart(10) + '\n';
    text += `${divider}\n`;

    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = this.getItemName(item, menuItem, lang);
      const priceStr = `${(item.price * item.quantity).toLocaleString()}`;
      const qtyStr = `${item.quantity}`;

      const truncatedName = name.slice(0, colItemWidth - 1).padEnd(colItemWidth);
      text += truncatedName + qtyStr.padStart(4) + priceStr.padStart(10) + '\n';

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach((addon) => {
          const addonName = this.getAddonName(addon, lang);
          const addonPriceStr = addon.price > 0 ? ` (+${addon.price.toLocaleString()} ${curr})` : '';
          text += `  + ${addonName}${addonPriceStr}\n`;
        });
      }
      if (item.notes) {
        text += `  * Note: ${item.notes.slice(0, charsPerLine - 10)}\n`;
      }
    });

    text += `${divider}\n`;
    text += `${labels.subtotal}`.padEnd(charsPerLine - `${data.order.subtotal.toLocaleString()} ${curr}`.length) + `${data.order.subtotal.toLocaleString()} ${curr}\n`;
    if (data.order.discount) {
      text += `${labels.discount}`.padEnd(charsPerLine - `-${data.order.discount.toLocaleString()} ${curr}`.length) + `-${data.order.discount.toLocaleString()} ${curr}\n`;
    }
    if (data.order.serviceCharge) {
      text += `${labels.service}`.padEnd(charsPerLine - `+${data.order.serviceCharge.toLocaleString()} ${curr}`.length) + `+${data.order.serviceCharge.toLocaleString()} ${curr}\n`;
    }

    // Total Box
    text += `${doubleDivider}\n`;
    text += `${labels.total}`.padEnd(charsPerLine - `${data.order.total.toLocaleString()} ${curr}`.length) + `${data.order.total.toLocaleString()} ${curr}\n`;
    text += `${doubleDivider}\n`;

    // Footer
    if (data.footerText) {
      const cleanFooter = data.footerText.replace(/^[!؟?\s]+|[!؟?\s]+$/g, '');
      text += `${this.centerText(cleanFooter, charsPerLine)}\n`;
    } else {
      text += `${this.centerText(labels.thanks, charsPerLine)}\n`;
    }
    text += `${this.centerText('* * * * *', charsPerLine)}\n`;
    text += `${this.centerText('POWERED BY MAS POS', charsPerLine)}\n\n\n\n`;

    return text;
  }

  private static centerText(text: string, width: number): string {
    if (text.length >= width) return text.slice(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}

