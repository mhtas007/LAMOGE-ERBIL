/**
 * Printer Configuration Service
 * Handles dynamic fetching, caching, and real-time syncing of printer configuration from Firestore.
 */
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';

export interface PrinterConfig {
  printerIp: string;
  port: number;
  bridgeUrl?: string;
  protocol: 'browser_airprint' | 'epson_epos' | 'star_webprnt' | 'raw_escpos_bridge';
  paperWidth: '80mm' | '58mm';
  autoCut: boolean;
  openCashDrawer: boolean;
  timeoutMs: number;
  silentPrint: boolean;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  printerIp: '',
  port: 80,
  bridgeUrl: '',
  protocol: 'browser_airprint',
  paperWidth: '80mm',
  autoCut: true,
  openCashDrawer: false,
  timeoutMs: 6000,
  silentPrint: false,
};

class PrinterConfigService {
  private cachedConfig: PrinterConfig = { ...DEFAULT_PRINTER_CONFIG };
  private isInitialized = false;
  private unsubscribeListener: Unsubscribe | null = null;
  private listeners: Array<(config: PrinterConfig) => void> = [];

  /**
   * Initializes real-time listener for Firestore document `settings/cafe_config`
   * and fallback `settings/receipt`
   */
  public initRealtimeListener(): void {
    if (this.unsubscribeListener) {
      return;
    }

    try {
      const configDocRef = doc(db, 'settings', 'cafe_config');
      this.unsubscribeListener = onSnapshot(
        configDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            this.cachedConfig = {
              printerIp: (data.printer_ip || data.printerIp || '').trim(),
              port: Number(data.printer_port || data.port) || (data.printer_protocol === 'raw_escpos_bridge' ? 3001 : 80),
              bridgeUrl: (data.bridge_url || data.bridgeUrl || '').trim(),
              protocol: data.printer_protocol || data.protocol || 'browser_airprint',
              paperWidth: data.paper_width || data.paperWidth || '80mm',
              autoCut: data.auto_cut !== false && data.autoCut !== false,
              openCashDrawer: Boolean(data.open_cash_drawer || data.openCashDrawer),
              timeoutMs: Number(data.timeout_ms || data.timeoutMs) || 6000,
              silentPrint: Boolean(data.silent_print ?? data.silentPrint ?? false),
            };
            this.isInitialized = true;
            console.log('[PrinterConfig] Real-time cache updated from cafe_config:', this.cachedConfig);
            this.notifyListeners();
          }
        },
        (error) => {
          console.warn('[PrinterConfig] cafe_config listener warning:', error.message);
        }
      );
    } catch (err) {
      console.warn('[PrinterConfig] Failed to attach listener:', err);
    }
  }

  public subscribe(cb: (config: PrinterConfig) => void): () => void {
    this.listeners.push(cb);
    cb(this.cachedConfig);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb(this.cachedConfig);
      } catch (e) {
        console.error('[PrinterConfig] Listener callback error:', e);
      }
    });
  }

  /**
   * Fetches the latest printer IP and config from Firestore or returns cache.
   * @param forceRefresh - If true, bypasses the memory cache.
   */
  public async getPrinterConfig(forceRefresh = false): Promise<PrinterConfig> {
    if (this.isInitialized && !forceRefresh && (this.cachedConfig.printerIp || this.cachedConfig.bridgeUrl)) {
      return this.cachedConfig;
    }

    try {
      console.log('[PrinterConfig] Fetching latest printer config from Firestore (settings/cafe_config)...');
      const configDocRef = doc(db, 'settings', 'cafe_config');
      const snapshot = await getDoc(configDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        this.cachedConfig = {
          printerIp: (data.printer_ip || data.printerIp || '').trim(),
          port: Number(data.printer_port || data.port) || (data.printer_protocol === 'raw_escpos_bridge' ? 3001 : 80),
          bridgeUrl: (data.bridge_url || data.bridgeUrl || '').trim(),
          protocol: data.printer_protocol || data.protocol || 'browser_airprint',
          paperWidth: data.paper_width || data.paperWidth || '80mm',
          autoCut: data.auto_cut !== false && data.autoCut !== false,
          openCashDrawer: Boolean(data.open_cash_drawer || data.openCashDrawer),
          timeoutMs: Number(data.timeout_ms || data.timeoutMs) || 6000,
          silentPrint: Boolean(data.silent_print ?? data.silentPrint ?? false),
        };
      } else {
        // Fallback check to `settings/receipt` for backwards compatibility
        const receiptDocRef = doc(db, 'settings', 'receipt');
        const receiptSnap = await getDoc(receiptDocRef);
        if (receiptSnap.exists()) {
          const rData = receiptSnap.data();
          if (rData.printerIp) {
            this.cachedConfig.printerIp = rData.printerIp.trim();
            if (rData.printerProtocol) this.cachedConfig.protocol = rData.printerProtocol;
            if (rData.printerPort) this.cachedConfig.port = Number(rData.printerPort);
            if (rData.bridgeUrl) this.cachedConfig.bridgeUrl = rData.bridgeUrl.trim();
            if (rData.paperWidth) this.cachedConfig.paperWidth = rData.paperWidth;
          }
        }
      }

      this.isInitialized = true;
      return this.cachedConfig;
    } catch (error) {
      console.error('[PrinterConfig] Failed to fetch printer configuration:', error);
      return this.cachedConfig;
    }
  }

  /**
   * Updates printer configuration both in Firestore (settings/cafe_config & settings/receipt)
   * and in memory cache immediately.
   */
  public async savePrinterConfig(newConfig: Partial<PrinterConfig>): Promise<void> {
    // Clean and merge only defined values
    const safePort = newConfig.port !== undefined && !isNaN(Number(newConfig.port))
      ? Number(newConfig.port)
      : (this.cachedConfig.port || (this.cachedConfig.protocol === 'raw_escpos_bridge' ? 3001 : 80));

    this.cachedConfig = {
      printerIp: newConfig.printerIp !== undefined ? (newConfig.printerIp || '').trim() : (this.cachedConfig.printerIp || '').trim(),
      port: safePort,
      bridgeUrl: newConfig.bridgeUrl !== undefined ? (newConfig.bridgeUrl || '').trim() : (this.cachedConfig.bridgeUrl || '').trim(),
      protocol: newConfig.protocol || this.cachedConfig.protocol || 'browser_airprint',
      paperWidth: newConfig.paperWidth || this.cachedConfig.paperWidth || '80mm',
      autoCut: newConfig.autoCut !== undefined ? Boolean(newConfig.autoCut) : (this.cachedConfig.autoCut !== false),
      openCashDrawer: newConfig.openCashDrawer !== undefined ? Boolean(newConfig.openCashDrawer) : Boolean(this.cachedConfig.openCashDrawer),
      timeoutMs: newConfig.timeoutMs !== undefined && !isNaN(Number(newConfig.timeoutMs)) ? Number(newConfig.timeoutMs) : (this.cachedConfig.timeoutMs || 6000),
      silentPrint: newConfig.silentPrint !== undefined ? Boolean(newConfig.silentPrint) : Boolean(this.cachedConfig.silentPrint),
    };
    this.isInitialized = true;
    this.notifyListeners();

    const firestoreData: Record<string, any> = {
      printer_ip: this.cachedConfig.printerIp || '',
      printer_port: Number(this.cachedConfig.port) || 80,
      bridge_url: this.cachedConfig.bridgeUrl || '',
      printer_protocol: this.cachedConfig.protocol || 'browser_airprint',
      paper_width: this.cachedConfig.paperWidth || '80mm',
      auto_cut: this.cachedConfig.autoCut !== false,
      open_cash_drawer: Boolean(this.cachedConfig.openCashDrawer),
      timeout_ms: Number(this.cachedConfig.timeoutMs) || 6000,
      silent_print: Boolean(this.cachedConfig.silentPrint),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'settings', 'cafe_config'), firestoreData, { merge: true });
      // Keep settings/receipt in sync too
      await setDoc(
        doc(db, 'settings', 'receipt'),
        {
          printerIp: this.cachedConfig.printerIp || '',
          printerPort: Number(this.cachedConfig.port) || 80,
          bridgeUrl: this.cachedConfig.bridgeUrl || '',
          printerProtocol: this.cachedConfig.protocol || 'browser_airprint',
          paperWidth: this.cachedConfig.paperWidth || '80mm',
          silentPrint: Boolean(this.cachedConfig.silentPrint),
          autoCut: this.cachedConfig.autoCut !== false,
          openCashDrawer: Boolean(this.cachedConfig.openCashDrawer),
        },
        { merge: true }
      );
      console.log('[PrinterConfig] Successfully saved printer configuration to Firestore.');
    } catch (err) {
      console.error('[PrinterConfig] Error saving config to Firestore:', err);
      throw err;
    }
  }
}

export const printerConfigService = new PrinterConfigService();
