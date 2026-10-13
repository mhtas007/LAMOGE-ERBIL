/**
 * Network Printer Service
 * Production-grade receipt printing architecture supporting:
 * 1. Apple AirPrint / Browser Print (100% Computer-Free direct from iPad Safari)
 * 2. Epson ePOS-Print (Direct HTTP/HTTPS ePOS XML with raster Kurdish/Arabic graphics)
 * 3. ESC/POS Micro-Bridge (LAN TCP socket to Port 9100 for raw thermal printers)
 * 4. Star Micronics WebPRNT
 *
 * Implements strict job lifecycle, duplicate prevention, and actionable error diagnostics.
 */
import { printerConfigService, PrinterConfig } from './printerConfigService';
import { ReceiptFormatter, FormattedReceiptData } from './receiptFormatter';
import { ReceiptImageRenderer } from './receiptImageRenderer';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export type PrintJobStatus = 'idle' | 'pending' | 'sending' | 'printed' | 'failed';

export interface PrintResult {
  success: boolean;
  message: string;
  printerIp: string;
  durationMs: number;
  jobId: string;
  protocol: string;
}

export class PrinterService {
  private static isJobLocked = false;
  private static activeJobId: string | null = null;
  private static lastJobTimestamp = 0;

  /**
   * Validates receipt payload before attempting any network communication
   */
  private static validateReceiptData(data: FormattedReceiptData): void {
    if (!data || !data.order) {
      throw new Error('Invalid receipt data: missing order information.');
    }
    if (!Array.isArray(data.order.items) || data.order.items.length === 0) {
      throw new Error('Cannot print receipt: order has no line items.');
    }
  }

  /**
   * Generates a unique, traceable print job identifier
   */
  private static generateJobId(data: FormattedReceiptData): string {
    const orderRef = data.order.invoiceCode || data.order.id.slice(0, 8);
    const nonce = Math.random().toString(36).substring(2, 7);
    return `JOB-${orderRef}-${Date.now().toString(36)}-${nonce}`.toUpperCase();
  }

