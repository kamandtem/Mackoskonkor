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
 * نمایش عداد شمارش معکوس با یکی از ۵ سبک
 */
export const CountdownDial: React.FC<CountdownDialProps> = ({
  daysRemaining,
  progressPercent,
  examName,
  dailyGoalMinutes,
  countdownStyle,
  onStartFocus,
  onOpenDatePicker,
}) => {
  return (
    <section className="px-4 py-6">
      <button
        type="button"
        onClick={onOpenDatePicker}
        className="w-full active:scale-[0.99] transition-transform"
        title="برای تغییر تاریخ کنکور لمس کنید"
      >
        <CountdownRenderer
          daysRemaining={daysRemaining}
          progressPercent={progressPercent}
          examName={examName}
          style={countdownStyle}
        />
      </button>

      <button
        type="button"
        onClick={onStartFocus}
        className="mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-200 active:scale-95 transition-all"
      >
        شروع مطالعه
      </button>
    </section>
  );
};
