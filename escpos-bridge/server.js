/**
 * POS ESC/POS Micro-Bridge Server
 * Runs locally on the cafe network (Cashier PC or Base Server) to receive print jobs
 * from iPad Safari / PWA over HTTP and write raw ESC/POS & Raster bytes to the thermal printer on TCP port 9100.
 */
const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const BRIDGE_PORT = process.env.BRIDGE_PORT || 3001;
const DEFAULT_PRINTER_PORT = 9100;

// Security: Increase JSON body limit for raster bitmap graphics, enable CORS
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// SSRF & Security validation helper
function isValidPrinterIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  // Valid IPv4 format
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = trimmed.match(ipv4Regex);
  if (!match) return false;

  const octets = match.slice(1).map(Number);
  if (octets.some(o => o < 0 || o > 255)) return false;

  // Block localhost/loopback (127.0.0.0/8), 0.0.0.0, link-local (169.254.0.0/16), broadcast (255.255.255.255)
  if (octets[0] === 127 || octets[0] === 0) return false;
  if (octets[0] === 169 && octets[1] === 254) return false;
  if (octets[0] >= 224) return false; // Multicast & broadcast

  return true;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LAMOGE POS ESC/POS Print Bridge',
    version: '2.0.0',
    port: BRIDGE_PORT,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/print', (req, res) => {
  const startTime = Date.now();
  const {
    order,
    cafeName,
    printerIp,
    plainText,
    rasterData,
    bytesWidth,
    height,
    openCashDrawer,
    autoCut,
  } = req.body;

  const targetIp = (printerIp || '').trim();
  if (!targetIp || !isValidPrinterIp(targetIp)) {
    return res.status(400).json({
      success: false,
      error: `Invalid or forbidden printer IP address: "${targetIp}". Must be a valid local LAN IP address.`,
    });
  }

  console.log(`[Bridge] 🖨️ Dispatching print job to printer: ${targetIp}:${DEFAULT_PRINTER_PORT}`);

  const client = new net.Socket();
  client.setTimeout(6000);

  let totalBytesWritten = 0;

  client.connect(DEFAULT_PRINTER_PORT, targetIp, () => {
    console.log(`[Bridge] Connected to raw TCP socket at ${targetIp}:${DEFAULT_PRINTER_PORT}`);

    // 1. Initialize printer & default codepage (ESC @, ESC t 0)
    client.write(Buffer.from([0x1b, 0x40, 0x1b, 0x74, 0x00]));
    totalBytesWritten += 5;

    // 2. Open Cash Drawer if requested (ESC p 0 25 250)
    if (openCashDrawer) {
      client.write(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
      totalBytesWritten += 5;
    }

    // 3. Print Payload (High-Definition Monochrome Raster Graphics or Plain Text)
    if (rasterData) {
      const rasterBuf = Buffer.from(rasterData, 'base64');
      const bW = bytesWidth || 72; // 576 dots / 8
      const h = height || Math.floor(rasterBuf.length / bW);
      const xL = bW % 256;
      const xH = Math.floor(bW / 256);
      const yL = h % 256;
      const yH = Math.floor(h / 256);

      // ESC/POS GS v 0 (Print raster bit image)
      const rasterHeader = Buffer.from([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
      client.write(Buffer.concat([rasterHeader, rasterBuf]));
      // Feed 3 lines (ESC d 3)
      client.write(Buffer.from([0x1b, 0x64, 0x03]));
      totalBytesWritten += rasterHeader.length + rasterBuf.length + 3;
    } else if (plainText) {
      const textBuf = Buffer.from(plainText + '\n\n', 'utf8');
      client.write(textBuf);
      totalBytesWritten += textBuf.length;
    } else if (order) {
      // Fallback simple ticket
      const fallbackText = `${cafeName || 'LAMOGE'}\nOrder: ${order.invoiceCode || order.id}\nTotal: ${order.total || 0} IQD\n\n\n`;
      const fbBuf = Buffer.from(fallbackText, 'utf8');
      client.write(fbBuf);
      totalBytesWritten += fbBuf.length;
    }

    // 4. Auto Cut (GS V 65 3)
    if (autoCut !== false) {
      client.write(Buffer.from([0x1d, 0x56, 0x41, 0x03]));
      totalBytesWritten += 4;
    }

    client.end();

    const durationMs = Date.now() - startTime;
    console.log(`[Bridge] ✅ Print payload (${totalBytesWritten} bytes) successfully dispatched to ${targetIp} in ${durationMs}ms`);
    return res.json({
      success: true,
      message: `Print payload sent successfully to ${targetIp}`,
      printerIp: targetIp,
      bytesSent: totalBytesWritten,
      durationMs,
    });
  });

  client.on('error', (err) => {
    console.error(`[Bridge] ❌ Connection error to ${targetIp}:${DEFAULT_PRINTER_PORT}:`, err.message);
    client.destroy();
    if (!res.headersSent) {
      return res.status(502).json({
        success: false,
        error: `Could not connect to printer at ${targetIp}:${DEFAULT_PRINTER_PORT} (${err.message}). Verify printer is ON and connected to network.`,
      });
    }
  });

  client.on('timeout', () => {
    console.error(`[Bridge] ⏱️ Timeout connecting to ${targetIp}:${DEFAULT_PRINTER_PORT}`);
    client.destroy();
    if (!res.headersSent) {
      return res.status(504).json({
        success: false,
        error: `Connection timed out connecting to printer at ${targetIp}:${DEFAULT_PRINTER_PORT}.`,
      });
    }
  });
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`🚀 LAMOGE POS ESC/POS Print Bridge server running on http://0.0.0.0:${BRIDGE_PORT}`);
});
