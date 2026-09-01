import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import net from 'net';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function thermalPrinterMiddleware() {
  return {
    name: 'thermal-printer-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/print', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const targetIp = (payload.printerIp || '192.168.1.35').trim();
              const targetPort = 9100;
              const { plainText, rasterData, bytesWidth, height, openCashDrawer, autoCut, cafeName, order } = payload;
              
              const client = new net.Socket();
              client.setTimeout(6000);
              
              client.connect(targetPort, targetIp, () => {
                // Initialize printer & default codepage
                client.write(Buffer.from([0x1b, 0x40, 0x1b, 0x74, 0x00]));
                
                // Open cash drawer if requested
                if (openCashDrawer) {
                  client.write(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
                }
                
                if (rasterData) {
                  // High-Definition Monochrome Raster Graphics (Kurdish, Arabic, Logo, WYSIWYG)
                  const rasterBuf = Buffer.from(rasterData, 'base64');
                  const bW = bytesWidth || 72; // 576 dots / 8
                  const h = height || Math.floor(rasterBuf.length / bW);
                  const xL = bW % 256;
                  const xH = Math.floor(bW / 256);
                  const yL = h % 256;
                  const yH = Math.floor(h / 256);
                  
                  const rasterHeader = Buffer.from([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
                  client.write(Buffer.concat([rasterHeader, rasterBuf]));
                  client.write(Buffer.from([0x1b, 0x64, 0x03])); // feed 3 lines
                } else if (plainText) {
                  // Send clean formatted receipt
                  client.write(Buffer.from(plainText + '\n\n', 'utf8'));
                } else if (order) {
                  client.write(Buffer.from([0x1b, 0x61, 0x01, 0x1b, 0x21, 0x30])); // center & large bold
                  client.write(Buffer.from(`${cafeName || 'MAS CAFE'}\n`, 'utf8'));
                  client.write(Buffer.from([0x1b, 0x21, 0x00])); // normal size
                  client.write(Buffer.from(`========================================\n`));
                  client.write(Buffer.from([0x1b, 0x61, 0x00])); // left
                  client.write(Buffer.from(`Order #: ${order.invoiceCode || order.id}\n`));
                  client.write(Buffer.from(`========================================\n`));
                  client.write(Buffer.from([0x1b, 0x21, 0x10])); // double height
                  client.write(Buffer.from(`TOTAL: ${order.total || 0} IQD\n`));
                  client.write(Buffer.from([0x1b, 0x21, 0x00])); // normal
                  client.write(Buffer.from(`========================================\n\n\n`));
                }
                
                // Auto cut
                if (autoCut !== false) {
                  client.write(Buffer.from([0x1d, 0x56, 0x41, 0x03]));
                }
                
                client.end();
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: `Receipt sent to ${targetIp}:9100` }));
              });
              
              client.on('error', (err: any) => {
                client.destroy();
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              });
              
              client.on('timeout', () => {
                client.destroy();
                res.statusCode = 504;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Timeout connecting to printer on Port 9100' }));
              });
            } catch (e: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', service: 'MAS POS Thermal Bridge' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      thermalPrinterMiddleware(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'pos-transactions-queue',
                  options: {
                    maxRetentionTime: 24 * 60, // Retry for up to 24 Hours
                  },
                },
              },
            },
            {
              urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly',
              options: {
                backgroundSync: {
                  name: 'auth-queue',
                  options: {
                    maxRetentionTime: 24 * 60,
                  },
                },
              },
            },
          ],
        },
        manifest: {
          name: 'MAS POS',
          short_name: 'MAS POS',
          start_url: '/',
          display: 'standalone',
          background_color: '#f8f8f8',
          theme_color: '#111111',
          icons: [
            {
              src: '/icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
