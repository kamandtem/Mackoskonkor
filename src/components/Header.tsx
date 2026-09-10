import React from 'react';
import { Bell, Compass, Flame, Settings, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/konkur';
import { toPersianDigits } from '../utils/jalali';

interface HeaderProps {
  profile: UserProfile;
  streak: number;
  /** با لمس عکس کاربر باز می‌شود */
  onOpenMenu: () => void;
  onOpenSettings?: () => void;
  onOpenSounds?: () => void;
  onOpenArcMenu?: () => void;
  activeSoundName?: string;
}

/**
 * هدر شناور (Floating) — کپسول شیشه‌ای روی محتوا.
 * لمس آواتار منوی اصلی برنامه را باز می‌کند و دکمه‌ی قطب‌نما منوی قوسی را.
 */
export const Header: React.FC<HeaderProps> = ({
  profile,
  streak,
  onOpenMenu,
  onOpenSettings,
  onOpenSounds,
  onOpenArcMenu,
  activeSoundName,
}) => {
  const initial = profile.name.trim().charAt(0) || 'ک';

  return (
    <header className="fixed top-3 left-0 right-0 z-30 pointer-events-none flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-md rounded-[26px] border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] px-4 py-2 flex items-center justify-between transition-all">
        {/* آواتار و سلام — کلید باز شدن منوی اصلی */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="باز کردن منو"
          className="flex items-center gap-3 text-right active:scale-[0.98] transition-transform min-w-0"
        >
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[2px] shadow-sm">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-base font-black text-indigo-600">
                {initial}
              </div>
            </div>

            {streak > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 fill-white" />
                <span>{toPersianDigits(streak)}</span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-black text-slate-800 tracking-tight truncate">
              سلام، {profile.name} 👋
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">هر روز یک قدم به هدفت نزدیک‌تر</span>
            </p>
          </div>
        </button>

        {/* دکمه‌های عملیات */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenArcMenu && (
            <button
              type="button"
              id="btn-header-arc-menu"
              onClick={onOpenArcMenu}
              title="منوی قوسی فعالیت‌ها"
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-50 to-indigo-50 text-pink-600 flex items-center justify-center shadow-2xs border border-pink-100 hover:scale-105 active:scale-95 transition-all relative"
            >
              <Compass className="w-4 h-4 stroke-[2.4]" />
              <span className="w-2 h-2 rounded-full bg-pink-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
            </button>
          )}

          {onOpenSounds && (
            <button
              type="button"
              id="btn-header-sound"
              onClick={onOpenSounds}
              title="صدای تمرکز"
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeSoundName
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              id="btn-header-settings"
              onClick={onOpenSettings}
              title="تنظیمات"
              className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
