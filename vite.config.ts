import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
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
