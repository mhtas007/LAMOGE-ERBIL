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
              const { plainText, openCashDrawer, autoCut, cafeName, order } = payload;
              
              const client = new net.Socket();
              client.setTimeout(4000);
              
              client.connect(targetPort, targetIp, () => {
                // Initialize printer
                client.write(Buffer.from([0x1b, 0x40]));
                
                // Open cash drawer if requested
                if (openCashDrawer) {
                  client.write(Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]));
                }
                
                if (plainText) {
                  client.write(Buffer.from(plainText + '\n\n\n', 'utf8'));
                } else if (order) {
                  client.write(Buffer.from([0x1b, 0x61, 0x01])); // center
                  client.write(Buffer.from(`${cafeName || 'MAS CAFE'}\n\n`, 'utf8'));
                  client.write(Buffer.from([0x1b, 0x61, 0x00])); // left
                  client.write(Buffer.from(`Order #${order.invoiceCode || order.id}\n`, 'utf8'));
                  client.write(Buffer.from(`Total: ${order.total || 0} IQD\n\n\n`, 'utf8'));
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
