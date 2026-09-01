import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for Offline Support
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to the user to reload the page when an update is ready
    if (confirm("نوێکردنەوەیەکی نوێ هەیە بۆ سیستەمەکە، ئایا دەتەوێت ئێستا نوێی بکەیتەوە؟ (New update available, reload?)")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline / ئامادەیە بۆ کارکردن بێ ئینتەرنێت');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
