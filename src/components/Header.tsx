import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, ChevronLeft, Menu, X } from 'lucide-react';
import { toPersianDigits } from '../utils/jalali';

export interface HeaderNotification {
  id: string;
  title: string;
  description: string;
  targetTab: 'planner' | 'exams' | 'progress';
}

interface HeaderProps {
  /** نام برنامه در وسط هدر */
  appName?: string;
  notifications: HeaderNotification[];
  /** با لمس آیکن منو، منوی قوسی باز می‌شود */
  onOpenMenu: () => void;
  /** با لمس آیکن یا نام برنامه به خانه برمی‌گردیم */
  onOpenHome?: () => void;
  onNotificationClick?: (item: HeaderNotification) => void;
  onEnableNotifications?: () => void;
}

/**
 * هدر شناور: زنگوله‌ی اعلان (چپ) + نام برنامه، آیکن برنامه و آیکن منو (راست).
 * زیر نوار وضعیت گوشی می‌نشیند (حاشیه‌ی امن بالا).
 */
export const Header: React.FC<HeaderProps> = ({
  appName = 'کنکور من',
  notifications,
  onOpenMenu,
  onOpenHome,
  onNotificationClick,
  onEnableNotifications,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const count = notifications.length;

  // بستن پنل اعلان با لمس بیرون از آن
  useEffect(() => {
    if (!isPanelOpen) return;
    const onDocPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [isPanelOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 safe-header px-4 pointer-events-none flex justify-center">
      <div
        ref={wrapRef}
        className="pointer-events-auto w-full max-w-md relative"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-2.5 flex items-center justify-between">
          {/* سمت راست: منو، آیکن برنامه، نام برنامه */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="باز کردن منو"
              className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center active:scale-95 transition-all shrink-0"
            >
              <Menu className="w-5 h-5 stroke-[2.6]" />
            </button>

            <button
              type="button"
              onClick={onOpenHome}
              aria-label={appName}
              className="w-11 h-11 rounded-2xl bg-orange-100/70 border border-orange-200 flex items-center justify-center active:scale-95 transition-all shrink-0 overflow-hidden"
            >
              <img src="/branding/puzzle-icon-1024.png" alt="" className="app-logo-fit" />
            </button>

            <button
              type="button"
              onClick={onOpenHome}
              className="text-[17px] font-black text-slate-800 tracking-tight truncate px-1"
            >
              {appName}
            </button>
          </div>

          {/* سمت چپ: زنگوله‌ی اعلان */}
          <button
            type="button"
            onClick={() => setIsPanelOpen((v) => !v)}
            aria-label="اعلان‌ها"
            className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center active:scale-95 transition-all relative shrink-0"
          >
            <Bell className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {toPersianDigits(count > 9 ? '۹+' : count)}
              </span>
            )}
          </button>
        </div>

        {/* پنل اعلان‌ها */}
        {isPanelOpen && (
          <div className="absolute top-full mt-2 left-0 w-[86%] max-w-[320px] bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.16)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800">اعلان‌ها</h3>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                aria-label="بستن"
                className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {onEnableNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && <button type="button" className="notification-enable" onClick={onEnableNotifications}><Bell/><span><b>اعلان‌های دستگاه</b><small>برای یادآوری برنامه‌ها فعالش کن</small></span></button>}

            {count === 0 ? (
              <div className="px-4 py-6 flex flex-col items-center gap-2 text-slate-400">
                <BellOff className="w-6 h-6" />
                <span className="text-[11px] font-bold">اعلان تازه‌ای نیست</span>
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-slate-100">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="notification-item" onClick={()=>{setIsPanelOpen(false);onNotificationClick?.(item)}}>
                      <span><p>{item.title}</p><small>{item.description}</small></span><ChevronLeft />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
