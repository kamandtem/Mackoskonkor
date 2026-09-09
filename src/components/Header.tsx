import React from 'react';
import { ChevronDown, Flame } from 'lucide-react';
import { UserProfile } from '../types/konkur';
import { getCurrentJalaliDate, toPersianDigits } from '../utils/jalali';

interface HeaderProps {
  profile: UserProfile;
  streak: number;
  /** با لمس عکس کاربر باز می‌شود */
  onOpenMenu: () => void;
}

/**
 * هدر فقط یک نقطه‌ی ورود دارد: عکس کاربر.
 * لمس آن منوی اصلی برنامه (شامل تنظیمات) را باز می‌کند.
 */
export const Header: React.FC<HeaderProps> = ({ profile, streak, onOpenMenu }) => {
  const jalali = getCurrentJalaliDate();
  const initial = profile.name.trim().charAt(0) || 'ک';

  return (
    <header className="pt-3 pb-2 px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="باز کردن منو"
        className="w-full flex items-center gap-3 text-right active:scale-[0.99] transition-transform"
      >
        {/* آواتار — کلید باز شدن منو */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[2px] shadow-sm">
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-lg font-black text-indigo-600">
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-black text-slate-800 tracking-tight truncate">
              سلام، {profile.name} 👋
            </h1>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            {jalali.formattedText}
          </p>
        </div>
      </button>
    </header>
  );
};
