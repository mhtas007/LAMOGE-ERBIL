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
}

export class ReceiptFormatter {
  /**
   * Builds standard Epson ePOS-Print XML payload for direct HTTP POST (Epson TM-T88VI, TM-m30, TM-T20, etc.)
   */
  public static buildEposXml(
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm' = '80mm',
    options?: { autoCut?: boolean; openCashDrawer?: boolean }
  ): string {
    const charsPerLine = paperWidth === '80mm' ? 42 : 32;
    const divider = '-'.repeat(charsPerLine);
    const dateStr = new Date(data.order.createdAt).toLocaleString();
    const curr = data.currencySymbol || 'IQD';

    let itemsXml = '';
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = (menuItem?.nameEn || menuItem?.nameKu || menuItem?.nameAr || 'Item') + (item.variantName ? ` (${item.variantName})` : '');
      const priceStr = `${(item.price * item.quantity).toLocaleString()} ${curr}`;
      const qtyPrefix = `${item.quantity}x `;

      const availableWidth = Math.max(10, charsPerLine - priceStr.length);
      const truncatedName = (qtyPrefix + name).padEnd(availableWidth).slice(0, availableWidth);
      const line = `${truncatedName}${priceStr}`;

      itemsXml += `      <text>${this.escapeXml(line)}&#10;</text>\n`;

      if (item.selectedAddons && item.selectedAddons.length > 0) {
        const addonNames = item.selectedAddons.map(a => a.nameEn || a.nameKu || a.nameAr).join(', ');
        itemsXml += `      <text>  + ${this.escapeXml(addonNames)}&#10;</text>\n`;
      }
      if (item.notes) {
        itemsXml += `      <text>  * Note: ${this.escapeXml(item.notes)}&#10;</text>\n`;
      }
    });

    const formatRow = (label: string, value: string) => {
      const available = Math.max(5, charsPerLine - value.length);
      return label.padEnd(available).slice(0, available) + value;
    };

    const subtotalLine = formatRow('Subtotal:', `${data.order.subtotal.toLocaleString()} ${curr}`);
    const totalLine = formatRow('TOTAL:', `${data.order.total.toLocaleString()} ${curr}`);

    const autoCutXml = options?.autoCut !== false ? `<feed line="3"/><cut type="feed"/>` : `<feed line="3"/>`;
    const pulseXml = options?.openCashDrawer ? `<pulse drawer="drawer_1" time="pulse_100"/>` : '';

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
      <text align="left">Order #: ${this.escapeXml(data.order.invoiceCode || data.order.id)}&#10;</text>
      <text align="left">Date: ${this.escapeXml(dateStr)}&#10;</text>
      ${data.order.tableId || data.tableName ? `<text align="left" width="1" height="2" em="true">TABLE: ${this.escapeXml(data.tableName || data.order.tableId || '')}&#10;</text>` : ''}
      <text align="left">Type: ${this.escapeXml(data.order.type?.toUpperCase() || 'DINE-IN')} | Pay: ${this.escapeXml(data.order.paymentMethod?.toUpperCase() || 'CASH')}&#10;</text>
      <text align="center">${divider}&#10;</text>
      <text align="left">&#10;</text>
