import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Battery, BatteryFull, BatteryMedium, BatteryLow, BatteryCharging, Clock, CalendarDays, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const { language, isRtl } = useAppContext();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatDate = (date: Date) => {
    if (language === 'ku') {
      const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
      const months = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
      return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]}`;
    }
    return date.toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    if (language === 'ku') {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'ئێوارە' : 'بەیانی';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
    return date.toLocaleTimeString(isRtl ? 'ar-IQ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="w-3.5 h-3.5 text-white/50" />;
    if (isCharging) return <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />;
    if (batteryLevel > 80) return <BatteryFull className="w-3.5 h-3.5 text-white" />;
    if (batteryLevel > 30) return <BatteryMedium className="w-3.5 h-3.5 text-white/90 font-bold" />;
    return <BatteryLow className="w-3.5 h-3.5 text-rose-400" />;
  };

  return (
    <div className={`hidden sm:flex bg-black text-white/90 h-10 items-center justify-between px-6 text-[11px] font-medium tracking-wider z-50 print:hidden border-b border-white/10 shadow-md pt-[env(safe-area-inset-top,0px)] ${isRtl ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition-colors ${isOnline ? 'bg-emerald-500/20 text-emerald-400 shadow-inner border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 shadow-inner border border-rose-500/20'}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="mt-[1px]">{isOnline ? (language === 'ku' ? 'ئۆنلاین (بەهێڵ)' : isRtl ? 'متصل' : 'Online') : (language === 'ku' ? 'ئۆفلاین (بێ هێڵ)' : isRtl ? 'غیر متصل' : 'Offline')}</span>
        </div>

        {batteryLevel !== null && (
          <div className="flex items-center gap-2 text-white/90">
            {getBatteryIcon()}
            <span className="mt-[1px]">{batteryLevel}%</span>
            {isCharging && <Zap className="w-3 h-3 text-amber-400" />}
          </div>
        )}
      </div>

      <div className={`flex items-center gap-5 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-[#b89574]" />
          <span className="mt-[1px] text-white/80">{formatDate(time)}</span>
        </div>
        <div className="flex items-center gap-2 bg-natural-surface/10 px-3 py-1.5 rounded-lg text-white border border-white/10 shadow-inner flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#b89574]" />
          <span className="mt-[1px] tabular-nums">{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
};
