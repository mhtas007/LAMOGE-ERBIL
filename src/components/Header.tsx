import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Language } from '../types';
import { Maximize, Minimize, Menu, Wifi, WifiOff, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export const Header: React.FC = () => {
  const { language, setLanguage, user, t, currentPath, navigate, isRtl, theme, toggleTheme } = useAppContext();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="bg-natural-surface border-b border-natural-border h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {currentPath !== 'dashboard' ? (
          <button 
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-natural-accent hover:bg-natural-accent-hover text-natural-dark font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {isRtl ? (
              <span className="flex items-center gap-1.5">
                <span>{t('backToDashboard') || 'گەڕانەوە بۆ سەرەکی'}</span>
                <span className="text-base font-bold">←</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold">←</span>
                <span>{t('backToDashboard') || 'Back to Dashboard'}</span>
              </span>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center p-1 shrink-0 shadow-md">
              <img src="https://zoophagous-red-iaz14a7ary.edgeone.app/logo3331.png" alt="MAS POS" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif font-black text-base sm:text-lg tracking-tight text-natural-text">MAS POS</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`} title={isOnline ? 'Online' : 'Offline'}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <button 
          onClick={toggleFullscreen}
          className="p-2 text-natural-text-tertiary hover:text-natural-text hover:bg-natural-bg rounded-xl transition-colors hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 text-natural-text-tertiary hover:text-natural-text hover:bg-natural-bg rounded-xl transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex bg-natural-bg border border-natural-border p-1 rounded-xl text-xs font-bold">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent border-none text-natural-text-secondary focus:outline-none cursor-pointer py-1 px-2"
          >
            <option value="en">EN</option>
            <option value="ku">KU</option>
            <option value="ar">AR</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3 sm:pl-6 sm:border-l border-natural-border">
          <div className="w-9 h-9 rounded-full bg-natural-accent border border-[#a68668] flex items-center justify-center text-natural-dark font-bold text-sm shadow-inner">
            {user?.name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-col hidden sm:flex">
            <span className="text-sm font-bold text-natural-text leading-tight">
              {user?.name || 'User'}
            </span>
            <span className="text-xs text-natural-text-tertiary font-medium">
              {user?.role ? t(user.role as any) : 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
