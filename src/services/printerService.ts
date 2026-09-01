/**
 * Network Printer Service
 * Sends formatted print payloads directly to local static IP network receipt printers silently
 * without triggering native iPad/iOS browser print dialogs.
 */
import { printerConfigService, PrinterConfig } from './printerConfigService';
import { ReceiptFormatter, FormattedReceiptData } from './receiptFormatter';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export interface PrintResult {
  success: boolean;
  message: string;
  printerIp: string;
  durationMs: number;
}

export class PrinterService {
  /**
   * Silently prints an order to the local network printer via IP address.
   * @throws Error with an informative, user-friendly message on connection failure or timeout.
   */
  public static async printReceipt(data: FormattedReceiptData, overrideConfig?: Partial<PrinterConfig>): Promise<PrintResult> {
    const startTime = Date.now();
    const config: PrinterConfig = {
      ...(await printerConfigService.getPrinterConfig()),
      ...overrideConfig,
    };

    if (!config.printerIp || config.printerIp.trim() === '') {
      throw new Error('Printer IP address is not configured. Please enter the printer Static IP in Settings.');
    }

    const targetIp = config.printerIp.trim();
    const port = config.port || (config.protocol === 'raw_escpos_bridge' ? 3001 : 80);
    const timeoutMs = config.timeoutMs || 5000;

    console.log(`[PrinterService] 🖨️ Initiating silent print to ${config.protocol.toUpperCase()} at http://${targetIp}:${port} (Timeout: ${timeoutMs}ms)`);

    // Create an AbortController for strict timeout control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      if (config.protocol === 'star_webprnt') {
        await this.sendToStarWebPrnt(targetIp, port, data, config.paperWidth, controller.signal);
      } else if (config.protocol === 'raw_escpos_bridge') {
        await this.sendToLocalProxy(targetIp, port, data, {
          autoCut: config.autoCut,
          openCashDrawer: config.openCashDrawer,
        }, controller.signal);
      } else {
        // Default: Direct Epson ePOS-Print XML (Port 80/8008)
        try {
          await this.sendToEpsonEpos(targetIp, port, data, config.paperWidth, {
            autoCut: config.autoCut,
            openCashDrawer: config.openCashDrawer,
          }, controller.signal);
        } catch (eposErr) {
          console.warn('[PrinterService] Epson ePOS HTTP failed, attempting direct TCP Bridge via /api/print:', eposErr);
          // Fallback to internal /api/print raw socket bridge
          await this.sendToLocalProxy(targetIp, 9100, data, {
            autoCut: config.autoCut,
            openCashDrawer: config.openCashDrawer,
          }, controller.signal);
        }
      }

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      console.log(`[PrinterService] ✅ Print job successfully delivered to ${targetIp} in ${durationMs}ms`);

      return {
        success: true,
        message: `Receipt printed successfully to ${targetIp}`,
        printerIp: targetIp,
        durationMs,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.warn(`[PrinterService] ⏱️ Print timeout (${timeoutMs}ms) to ${targetIp}`);
        throw new Error(
          `Printer connection timed out (${targetIp}:${port}). ` +
          `Please check: (1) Printer is turned ON and connected to Wi-Fi. ` +
          `(2) If using an Epson printer, verify ePOS is enabled on Port 80/8008. ` +
          `(3) If using a standard thermal printer on Port 9100, select 'ESC/POS Micro-Bridge' in Settings.`
        );
      }

      console.warn(`[PrinterService] ❌ Print failure to ${targetIp}:`, error);

      // Distinguish common LAN / CORS / iOS HTTPS Mixed Content errors
      if (
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('Load failed') ||
        error.message?.includes('mixed content')
      ) {
        throw new Error(
          `لەبەر پاراستنی ئەپڵ (iOS Safari Security / HTTPS)، ڕێگە بە چاپی ڕاستەوخۆی HTTP نادرێت. تکایە خانەی ئایپی بە بەتاڵی جێبهێڵە تاوەکو پەنجەرەی چاپی ئایپاد (AirPrint) بەکاربهێنیت بێ هەڵە.`
        );
      }

