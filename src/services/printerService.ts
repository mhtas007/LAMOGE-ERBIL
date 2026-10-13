/**
 * Network Printer Service
 * Production-grade receipt printing architecture supporting:
 * 1. Apple AirPrint / Browser Print (100% Computer-Free direct from iPad Safari)
 * 2. Epson ePOS-Print (Direct HTTP/HTTPS ePOS XML with raster Kurdish/Arabic graphics)
 * 3. ESC/POS Micro-Bridge (LAN TCP socket to Port 9100 for raw thermal printers)
 * 4. Star Micronics WebPRNT
 *
 * Implements strict job lifecycle, duplicate prevention, device detection, and actionable error diagnostics.
 */
import { printerConfigService, PrinterConfig } from './printerConfigService';
import { ReceiptFormatter, FormattedReceiptData, ZReportData, KitchenTicketData } from './receiptFormatter';
import { ReceiptImageRenderer } from './receiptImageRenderer';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export type PrintJobStatus = 'idle' | 'pending' | 'sending' | 'printed' | 'failed' | 'unknown';

export interface PrintJobState {
  jobId: string;
  status: PrintJobStatus;
  startedAt: number;
  completedAt?: number;
  error?: string;
  protocol: string;
  printerIp: string;
}

export interface PrintResult {
  success: boolean;
  message: string;
  printerIp: string;
  durationMs: number;
  jobId: string;
  protocol: string;
}

export interface PrinterCapabilities {
  protocol: string;
  supportsRaster: boolean;
  supportsKurdish: boolean;
  supportsArabic: boolean;
  supportsCashDrawer: boolean;
  supportsAutoCut: boolean;
  supportsDirectIpad: boolean;
  requiresPrintServer: boolean;
  paperWidths: ('58mm' | '80mm')[];
  description: string;
}

export interface DeviceContext {
  isIPad: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isDesktop: boolean;
  isNativeCapacitor: boolean;
  isHttps: boolean;
  platformName: string;
  recommendedProtocol: 'browser_airprint' | 'epson_epos' | 'raw_escpos_bridge';
}

export class PrinterService {
  private static isJobLocked = false;
  private static activeJobId: string | null = null;
  private static lastJobTimestamp = 0;
  private static jobHistory = new Map<
    string,
    { jobState: PrintJobState; payload: FormattedReceiptData; config?: Partial<PrinterConfig> }
  >();

  /**
   * Initializes printer subsystem and real-time settings synchronization
   */
  public static async initialize(config?: Partial<PrinterConfig>): Promise<void> {
    printerConfigService.initRealtimeListener();
    if (config) {
      await printerConfigService.savePrinterConfig(config);
    }
  }

  /**
   * Device and browser environment detection (identifies iPad Safari, desktop Chrome, etc.)
   */
  public static detectDeviceContext(): DeviceContext {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isTouchMac =
      typeof navigator !== 'undefined' &&
      navigator.platform === 'MacIntel' &&
      navigator.maxTouchPoints > 1;
    const isIPad = /iPad/.test(ua) || isTouchMac;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || isTouchMac;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /CriOS|Chrome/.test(ua);
    const isNativeCapacitor = Capacitor.isNativePlatform();
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isDesktop = !isIOS && !/Android|Mobile/.test(ua);

    let recommendedProtocol: 'browser_airprint' | 'epson_epos' | 'raw_escpos_bridge' =
      'browser_airprint';
    if (isNativeCapacitor) {
      recommendedProtocol = 'epson_epos';
    } else if (isIPad) {
      // 100% Computer-free native printing on iPad Safari
      recommendedProtocol = 'browser_airprint';
    } else if (isDesktop) {
      recommendedProtocol = 'raw_escpos_bridge';
    }

    let platformName = 'Desktop Browser';
    if (isIPad) platformName = isSafari ? 'iPad Safari' : 'iPad Chrome';
    else if (isIOS) platformName = 'iOS Device';
    else if (isNativeCapacitor) platformName = 'Native Mobile App';

    return {
      isIPad,
      isIOS,
      isSafari,
      isChrome,
      isDesktop,
      isNativeCapacitor,
      isHttps,
      platformName,
      recommendedProtocol,
    };
  }

