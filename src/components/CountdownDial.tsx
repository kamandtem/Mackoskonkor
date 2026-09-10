import React from 'react';
import { Play, Calendar, Target, Award } from 'lucide-react';
import { toPersianDigits } from '../utils/jalali';

interface CountdownDialProps {
  daysRemaining: number;
  progressPercent: number;
  examName: string;
  /** برای محاسبه‌ی ظرفیت مطالعه‌ی باقی‌مانده بر اساس هدف واقعی کاربر */
  dailyGoalMinutes: number;
  onStartFocus: () => void;
  onOpenDatePicker: () => void;
}

export const CountdownDial: React.FC<CountdownDialProps> = ({
  daysRemaining,
  progressPercent,
  examName,
  dailyGoalMinutes,
  onStartFocus,
  onOpenDatePicker,
}) => {
  // Circular arc calculation for SVG
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc of 260 degrees (leaving open bottom arc like reference thermostat)
  const arcDegree = 260;
  const arcLength = (circumference * arcDegree) / 360;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, progressPercent))) / 100;

  // Generate tick marks around the dial like reference
  const totalTicks = 32;
  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    const angle = -220 + (i / (totalTicks - 1)) * arcDegree;
    const rad = (angle * Math.PI) / 180;
    const tickRadius = radius + 12;
    const x1 = size / 2 + (tickRadius - 5) * Math.cos(rad);
    const y1 = size / 2 + (tickRadius - 5) * Math.sin(rad);
    const x2 = size / 2 + tickRadius * Math.cos(rad);
    const y2 = size / 2 + tickRadius * Math.sin(rad);
    const isMajor = i % 5 === 0;
    return { x1, y1, x2, y2, isMajor };
  });

  return (
    <div className="mx-4 my-2 soft-card p-5 relative overflow-hidden">
      {/* Subtle top indicator / tag */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-indigo-500" />
          {examName}
        </span>
        <button
          onClick={onOpenDatePicker}
          className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
        >
          <Calendar className="w-3 h-3" />
          <span>تغییر تاریخ</span>
        </button>
      </div>

      {/* Main Thermostat / Countdown Dial Container */}
      <div className="relative flex flex-col items-center justify-center my-2">
        {/* SVG Circular Dial */}
        <div className="relative w-[260px] h-[260px] flex items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-[40deg]"
          >
            <defs>
              <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Tick Marks */}
            <g className="opacity-40">
              {ticks.map((t, idx) => (
                <line
                  key={idx}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? '#94a3b8' : '#cbd5e1'}
                  strokeWidth={t.isMajor ? 2.5 : 1.5}
                  strokeLinecap="round"
                />
              ))}
            </g>

            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
              className="opacity-70"
            />

            {/* Active Progress Glowing Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#countdownGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter="url(#softGlow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Dial Face (Soft elevated circle) */}
          <div className="absolute inset-[32px] rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 soft-dial-shadow flex flex-col items-center justify-center p-3 border border-white">
            {/* Small label */}
            <span className="text-xs font-semibold text-slate-400 mb-0.5">
              شمارش معکوس
            </span>

            {/* Huge Number */}
            <div className="flex items-baseline justify-center tracking-tight">
              <span className="text-6xl font-black text-slate-800 drop-shadow-xs">
                {toPersianDigits(daysRemaining)}
              </span>
            </div>

            {/* واحد */}
            <span className="text-sm font-bold text-slate-600 -mt-1">
              {daysRemaining === 0 ? 'امروز روز کنکور است' : 'روز تا کنکور'}
            </span>

            {/* Progress Badge */}
            <div className="mt-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100/80 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs flex items-center gap-1">
              <Award className="w-3 h-3 text-indigo-500" />
              <span>{toPersianDigits(progressPercent)}٪ از مسیر طی شده</span>
            </div>
          </div>
        </div>

        {/* دو سنجه‌ی پایین — بر اساس هدف روزانه‌ی خودِ کاربر، نه عدد ثابت */}
        <div className="w-full grid grid-cols-2 gap-4 mt-3 pt-2 border-t border-slate-100">
          <div className="text-center px-2">
            <div className="text-lg font-black text-slate-800">
              {toPersianDigits(Math.max(0, Math.ceil(daysRemaining / 7)))}{' '}
              <span className="text-xs font-medium text-slate-500">هفته</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">فرصت باقی‌مانده</div>
          </div>

          <div className="text-center px-2 border-r border-slate-100">
            <div className="text-lg font-black text-slate-800">
              {toPersianDigits(Math.round((daysRemaining * dailyGoalMinutes) / 60))}{' '}
              <span className="text-xs font-medium text-slate-500">ساعت</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              ظرفیت مطالعه با هدف فعلی
            </div>
          </div>
        </div>

        {/* Tactile Central Action Button (Inspired by reference bottom power/fingerprint cutout) */}
        <div className="mt-4 w-full flex justify-center">
          <button
            id="btn-quick-focus"
            onClick={onStartFocus}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 soft-button hover:brightness-105 active:scale-98 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
            </div>
            <span>شروع جلسه تمرکز (پومودورو)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
