import React from 'react';
import { CountdownRenderer } from './CountdownStyles';
import { CountdownStyle } from '../types/countdown';

interface CountdownDialProps {
  daysRemaining: number;
  progressPercent: number;
  examName: string;
  dailyGoalMinutes: number;
  countdownStyle: CountdownStyle;
  onStartFocus: () => void;
  onOpenDatePicker: () => void;
}

/**
 * نمایش ساده‌شده: فقط شمارش معکوس دایره‌ای
 */
export const CountdownDial: React.FC<CountdownDialProps> = ({
  daysRemaining,
  progressPercent,
  examName,
  countdownStyle,
  onStartFocus,
  onOpenDatePicker,
}) => {
  return (
    <section className="px-4 py-5">
      {/* دکمه‌های سرپلکه */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onOpenDatePicker}
          className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs active:scale-95 transition-all"
        >
          📅 تغییر تاریخ
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
        >
          🎓 کنکور سراسری
        </button>
      </div>

      {/* شمارش معکوس */}
      <button
        type="button"
        onClick={onOpenDatePicker}
        className="w-full active:scale-[0.99] transition-transform"
        title="برای تغییر تاریخ لمس کنید"
      >
        <CountdownRenderer
          daysRemaining={daysRemaining}
          progressPercent={progressPercent}
          examName={examName}
          style={countdownStyle}
        />
      </button>

      {/* دکمه شروع */}
      <button
        type="button"
        onClick={onStartFocus}
        className="mt-5 w-full py-3.5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-all"
      >
        ▶ شروع جلسه تمرکز (پومودورو)
      </button>
    </section>
  );
};
