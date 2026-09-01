/**
 * POS ESC/POS Micro-Bridge Server
 * Runs locally on the cafe network (Cashier PC or Raspberry Pi) to receive print jobs
 * from iPad PWA over HTTP and write raw ESC/POS bytes to the thermal printer on TCP port 9100.
 */
const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const BRIDGE_PORT = 3001;
const DEFAULT_PRINTER_PORT = 9100;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ESC/POS Print Bridge Active' });
});

app.post('/api/print', (req, res) => {
  const { order, cafeName, printerIp, plainText } = req.body;
  const targetIp = printerIp || '192.168.1.100';

  console.log(`[Bridge] Received print job for printer: ${targetIp}:${DEFAULT_PRINTER_PORT}`);

  const client = new net.Socket();
  client.setTimeout(4000);

  client.connect(DEFAULT_PRINTER_PORT, targetIp, () => {
    console.log(`[Bridge] Connected to raw TCP socket at ${targetIp}:${DEFAULT_PRINTER_PORT}`);

    // ESC/POS Commands
    const initCmd = Buffer.from([0x1b, 0x40]); // Initialize printer
    const centerAlign = Buffer.from([0x1b, 0x61, 0x01]);
    const leftAlign = Buffer.from([0x1b, 0x61, 0x00]);
    const cutPaper = Buffer.from([0x1d, 0x56, 0x41, 0x03]); // Full cut with feed

    client.write(initCmd);
    if (plainText) {
      client.write(Buffer.from(plainText, 'utf8'));
    } else {
      client.write(centerAlign);
      client.write(Buffer.from(`${cafeName || 'CAFE'}\n\n`, 'utf8'));
      client.write(leftAlign);
      client.write(Buffer.from(`Order #${order?.invoiceCode || order?.id}\n`, 'utf8'));
      client.write(Buffer.from(`Total: ${order?.total || 0} IQD\n\n\n`, 'utf8'));
    }
    client.write(cutPaper);
    client.end();

    console.log(`[Bridge] Print payload sent successfully to ${targetIp}`);
    res.json({ success: true, message: 'Print job dispatched to printer' });
  });

  client.on('error', (err) => {
    console.error(`[Bridge] Error writing to ${targetIp}:`, err.message);
    client.destroy();
    res.status(500).json({ success: false, error: err.message });
  });

  client.on('timeout', () => {
    console.error(`[Bridge] Timeout connecting to ${targetIp}`);
    client.destroy();
    res.status(504).json({ success: false, error: 'Connection timed out to printer port 9100' });
  });
});

app.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`🚀 ESC/POS Print Bridge server running on http://0.0.0.0:${BRIDGE_PORT}`);
});