  /**
   * Prints an order receipt using the configured protocol.
   * Enforces job locking to prevent double-printing from rapid button taps.
   */
  public static async printReceipt(
    data: FormattedReceiptData,
    overrideConfig?: Partial<PrinterConfig>
  ): Promise<PrintResult> {
    const startTime = Date.now();
    this.validateReceiptData(data);

    // Prevent concurrent print jobs (double-tap guard)
    const now = Date.now();
    if (this.isJobLocked && now - this.lastJobTimestamp < 4000) {
      throw new Error('A print job is already in progress. Please wait a moment.');
    }

    this.isJobLocked = true;
    this.lastJobTimestamp = now;
    const jobId = this.generateJobId(data);
    this.activeJobId = jobId;

    try {
      const config: PrinterConfig = {
        ...(await printerConfigService.getPrinterConfig()),
        ...overrideConfig,
      };

      const protocol = config.protocol || 'browser_airprint';

      // --- PROTOCOL 1: NATIVE BROWSER / APPLE AIRPRINT ---
      // Direct iPad printing without any PC or print bridge
      if (protocol === 'browser_airprint') {
        const result = await this.printViaAirPrint(jobId, startTime);
        return result;
      }

      // Check required IP address for network protocols
      const targetIp = (config.printerIp || '').trim();
      const bridgeUrl = (config.bridgeUrl || '').trim();

      if (protocol === 'raw_escpos_bridge') {
        if (!targetIp && !bridgeUrl) {
          throw new Error('Bridge URL or Printer IP is required for ESC/POS Bridge mode. Configure in Settings.');
        }
      } else if (!targetIp) {
        throw new Error('Printer IP address is not configured. Please enter the Static IP in Settings or select Apple AirPrint.');
      }

      const port = config.port || (protocol === 'raw_escpos_bridge' ? 3001 : 80);
      const timeoutMs = config.timeoutMs || 6000;

      // AbortController for strict timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (protocol === 'raw_escpos_bridge') {
          await this.sendToEscPosBridge(targetIp, port, bridgeUrl, data, config, controller.signal);
        } else if (protocol === 'star_webprnt') {
          await this.sendToStarWebPrnt(targetIp, port, data, config, controller.signal);
        } else {
          // Default: Epson ePOS-Print (Direct LAN HTTP/HTTPS)
          await this.sendToEpsonEpos(targetIp, port, bridgeUrl, data, config, controller.signal);
        }

        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;
        console.log(`[PrinterService] Print job ${jobId} confirmed via ${protocol} in ${durationMs}ms`);

        return {
          success: true,
          message: `Receipt printed successfully (${protocol})`,
          printerIp: targetIp || 'Bridge',
          durationMs,
          jobId,
          protocol,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (error: any) {
      console.warn(`[PrinterService] Print job ${jobId} failed:`, error.message);
      throw error;
    } finally {
      this.isJobLocked = false;
      this.activeJobId = null;
    }
  }

  /**
   * Browser AirPrint dispatch (iPad Safari native print dialog)
   */
  private static async printViaAirPrint(jobId: string, startTime: number): Promise<PrintResult> {
    console.log(`[PrinterService] Dispatched job ${jobId} to Apple AirPrint / Browser`);
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
    return {
      success: true,
      message: 'Print dialog opened (AirPrint)',
      printerIp: 'AirPrint',
      durationMs: Date.now() - startTime,
      jobId,
      protocol: 'browser_airprint',
    };
  }

  /**
   * Epson ePOS-Print XML transmission
   * Renders Kurdish/Arabic text and logos to high-resolution monochrome raster.
   * Detects WebKit Mixed Content restrictions and provides actionable guidance.
   */
  private static async sendToEpsonEpos(
    ip: string,
    port: number,
    bridgeUrl: string,
    data: FormattedReceiptData,
    config: PrinterConfig,
    signal: AbortSignal
  ): Promise<void> {
    const targetPort = port || 80;
    const endpoint = `http://${ip}:${targetPort}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=5000`;

    // Render pixel-perfect raster for Kurdish, Arabic & custom logos
    let rasterPayload: any = null;
    try {
      rasterPayload = await ReceiptImageRenderer.renderToRaster(
        data,
        config.paperWidth || '80mm',
        data.logo
      );
    } catch (rasterErr) {
      console.warn('[PrinterService] Raster render fallback to plain XML:', rasterErr);
    }

    const xmlPayload = ReceiptFormatter.buildEposXml(data, config.paperWidth, {
      autoCut: config.autoCut,
      openCashDrawer: config.openCashDrawer,
      rasterPayload: rasterPayload || undefined,
    });

    // 1. Native Capacitor (iOS/Android) bypasses browser Mixed Content and CORS restrictions
    if (Capacitor.isNativePlatform()) {
      try {
        const capResponse = await CapacitorHttp.post({
          url: endpoint,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
            SOAPAction: '""',
          },
          data: xmlPayload,
          connectTimeout: 5000,
          readTimeout: 5000,
        });

        if (capResponse.status !== 200) {
          throw new Error(`Epson ePOS printer returned HTTP ${capResponse.status}`);
        }
        return;
      } catch (capErr: any) {
        throw new Error(`Native Epson ePOS error: ${capErr.message}`);
      }
    }

    // 2. Web Browser Fetch with explicit response verification
    try {
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

      if (!response.ok) {
        throw new Error(`Epson ePOS HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      // Inspect ePOS XML response body for printer status codes
      if (responseText.includes('success="false"')) {
        const codeMatch = responseText.match(/code="([^"]+)"/);
        const errorCode = codeMatch ? codeMatch[1] : 'UNKNOWN_ERROR';
        throw new Error(`Epson printer reported error code: ${errorCode}`);
      }

      return;
    } catch (fetchErr: any) {
      // If a bridge URL is available, gracefully attempt fallback via bridge
      if (bridgeUrl || this.isLocalEnvironment()) {
        console.warn('[PrinterService] Epson direct HTTP failed, attempting fallback to bridge:', fetchErr.message);
        try {
          await this.sendToEscPosBridge(ip, 9100, bridgeUrl, data, config, signal);
          return;
        } catch (bridgeErr) {
          console.warn('[PrinterService] Bridge fallback also failed:', bridgeErr);
        }
      }

      // Diagnose browser security restrictions (Safari Mixed Content / CORS)
      if (
        fetchErr.name === 'TypeError' ||
        fetchErr.message?.includes('Failed to fetch') ||
        fetchErr.message?.includes('Load failed') ||
        fetchErr.message?.includes('NetworkError')
      ) {
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        if (isHttps) {
          throw new Error(
            `[iOS Safari Security] Direct HTTP printing to ${ip} is blocked by Apple Mixed Content security when running from an HTTPS web address.\n\n` +
            `ڕێگەچارە:\n` +
            `1. لە ڕێکخستنەکاندا پرۆتۆکۆڵ بکە بە 'Apple AirPrint' بۆ چاپی ڕاستەوخۆ بێ کۆمپیوتەر.\n` +
            `2. یان سێرڤەری پرینتی ناوخۆیی (Main Base Server) بەکاربهێنە.`
          );
        }

        throw new Error(
          `Could not reach Epson printer at ${ip}:${targetPort}. Please verify: (1) Printer is ON and connected to Wi-Fi. (2) ePOS is enabled on Port ${targetPort}.`
        );
      }

      if (fetchErr.name === 'AbortError' || fetchErr.message?.includes('aborted')) {
        throw new Error(`Connection to Epson printer timed out (${ip}:${targetPort}).`);
      }

      throw fetchErr;
    }
  }

  /**
   * ESC/POS Micro-Bridge transmission (LAN TCP socket to Port 9100)
   * Sends raster monochrome buffer and formatting commands via the dedicated bridge service.
   */
  private static async sendToEscPosBridge(
    printerIp: string,
    printerPort: number,
    bridgeUrl: string,
    data: FormattedReceiptData,
    config: PrinterConfig,
    signal: AbortSignal
  ): Promise<void> {
    // Determine candidate endpoints without blindly assuming window.location.hostname
    const candidateEndpoints: string[] = [];

    if (bridgeUrl && bridgeUrl.trim() !== '') {
      const cleanUrl = bridgeUrl.trim().replace(/\/+$/, '');
      const fullEndpoint = cleanUrl.endsWith('/api/print') ? cleanUrl : `${cleanUrl}/api/print`;
      candidateEndpoints.push(fullEndpoint);
    }

    // If served from local network server (e.g. Node / Vite running on the cafe LAN PC)
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isLanIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname);

      if (isLocalHost || isLanIp) {
        candidateEndpoints.push(`${origin}/api/print`);
        // Port 3001 standalone bridge on same host
        candidateEndpoints.push(`http://${window.location.hostname}:3001/api/print`);
      }
    }

    if (candidateEndpoints.length === 0) {
      throw new Error(
        'ESC/POS Bridge URL is not configured. Please enter your Main Base Server address (e.g., http://192.168.1.100:3001) in Settings.'
      );
    }

    // Render monochrome raster for Kurdish, Arabic, and Logo
    let rasterPayload: any = null;
    try {
      rasterPayload = await ReceiptImageRenderer.renderToRaster(
        data,
        config.paperWidth || '80mm',
        data.logo
      );
    } catch (renderErr) {
      console.warn('[PrinterService] Raster rendering failed, will use plain text:', renderErr);
    }

    const plainText = ReceiptFormatter.buildPlainText(data);

    let lastError: any = null;
    for (const url of candidateEndpoints) {
      try {
        console.log(`[PrinterService] Dispatching print job to Bridge endpoint: ${url}`);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printerIp: printerIp || '192.168.1.35',
            port: printerPort || 9100,
            rasterData: rasterPayload?.rasterData,
            bytesWidth: rasterPayload?.bytesWidth,
            height: rasterPayload?.height,
            plainText,
            autoCut: config.autoCut !== false,
            openCashDrawer: Boolean(config.openCashDrawer),
            order: data.order,
            cafeName: data.cafeName,
          }),
          signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Bridge returned HTTP ${response.status}`);
        }

        const resJson = await response.json().catch(() => ({ success: true }));
        if (resJson.success === false) {
          throw new Error(resJson.error || 'Bridge reported print failure');
        }

        return; // Success!
      } catch (err: any) {
        lastError = err;
        console.warn(`[PrinterService] Bridge endpoint ${url} failed:`, err.message);
      }
    }

    throw lastError || new Error(`Could not connect to Print Bridge. Check network connection and server status.`);
  }

  /**
   * Star Micronics WebPRNT transmission
   */
  private static async sendToStarWebPrnt(
    ip: string,
    port: number,
    data: FormattedReceiptData,
    config: PrinterConfig,
    signal: AbortSignal
  ): Promise<void> {
    const targetPort = port || 80;
    const endpoint = `http://${ip}:${targetPort}/StarWebPRNT/SendMessage`;
    const xmlPayload = ReceiptFormatter.buildStarWebPrntXml(data, config.paperWidth, {
      autoCut: config.autoCut,
    });

    if (Capacitor.isNativePlatform()) {
      const capResponse = await CapacitorHttp.post({
        url: endpoint,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
        data: xmlPayload,
        connectTimeout: 5000,
        readTimeout: 5000,
      });

      if (capResponse.status !== 200) {
        throw new Error(`Star WebPRNT returned status ${capResponse.status}`);
      }
      return;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: xmlPayload,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Star WebPRNT returned HTTP ${response.status}`);
    }
  }

  /**
   * Sends a test ticket to verify printer reachability and configuration
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
            menuItemId: 'test-item-1',
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
      cafeName: 'LAMOGE TEST TICKET',
      address: 'Network Verification',
      footerText: 'Test Print Succeeded!',
      menuItems: [
        {
          id: 'test-item-1',
          nameEn: 'Printer Test Line Item',
          nameKu: 'تێستی پرینتەر و پیتە کوردییەکان',
          nameAr: 'اختبار الطابعة واللغة العربية',
          categoryId: 'test',
          price: 5000,
          isAvailable: true,
        },
      ],
      currencySymbol: 'IQD',
      receiptLanguage: 'ku',
    };

    return this.printReceipt(mockData, overrideConfig);
  }

  /**
   * Checks whether the application is running in a local network environment
   */
  private static isLocalEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || /^192\.168\.|^10\.|^172\./.test(h);
  }
}