      throw new Error(error.message || `Failed to print to ${targetIp}. Please verify printer network settings.`);
    }
  }

  /**
   * Test printer connection by sending a mini test ticket
   */
  public static async testPrinter(overrideConfig?: Partial<PrinterConfig>): Promise<PrintResult> {
    const config = {
      ...(await printerConfigService.getPrinterConfig()),
      ...overrideConfig,
    };

    const mockData: FormattedReceiptData = {
      order: {
        id: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        type: 'dine_in',
        status: 'completed',
        discount: 0,
        items: [
          {
            menuItemId: 'test-item',
            quantity: 1,
            price: 5000,
          },
        ],
        subtotal: 5000,
        total: 5000,
        createdAt: new Date().toISOString(),
        paymentMethod: 'cash',
        invoiceCode: 'TEST-001',
      },
      cafeName: 'PRINTER TEST TICKET',
      address: 'Network Connection Verified',
      footerText: 'Silent Network Print OK!',
      menuItems: [
        {
          id: 'test-item',
          nameEn: 'Network Test Line Item',
          nameKu: 'تێستی پرینتەر',
          nameAr: 'اختبار الطابعة',
          categoryId: 'test',
          price: 5000,
          isAvailable: true,
        },
      ],
      currencySymbol: 'IQD',
    };

    return this.printReceipt(mockData, overrideConfig);
  }

  /**
   * Sends Epson ePOS XML to Epson Network Printer (Direct Port 80/8008)
   */
  private static async sendToEpsonEpos(
    ip: string,
    port: number,
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm',
    options: { autoCut?: boolean; openCashDrawer?: boolean },
    signal: AbortSignal
  ): Promise<void> {
    const xmlPayload = ReceiptFormatter.buildEposXml(data, paperWidth, options);
    const targetPort = port || 80;
    const endpoint = `http://${ip}:${targetPort}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=5000`;

    if (Capacitor.isNativePlatform()) {
      // Native iOS / Android HTTP (bypasses browser HTTPS/CORS restrictions completely!)
      const capResponse = await CapacitorHttp.post({
        url: endpoint,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
          SOAPAction: '""',
        },
        data: xmlPayload,
        connectTimeout: 4000,
        readTimeout: 4000,
      });

      if (capResponse.status !== 200) {
        throw new Error(`Epson ePOS printer error (Status: ${capResponse.status})`);
      }
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
        SOAPAction: '""',
      },
      body: xmlPayload,
      signal,
    });

    if (!response.ok && response.status !== 200) {
      throw new Error(`Epson ePOS printer error (HTTP status: ${response.status})`);
    }
  }

  /**
   * Sends Star WebPRNT XML to Star Network Printer
   */
  private static async sendToStarWebPrnt(
    ip: string,
    port: number,
    data: FormattedReceiptData,
    paperWidth: '80mm' | '58mm',
    signal: AbortSignal
  ): Promise<void> {
    const xmlPayload = ReceiptFormatter.buildStarWebPrntXml(data, paperWidth);
    const targetPort = port || 80;
    const endpoint = `http://${ip}:${targetPort}/StarWebPRNT/SendMessage`;

    if (Capacitor.isNativePlatform()) {
      const capResponse = await CapacitorHttp.post({
        url: endpoint,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        data: xmlPayload,
        connectTimeout: 4000,
        readTimeout: 4000,
      });

      if (capResponse.status !== 200) {
        throw new Error(`Star WebPRNT printer error (Status: ${capResponse.status})`);
      }
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
      body: xmlPayload,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Star WebPRNT printer error (HTTP status: ${response.status})`);
    }
  }

  /**
   * Sends payload to local raw TCP socket print bridge (Port 9100)
   */
  private static async sendToLocalProxy(
    ip: string,
    port: number,
    data: FormattedReceiptData,
    options: { autoCut?: boolean; openCashDrawer?: boolean },
    signal: AbortSignal
  ): Promise<void> {
    const plainText = ReceiptFormatter.buildPlainText(data);
    const endpoints = ['/api/print', `http://${window.location.hostname}:3001/api/print`];

    let lastError: any = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            plainText,
            printerIp: ip,
            autoCut: options.autoCut,
            openCashDrawer: options.openCashDrawer,
          }),
          signal,
        });

        if (response.ok) {
          return;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error(`Could not connect to print bridge on port 9100`);
  }
}