  /**
   * Probes network printer reachability and measures round-trip latency
   */
  public static async checkConnection(
    targetIp?: string,
    port?: number,
    overrideProtocol?: string
  ): Promise<{ reachable: boolean; latencyMs?: number; error?: string; protocol: string }> {
    const config = await printerConfigService.getPrinterConfig();
    const protocol = overrideProtocol || config.protocol || 'browser_airprint';
    const ip = (targetIp || config.printerIp || '').trim();
    const targetPort = port || config.port || (protocol === 'raw_escpos_bridge' ? 3001 : 80);
    const startTime = Date.now();

    if (protocol === 'browser_airprint') {
      return {
        reachable: true,
        latencyMs: 0,
        protocol: 'browser_airprint',
      };
    }

    if (!ip && protocol !== 'raw_escpos_bridge') {
      return {
        reachable: false,
        error: 'Printer IP address is not configured.',
        protocol,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      if (protocol === 'raw_escpos_bridge') {
        const bridgeUrl = (config.bridgeUrl || '').trim();
        const endpoint = bridgeUrl
          ? `${bridgeUrl.replace(/\/+$/, '')}/api/print`
          : '/api/print';

        const res = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timer);
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          return { reachable: true, latencyMs, protocol };
        }
        return { reachable: false, latencyMs, error: `Bridge returned status ${res.status}`, protocol };
      }

      // Epson ePOS probe
      if (Capacitor.isNativePlatform()) {
        const capRes = await CapacitorHttp.get({
          url: `http://${ip}:${targetPort}/cgi-bin/epos/service.cgi?devid=local_printer`,
          connectTimeout: 3000,
          readTimeout: 3000,
        });
        clearTimeout(timer);
        const latencyMs = Date.now() - startTime;
        return { reachable: capRes.status === 200, latencyMs, protocol };
      }

      const res = await fetch(
        `http://${ip}:${targetPort}/cgi-bin/epos/service.cgi?devid=local_printer`,
        {
          method: 'GET',
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      return { reachable: res.ok || res.status === 200, latencyMs, protocol };
    } catch (err: any) {
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return { reachable: false, latencyMs, error: 'Connection timed out (4000ms)', protocol };
      }

      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return {
          reachable: false,
          latencyMs,
          error: `Safari HTTPS Mixed Content: direct LAN access to http://${ip} is blocked by WebKit security. Select Apple AirPrint or use the Local Base Server.`,
          protocol,
        };
      }

      return { reachable: false, latencyMs, error: err.message || 'Host unreachable', protocol };
    }
  }

  /**
   * Retrieves operational capabilities based on protocol and hardware
   */
  public static getPrinterCapabilities(protocolOverride?: string): PrinterCapabilities {
    const protocol = protocolOverride || 'browser_airprint';

    switch (protocol) {
      case 'browser_airprint':
        return {
          protocol: 'browser_airprint',
          supportsRaster: true,
          supportsKurdish: true,
          supportsArabic: true,
          supportsCashDrawer: false,
          supportsAutoCut: true,
          supportsDirectIpad: true,
          requiresPrintServer: false,
          paperWidths: ['80mm', '58mm'],
          description:
            'Apple AirPrint: 100% computer-free printing directly from iPad Safari to compatible thermal printers.',
        };
      case 'epson_epos':
        return {
          protocol: 'epson_epos',
          supportsRaster: true,
          supportsKurdish: true,
          supportsArabic: true,
          supportsCashDrawer: true,
          supportsAutoCut: true,
          supportsDirectIpad: true,
          requiresPrintServer: false,
          paperWidths: ['80mm', '58mm'],
          description:
            'Epson ePOS-Print: Direct XML over LAN (Port 80/8008 or HTTPS). Compatible with TM-m30, TM-T88VI, and TM-T20III.',
        };
      case 'raw_escpos_bridge':
        return {
          protocol: 'raw_escpos_bridge',
          supportsRaster: true,
          supportsKurdish: true,
          supportsArabic: true,
          supportsCashDrawer: true,
          supportsAutoCut: true,
          supportsDirectIpad: true,
          requiresPrintServer: true,
          paperWidths: ['80mm', '58mm'],
          description:
            'Main Base Server Bridge: High-speed TCP socket on Port 9100 with canvas monochrome raster graphics.',
        };
      case 'star_webprnt':
        return {
          protocol: 'star_webprnt',
          supportsRaster: true,
          supportsKurdish: true,
          supportsArabic: true,
          supportsCashDrawer: true,
          supportsAutoCut: true,
          supportsDirectIpad: true,
          requiresPrintServer: false,
          paperWidths: ['80mm', '58mm'],
          description:
            'Star Micronics WebPRNT: Direct HTTP XML for Star TSP654II / mC-Print3.',
        };
      default:
        return {
          protocol: 'browser_airprint',
          supportsRaster: true,
          supportsKurdish: true,
          supportsArabic: true,
          supportsCashDrawer: false,
          supportsAutoCut: true,
          supportsDirectIpad: true,
          requiresPrintServer: false,
          paperWidths: ['80mm', '58mm'],
          description: 'Standard browser printing.',
        };
    }
  }

  /**
   * Retrieves the current lifecycle state of a specific print job
   */
  public static getPrintStatus(jobId: string): PrintJobState | undefined {
    return this.jobHistory.get(jobId)?.jobState;
  }

  /**
   * Safely retries a previously submitted print job without altering the completed sale
   */
  public static async retryPrint(jobId: string): Promise<PrintResult> {
    const entry = this.jobHistory.get(jobId);
    if (!entry) {
      throw new Error(`Print job ${jobId} not found in history for retry.`);
    }
    entry.jobState.status = 'pending';
    entry.jobState.error = undefined;
    return this.printReceipt(entry.payload, entry.config);
  }

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

    const config: PrinterConfig = {
      ...(await printerConfigService.getPrinterConfig()),
      ...overrideConfig,
    };

    const protocol = config.protocol || 'browser_airprint';
    const targetIp = (config.printerIp || '').trim();

    // Register job in history
    this.jobHistory.set(jobId, {
      jobState: {
        jobId,
        status: 'sending',
        startedAt: startTime,
        protocol,
        printerIp: targetIp,
      },
      payload: data,
      config: overrideConfig,
    });

    try {
      // --- PROTOCOL 1: NATIVE BROWSER / APPLE AIRPRINT ---
      // Direct iPad printing without any PC or print bridge
      if (protocol === 'browser_airprint') {
        const result = await this.printViaAirPrint(jobId, startTime);
        const historyEntry = this.jobHistory.get(jobId);
        if (historyEntry) {
          historyEntry.jobState.status = 'printed';
          historyEntry.jobState.completedAt = Date.now();
        }
        return result;
      }

      // Check required IP address for network protocols
      const bridgeUrl = (config.bridgeUrl || '').trim();

      if (protocol === 'raw_escpos_bridge') {
        if (!targetIp && !bridgeUrl) {
          throw new Error(
            'Bridge URL or Printer IP is required for ESC/POS Bridge mode. Configure in Settings.'
          );
        }
      } else if (!targetIp) {
        throw new Error(
          'Printer IP address is not configured. Please enter the Static IP in Settings or select Apple AirPrint.'
        );
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

        const historyEntry = this.jobHistory.get(jobId);
        if (historyEntry) {
          historyEntry.jobState.status = 'printed';
          historyEntry.jobState.completedAt = Date.now();
        }

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
      const historyEntry = this.jobHistory.get(jobId);
      if (historyEntry) {
        historyEntry.jobState.status = 'failed';
        historyEntry.jobState.error = error.message;
      }
      throw error;
    } finally {
      this.isJobLocked = false;
      this.activeJobId = null;
    }
  }

  /**
   * Prints shift closure report (Z-Report)
   */
  public static async printZReport(
    data: ZReportData,
    overrideConfig?: Partial<PrinterConfig>
  ): Promise<PrintResult> {
    const startTime = Date.now();
    const config: PrinterConfig = {
      ...(await printerConfigService.getPrinterConfig()),
      ...overrideConfig,
    };

    const protocol = config.protocol || 'browser_airprint';
    const targetIp = (config.printerIp || '').trim();
    const jobId = `ZREP-${data.shiftId.slice(-6)}-${Date.now()}`;

    if (protocol === 'browser_airprint') {
      return this.printViaAirPrint(jobId, startTime);
    }

    const raster = await ReceiptImageRenderer.renderZReportToRaster(
      data,
      config.paperWidth || '80mm'
    );

    await this.dispatchRasterJob(raster, targetIp, config);

    return {
      success: true,
      message: `Z-Report printed successfully (${protocol})`,
      printerIp: targetIp || 'Bridge',
      durationMs: Date.now() - startTime,
      jobId,
      protocol,
    };
  }

  /**
   * Prints kitchen/bar preparation ticket (KOT)
   */
  public static async printKitchenTicket(
    data: KitchenTicketData,
    overrideConfig?: Partial<PrinterConfig>
  ): Promise<PrintResult> {
    const startTime = Date.now();
    const config: PrinterConfig = {
      ...(await printerConfigService.getPrinterConfig()),
      ...overrideConfig,
    };

    const protocol = config.protocol || 'browser_airprint';
    const targetIp = (config.printerIp || '').trim();
    const jobId = `KOT-${data.order.invoiceCode || data.order.id.slice(0, 6)}-${Date.now()}`;

    if (protocol === 'browser_airprint') {
      return this.printViaAirPrint(jobId, startTime);
    }

    const raster = await ReceiptImageRenderer.renderKitchenTicketToRaster(
      data,
      config.paperWidth || '80mm'
    );

    await this.dispatchRasterJob(raster, targetIp, config);

    return {
      success: true,
      message: `Kitchen ticket printed successfully (${protocol})`,
      printerIp: targetIp || 'Bridge',
      durationMs: Date.now() - startTime,
      jobId,
      protocol,
    };
  }

  /**
   * Common dispatcher for pre-rendered raster jobs (Z-Report, KOT)
   */
  private static async dispatchRasterJob(
    raster: { rasterData: string; width: number; height: number; bytesWidth: number },
    targetIp: string,
    config: PrinterConfig
  ): Promise<void> {
    const protocol = config.protocol || 'browser_airprint';
    const bridgeUrl = (config.bridgeUrl || '').trim();
    const port = config.port || (protocol === 'raw_escpos_bridge' ? 3001 : 80);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 6000);

    try {
      if (protocol === 'raw_escpos_bridge') {
        const candidateEndpoints: string[] = [];
        if (bridgeUrl) candidateEndpoints.push(bridgeUrl.endsWith('/api/print') ? bridgeUrl : `${bridgeUrl}/api/print`);
        if (typeof window !== 'undefined') {
          candidateEndpoints.push(`${window.location.origin}/api/print`);
          candidateEndpoints.push(`http://${window.location.hostname}:3001/api/print`);
        }

        let sent = false;
        let lastErr: any = null;
        for (const ep of candidateEndpoints) {
          try {
            const res = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                printerIp: targetIp || '192.168.1.35',
                port: 9100,
                rasterData: raster.rasterData,
                bytesWidth: raster.bytesWidth,
                height: raster.height,
                autoCut: true,
                openCashDrawer: false,
              }),
              signal: controller.signal,
            });
            if (res.ok) {
              sent = true;
              break;
            }
          } catch (e) {
            lastErr = e;
          }
        }
        if (!sent) throw lastErr || new Error('Failed to send raster job to bridge');
      } else {
        // Epson ePOS XML
        const endpoint = `http://${targetIp}:${port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=5000`;
        const xml = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"><image width="${raster.width}" height="${raster.height}" color="color_1" mode="mono">${raster.rasterData}</image><cut type="feed"/></epos-print></s:Body></s:Envelope>`;

        if (Capacitor.isNativePlatform()) {
          await CapacitorHttp.post({
            url: endpoint,
            headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
            data: xml,
            connectTimeout: 5000,
          });
        } else {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
            body: xml,
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Epson ePOS returned HTTP ${res.status}`);
        }
      }
    } finally {
      clearTimeout(timeoutId);
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
        console.warn(
          '[PrinterService] Epson direct HTTP failed, attempting fallback to bridge:',
          fetchErr.message
        );
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
    const candidateEndpoints: string[] = [];

    if (bridgeUrl && bridgeUrl.trim() !== '') {
      const cleanUrl = bridgeUrl.trim().replace(/\/+$/, '');
      const fullEndpoint = cleanUrl.endsWith('/api/print') ? cleanUrl : `${cleanUrl}/api/print`;
      candidateEndpoints.push(fullEndpoint);
    }

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const isLocalHost =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isLanIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(window.location.hostname);

      if (isLocalHost || isLanIp) {
        candidateEndpoints.push(`${origin}/api/print`);
        candidateEndpoints.push(`http://${window.location.hostname}:3001/api/print`);
      }
    }

    if (candidateEndpoints.length === 0) {
      throw new Error(
        'ESC/POS Bridge URL is not configured. Please enter your Main Base Server address (e.g., http://192.168.1.100:3001) in Settings.'
      );
    }

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
