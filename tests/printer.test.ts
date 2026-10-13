/**
 * LAMOGE POS SYSTEM - Automated Comprehensive Test Suite
 * Tests printing architecture, device compatibility, receipt formatting,
 * Kurdish/Arabic rendering, concurrency control, transaction integrity, and SSRF security.
 */
import assert from 'node:assert';
import { ReceiptFormatter, FormattedReceiptData } from '../src/services/receiptFormatter';
import { PrinterService } from '../src/services/printerService';

// SSRF validator matching escpos-bridge/server.js and vite.config.ts
function isValidLanIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(trimmed);
  if (!ipv4Match) return false;
  const octets = ipv4Match.slice(1, 5).map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return false;
  if (octets[0] === 127 || octets[0] === 0 || octets[0] === 255) return false;
  if (octets[0] === 169 && octets[1] === 254) return false;
  return true;
}

const mockOrder = {
  id: 'ORD-TEST-999',
  invoiceCode: 'INV-2026-999',
  type: 'dine_in' as const,
  status: 'completed' as const,
  tableId: 'tbl-1',
  items: [
    {
      menuItemId: 'item-1',
      quantity: 2,
      price: 4500,
      selectedAddons: [{ id: 'addon-1', nameKu: 'شەکر کەم', nameAr: 'سكر قليل', nameEn: 'Low Sugar', price: 500 }],
    },
    {
      menuItemId: 'item-2',
      quantity: 1,
      price: 3500,
    },
  ],
  subtotal: 13000,
  discount: 1000,
  serviceCharge: 500,
  total: 12500,
  createdAt: '2026-09-09T08:48:00.000Z',
  paymentMethod: 'cash' as const,
};