${itemsXml}      <text align="center">${divider}&#10;</text>
      <text align="left">${this.escapeXml(subtotalLine)}&#10;</text>
      ${data.order.discount ? `<text align="left">${this.escapeXml(formatRow('Discount:', `-${data.order.discount.toLocaleString()} ${curr}`))}&#10;</text>` : ''}
      ${data.order.serviceCharge ? `<text align="left">${this.escapeXml(formatRow('Service:', `+${data.order.serviceCharge.toLocaleString()} ${curr}`))}&#10;</text>` : ''}
      <text align="left" width="1" height="2" em="true">${this.escapeXml(totalLine)}&#10;</text>
      <text align="center">${divider}&#10;</text>
      <text align="center">${this.escapeXml(data.footerText || 'Thank you for your visit!')}&#10;</text>
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
    const charsPerLine = paperWidth === '80mm' ? 42 : 32;
    const divider = '-'.repeat(charsPerLine);
    const dateStr = new Date(data.order.createdAt).toLocaleString();
    const curr = data.currencySymbol || 'IQD';

    let itemsBody = '';
    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = (menuItem?.nameEn || menuItem?.nameKu || menuItem?.nameAr || 'Item') + (item.variantName ? ` (${item.variantName})` : '');
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
      <text alignment="left">Order #: ${this.escapeXml(data.order.invoiceCode || data.order.id)}\n</text>
      <text alignment="left">Date: ${this.escapeXml(dateStr)}\n</text>
      <text alignment="center">${divider}\n</text>
      ${itemsBody}
      <text alignment="center">${divider}\n</text>
      <text alignment="left" width="1" height="2" bold="true">TOTAL: ${data.order.total.toLocaleString()} ${curr}\n</text>
      <text alignment="center">${divider}\n</text>
      <text alignment="center">${this.escapeXml(data.footerText || 'Thank you for your visit!')}\n</text>
      ${options?.autoCut !== false ? `<cut-paper type="partial"/>` : ''}
    </StarWebPRNT>`;
  }

  /**
   * Builds clean plain text / ESC/POS string formatted for bridge socket printing
   */
  public static buildPlainText(data: FormattedReceiptData, charsPerLine = 40): string {
    const divider = '-'.repeat(charsPerLine);
    const curr = data.currencySymbol || 'IQD';
    let text = `\n${this.centerText(data.cafeName, charsPerLine)}\n`;
    if (data.address) text += `${this.centerText(data.address, charsPerLine)}\n`;
    if (data.phone) text += `${this.centerText(`Tel: ${data.phone}`, charsPerLine)}\n`;
    text += `${divider}\n`;
    text += `Order #: ${data.order.invoiceCode || data.order.id}\n`;
    text += `Date: ${new Date(data.order.createdAt).toLocaleString()}\n`;
    if (data.order.tableId || data.tableName) {
      text += `TABLE: ${data.tableName || data.order.tableId}\n`;
    }
    text += `Type: ${data.order.type?.toUpperCase() || 'DINE-IN'} | Pay: ${data.order.paymentMethod?.toUpperCase() || 'CASH'}\n`;
    text += `${divider}\n`;

    data.order.items.forEach((item) => {
      const menuItem = data.menuItems.find((m) => m.id === item.menuItemId);
      const name = (menuItem?.nameEn || menuItem?.nameKu || menuItem?.nameAr || 'Item') + (item.variantName ? ` (${item.variantName})` : '');
      const priceStr = `${(item.price * item.quantity).toLocaleString()} ${curr}`;
      const qtyStr = `${item.quantity}x `;
      const available = Math.max(10, charsPerLine - priceStr.length);
      text += (qtyStr + name).padEnd(available).slice(0, available) + priceStr + '\n';
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        const addonNames = item.selectedAddons.map(a => a.nameEn || a.nameKu || a.nameAr).join(', ');
        text += `  + ${addonNames}\n`;
      }
      if (item.notes) {
        text += `  * ${item.notes}\n`;
      }
    });

    text += `${divider}\n`;
    text += `Subtotal:`.padEnd(charsPerLine - `${data.order.subtotal.toLocaleString()} ${curr}`.length) + `${data.order.subtotal.toLocaleString()} ${curr}\n`;
    if (data.order.discount) {
      text += `Discount:`.padEnd(charsPerLine - `-${data.order.discount.toLocaleString()} ${curr}`.length) + `-${data.order.discount.toLocaleString()} ${curr}\n`;
    }
    if (data.order.serviceCharge) {
      text += `Service:`.padEnd(charsPerLine - `+${data.order.serviceCharge.toLocaleString()} ${curr}`.length) + `+${data.order.serviceCharge.toLocaleString()} ${curr}\n`;
    }
    text += `TOTAL:`.padEnd(charsPerLine - `${data.order.total.toLocaleString()} ${curr}`.length) + `${data.order.total.toLocaleString()} ${curr}\n`;
    text += `${divider}\n`;
    text += `${this.centerText(data.footerText || 'Thank you for your visit!', charsPerLine)}\n\n\n\n`;

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
