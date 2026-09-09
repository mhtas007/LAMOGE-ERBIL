import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get local IPv4 address on Wi-Fi / Ethernet
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal loopback and IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        // Prefer standard 192.168.x.x or 10.x.x.x
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          candidates.unshift(iface.address);
        } else {
          candidates.push(iface.address);
        }
      }
    }
  }

  return candidates[0] || 'localhost';
}

const localIp = getLocalIp();
const PORT = 3000;
const ipadUrl = `http://${localIp}:${PORT}`;
const localUrl = `http://localhost:${PORT}`;

async function main() {
  console.clear();
  console.log('\n');
  console.log('========================================================================');
  console.log('           LAMOGE CAFE POS - بنکەی سەرەکی (MAIN SERVER BASE)          ');
  console.log('========================================================================');
  console.log(`  [✓] کۆمپیوتەری سەرەکی (This PC):    ${localUrl}`);
  console.log(`  [✓] لینکی ئایپاد (iPad / Mobile):     ${ipadUrl}`);
  console.log('========================================================================\n');

  try {
    // Generate ASCII QR code in terminal
    const terminalQr = await QRCode.toString(ipadUrl, { type: 'terminal', small: true });
    console.log('  بۆ بەستنەوەی ئایپاد، ئەم بارکۆدە (QR Code) بە کامێرای ئایپادەکە سکان بکە:');
    console.log('  (Scan this QR Code with iPad camera to connect directly)\n');
    console.log(terminalQr);
  } catch (err) {
    // Terminal QR fallback
  }

  // Generate HTML QR page
  try {
    const qrDataUrl = await QRCode.toDataURL(ipadUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بەستنەوەی ئایپاد بە بنکەی سەرەکی - LAMOGE POS</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      margin: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 28px;
      padding: 36px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    p.subtitle {
      margin: 0 0 24px 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
    }
    .qr-container {
      background: #f8fafc;
      padding: 18px;
      border-radius: 20px;
      display: inline-block;
      border: 2px dashed #cbd5e1;
      margin-bottom: 20px;
    }
    .qr-container img {
      width: 250px;
      height: 250px;
      display: block;
    }
    .url-box {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 16px;
      font-family: monospace;
      font-weight: bold;
      color: #0f172a;
      direction: ltr;
      word-break: break-all;
      margin-bottom: 20px;
    }
    .steps {
      text-align: right;
      background: #f8fafc;
      border-radius: 16px;
      padding: 16px 20px;
      font-size: 13px;
      line-height: 1.8;
      color: #334155;
      margin-bottom: 20px;
    }
    .steps ol {
      margin: 0;
      padding-right: 20px;
    }
    .btn-open {
      display: block;
      width: 100%;
      background: #0f172a;
      color: #ffffff;
      text-decoration: none;
      padding: 14px;
      border-radius: 14px;
      font-weight: bold;
      font-size: 15px;
      transition: background 0.2s;
      box-sizing: border-box;
    }
    .btn-open:hover {
      background: #334155;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● سێرڤەری سەرەکی چالاکە (Active)</div>
    <h1>LAMOGE CAFE POS</h1>
    <p class="subtitle">سیستەمی سەرەکی کافێ لەسەر ئەم کۆمپیوتەرە ئامادەیە</p>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="iPad Connection QR Code" />
    </div>

    <div class="url-box">${ipadUrl}</div>

    <div class="steps">
      <div style="font-weight: bold; margin-bottom: 6px; color: #0f172a;">ڕێنمایی بۆ ئایپاد (iPad):</div>
      <ol>
        <li>دڵنیابە ئایپادەکەت لەسەر <b>هەمان وایفای (Wi-Fi)</b> ئەم کۆمپیوتەرەیە.</li>
        <li>کامێرای ئایپادەکەت بگرە لەسەر ئەم بارکۆدە بۆ کردنەوەی ڕاستەوخۆ.</li>
        <li>یاخود لە Safari ئەم بەستەرە بنووسە: <span style="direction:ltr; display:inline-block; font-family:monospace; font-weight:bold;">${ipadUrl}</span></li>
      </ol>
    </div>

    <a href="${localUrl}" target="_blank" class="btn-open">کردنەوەی سیستەم لەم کۆمپیوتەرە (Open POS Here)</a>
  </div>
</body>
</html>`;

    const htmlPath = path.join(__dirname, 'iPad_Connect.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    // Automatically open the QR guide in the default browser
    if (process.platform === 'win32') {
      exec(`start "" "${htmlPath}"`);
    }
  } catch (err) {
    console.error('Error generating QR page:', err);
  }

  console.log('\n========================================================================');
  console.log('  ئەم پەنجەرەیە دامەخە بە درێژایی کاتی کارکردنی کافێکە.');
  console.log('  Keep this window OPEN while the cafe is running.');
  console.log('========================================================================\n');

  // Launch Vite
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const viteProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  viteProcess.on('error', (err) => {
    console.error('Failed to start POS server:', err);
  });
}

main();