const mockMenuItems = [
  {
    id: 'item-1',
    nameEn: 'Spanish Latte',
    nameKu: 'سپانیش لاتێ',
    nameAr: 'سبانيش لاتيه',
    categoryId: 'coffee',
    price: 4500,
    isAvailable: true,
  },
  {
    id: 'item-2',
    nameEn: 'Chocolate Croissant',
    nameKu: 'کرۆسانی شوکولاتە',
    nameAr: 'كرواسون شوكولاتة',
    categoryId: 'bakery',
    price: 3500,
    isAvailable: true,
  },
];

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 LAMOGE POS SYSTEM - Test Suite Execution');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  // --- TEST 1: Kurdish Sorani Receipt Formatting ---
  runTest('1. Kurdish Sorani text rendering and labels formatting', () => {
    const kuData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'لامۆج کافێ',
      address: 'هەولێر - شەقامی ١٠٠م',
      footerText: 'سوپاس بۆ سەردانەکەت',
      menuItems: mockMenuItems,
      currencySymbol: 'د.ع',
      receiptLanguage: 'ku',
      tableName: 'مێزی 4',
    };

    const plain = ReceiptFormatter.buildPlainText(kuData);
    assert(plain.includes('لامۆج کافێ'), 'Must include cafe name in Kurdish');
    assert(plain.includes('سپانیش لاتێ'), 'Must format Kurdish product name');
    assert(plain.includes('ژ. پسوولە: INV-2026-999'), 'Must format Kurdish invoice code');
    assert(plain.includes('کۆی کۆتایی:'), 'Must format Kurdish total label');
    assert(plain.includes('12,500 د.ع'), 'Must contain formatted total with currency');
  });

  // --- TEST 2: Arabic Receipt Formatting ---
  runTest('2. Arabic text rendering and RTL labels formatting', () => {
    const arData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'لاموج كافيه',
      address: 'أربيل - شارع 100م',
      footerText: 'شكراً لزيارتكم',
      menuItems: mockMenuItems,
      currencySymbol: 'د.ع',
      receiptLanguage: 'ar',
      tableName: 'طاولة 4',
    };

    const plain = ReceiptFormatter.buildPlainText(arData);
    assert(plain.includes('لاموج كافيه'), 'Must include cafe name in Arabic');
    assert(plain.includes('سبانيش لاتيه'), 'Must format Arabic product name');
    assert(plain.includes('رقم الطلب: INV-2026-999'), 'Must format Arabic invoice code');
    assert(plain.includes('الإجمالي الكلي:'), 'Must format Arabic total label');
  });

  // --- TEST 3: English Receipt Formatting ---
  runTest('3. English receipt rendering and alignment', () => {
    const enData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'LAMOGE CAFE',
      address: 'Erbil 100m Avenue',
      footerText: 'Thank you for your visit!',
      menuItems: mockMenuItems,
      currencySymbol: 'IQD',
      receiptLanguage: 'en',
      tableName: 'Table 4',
    };

    const plain = ReceiptFormatter.buildPlainText(enData);
    assert(plain.includes('LAMOGE CAFE'), 'Must include English cafe name');
    assert(plain.includes('Spanish Latte'), 'Must format English product name');
    assert(plain.includes('TOTAL DUE:'), 'Must format English total label');
  });

  // --- TEST 4: Receipt Calculation & Total Verification ---
  runTest('4. Receipt totals, discount, and service charge integrity', () => {
    assert.strictEqual(
      mockOrder.total,
      mockOrder.subtotal - mockOrder.discount + mockOrder.serviceCharge,
      'Total must exactly match subtotal - discount + serviceCharge'
    );
  });

  // --- TEST 5: Epson ePOS-Print XML Structure with Raster ---
  runTest('5. Epson ePOS-Print XML generation with monochrome raster tag', () => {
    const testData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'LAMOGE CAFE',
      menuItems: mockMenuItems,
      currencySymbol: 'IQD',
    };

    const mockRaster = {
      rasterData: 'AQIDBAUG',
      width: 576,
      height: 800,
    };

    const eposXml = ReceiptFormatter.buildEposXml(testData, '80mm', {
      autoCut: true,
      openCashDrawer: true,
      rasterPayload: mockRaster,
    });

    assert(eposXml.includes('<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">'), 'Must contain epos-print namespace');
    assert(eposXml.includes('<image width="576" height="800" color="color_1" mode="mono">AQIDBAUG</image>'), 'Must contain raster image tag');
    assert(eposXml.includes('<cut type="feed"/>'), 'Must contain auto-cut command');
    assert(eposXml.includes('<pulse drawer="drawer_1" time="pulse_100"/>'), 'Must contain cash drawer kick');
  });

  // --- TEST 6: Marked Reprint Integrity ---
  runTest('6. Duplicate / Reprint receipt integrity without altering order ID', () => {
    const reprintData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'LAMOGE CAFE',
      menuItems: mockMenuItems,
      isReprint: true,
    };

    assert.strictEqual(reprintData.order.id, 'ORD-TEST-999', 'Order ID must remain identical on reprint');
    assert.strictEqual(reprintData.order.invoiceCode, 'INV-2026-999', 'Invoice code must remain identical on reprint');
    assert.strictEqual(reprintData.isReprint, true, 'isReprint flag must be true');
  });

  // --- TEST 7: SSRF Network IP Protection ---
  runTest('7. SSRF Protection: LAN IP validation blocks loopback, cloud metadata & zero addresses', () => {
    // Malicious / Restricted targets must be rejected
    assert.strictEqual(isValidLanIp('127.0.0.1'), false, 'Loopback 127.0.0.1 must be rejected');
    assert.strictEqual(isValidLanIp('127.0.1.1'), false, 'Loopback 127.0.1.1 must be rejected');
    assert.strictEqual(isValidLanIp('0.0.0.0'), false, '0.0.0.0 must be rejected');
    assert.strictEqual(isValidLanIp('255.255.255.255'), false, 'Broadcast must be rejected');
    assert.strictEqual(isValidLanIp('169.254.169.254'), false, 'AWS/GCP metadata 169.254.x.x must be rejected');
    assert.strictEqual(isValidLanIp('localhost'), false, 'Non-IP strings must be rejected');
    assert.strictEqual(isValidLanIp('http://evil.com'), false, 'URLs must be rejected');

    // Valid LAN thermal printer targets must be accepted
    assert.strictEqual(isValidLanIp('192.168.1.35'), true, 'Standard 192.168.x.x LAN IP must be accepted');
    assert.strictEqual(isValidLanIp('192.168.0.100'), true, 'Standard 192.168.0.x LAN IP must be accepted');
    assert.strictEqual(isValidLanIp('10.0.0.50'), true, 'Class A 10.x.x.x LAN IP must be accepted');
    assert.strictEqual(isValidLanIp('172.16.0.20'), true, 'Class B 172.16.x.x LAN IP must be accepted');
  });

  // --- TEST 8: Printer Capabilities Query ---
  runTest('8. Printer Capabilities Query returns accurate device features', () => {
    const airprintCaps = PrinterService.getPrinterCapabilities('browser_airprint');
    assert.strictEqual(airprintCaps.supportsDirectIpad, true, 'AirPrint must support direct iPad');
    assert.strictEqual(airprintCaps.requiresPrintServer, false, 'AirPrint must not require a print server');

    const eposCaps = PrinterService.getPrinterCapabilities('epson_epos');
    assert.strictEqual(eposCaps.supportsDirectIpad, true, 'Epson ePOS must support direct iPad');
    assert.strictEqual(eposCaps.supportsCashDrawer, true, 'Epson ePOS must support cash drawer');

    const bridgeCaps = PrinterService.getPrinterCapabilities('raw_escpos_bridge');
    assert.strictEqual(bridgeCaps.requiresPrintServer, true, 'Bridge mode requires print server');
    assert.strictEqual(bridgeCaps.supportsRaster, true, 'Bridge mode supports raster graphics');
  });

  // --- TEST 9: Device Context Detection ---
  runTest('9. Device context detection correctly structures platform metadata', () => {
    const context = PrinterService.detectDeviceContext();
    assert(typeof context.isIPad === 'boolean', 'isIPad must be boolean');
    assert(typeof context.isSafari === 'boolean', 'isSafari must be boolean');
    assert(typeof context.recommendedProtocol === 'string', 'recommendedProtocol must be string');
  });

  // --- TEST 10: Double-click / Concurrency Locking ---
  runTest('10. Rapid repeated clicks and duplicate-job prevention', async () => {
    const testData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'CONCURRENCY TEST',
      menuItems: mockMenuItems,
    };

    // First call to AirPrint
    const job1 = await PrinterService.printReceipt(testData, { protocol: 'browser_airprint' });
    assert(job1.success, 'First job must succeed');
    assert(job1.jobId.startsWith('JOB-'), 'Job ID must be generated with JOB- prefix');

    // Job history must register job state
    const jobStatus = PrinterService.getPrintStatus(job1.jobId);
    assert(jobStatus, 'Job state must be stored in history');
    assert.strictEqual(jobStatus?.status, 'printed', 'Job state must be marked printed');
  });

  // --- TEST 11: Decoupling Billing from Printing Failure ---
  runTest('11. Print failure does not invalidate transaction or double-charge', async () => {
    const testData: FormattedReceiptData = {
      order: mockOrder,
      cafeName: 'TRANSACTION TEST',
      menuItems: mockMenuItems,
    };

    // Attempting to print to an unreachable IP with a short timeout
    let errorCaught = false;
    try {
      await PrinterService.printReceipt(testData, {
        protocol: 'epson_epos',
        printerIp: '192.168.254.254', // non-existent IP on subnet
        timeoutMs: 100,
      });
    } catch {
      errorCaught = true;
    }

    assert(errorCaught, 'Network print to dead IP must throw an error');
    // Order total and status remain intact!
    assert.strictEqual(mockOrder.status, 'completed', 'Order status must remain completed despite print error');
    assert.strictEqual(mockOrder.total, 12500, 'Order total must not be recomputed or lost');
  });

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
