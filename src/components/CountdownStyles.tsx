import React, { useEffect, useRef, useState } from 'react';
import { toPersianDigits } from '../utils/jalali';
import { CountdownStyle } from '../types/countdown';

export interface CountdownStylesProps {
  daysRemaining: number;
  progressPercent: number;
  examName: string;
  style: CountdownStyle;
}

const pad2 = (n: number) => toPersianDigits(String(Math.max(0, n)).padStart(2, '0'));

/* ====================================================================== */
/* 1. Gradient Ring — حلقه متدرج رنگی                                     */
/* ====================================================================== */
const GradientRingCountdown: React.FC<{ days: number; progress: number }> = ({
  days,
  progress,
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-lg">
        <defs>
          <linearGradient id="grad-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* خط پس‌زمینه */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />

        {/* حلقه پیشرفت */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="url(#grad-ring)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />

        {/* نقطه فعال */}
        <circle
          cx={90 + radius * Math.cos((progress / 100) * 2 * Math.PI - Math.PI / 2)}
          cy={90 + radius * Math.sin((progress / 100) * 2 * Math.PI - Math.PI / 2)}
          r="6"
          fill="#06b6d4"
          opacity="0.9"
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-5xl font-black text-slate-800 leading-none">
          {toPersianDigits(days)}
        </div>
        <div className="text-xs font-bold text-slate-500 mt-1">روز تا کنکور</div>
      </div>
    </div>
  );
};

/* ====================================================================== */
/* 2. Liquid Ring — حلقه سیال                                             */
/* ====================================================================== */
const LiquidRingCountdown: React.FC<{ days: number; progress: number }> = ({
  days,
  progress,
}) => {
  const wavePhase = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      wavePhase.current = (wavePhase.current + 0.04) % (2 * Math.PI);
      setTick((t) => t + 1);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const waveY = 90 + (50 * (progress / 100)) * Math.sin(wavePhase.current) * 0.1;

  return (
    <div className="flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-xl">
        <defs>
          <mask id="liquid-mask">
            <rect width="200" height="200" fill="white" />
            <circle cx="100" cy="100" r="45" fill="black" />
          </mask>
        </defs>

        {/* حلقه‌های پس‌زمینه */}
        {[60, 75, 90].map((r, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            opacity={0.3 - i * 0.05}
          />
        ))}

        {/* سیال */}
        <ellipse cx="100" cy={100 + 40 * (1 - progress / 100)} rx="45" ry="40" fill="#14b8a6" opacity="0.75" />

        {/* سطح سیال */}
        <path
          d={`M 55 ${waveY} Q 72.5 ${waveY - 3} 90 ${waveY} T 125 ${waveY}`}
          fill="#14b8a6"
          opacity="0.9"
        />

        {/* نقاط نورانی */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <circle
              key={angle}
              cx={100 + 50 * Math.cos(rad)}
              cy={100 + 50 * Math.sin(rad)}
              r="5"
              fill="#14b8a6"
              opacity="0.8"
              filter="drop-shadow(0 0 4px #14b8a6)"
            />
          );
        })}

        {/* متن درون */}
        <text
          x="100"
          y="110"
          textAnchor="middle"
          className="fill-white font-black text-2xl"
          dominantBaseline="middle"
        >
          {toPersianDigits(Math.floor(progress))}%
        </text>
      </svg>

      <div className="absolute text-center">
        <div className="text-4xl font-black text-slate-800">{toPersianDigits(days)}</div>
        <div className="text-[11px] font-bold text-slate-500 mt-0.5">روز باقی</div>
      </div>
    </div>
  );
};

/* ====================================================================== */
/* 3. Digital Earth — شمارش رقمی با تصویر زمین                           */
/* ====================================================================== */
const DigitalEarthCountdown: React.FC<{ days: number; hours: number; minutes: number; seconds: number }> = ({
  days,
  hours,
  minutes,
  seconds,
}) => (
  <div
    className="w-full h-60 relative rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-2 text-white font-black bg-cover bg-center shadow-lg"
    style={{ backgroundImage: "url('/earth-countdown.jpg')" }}
  >
    <span className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />

    <div className="relative text-center" dir="ltr">
      <div className="text-6xl font-black tabular-nums drop-shadow-lg">
        {pad2(days)}:{pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
      </div>
      <div className="flex gap-8 justify-center text-xs font-bold text-white/70 mt-2">
        <span>روز</span>
        <span>ساعت</span>
        <span>دقیقه</span>
        <span>ثانیه</span>
      </div>
    </div>
  </div>
);

/* ====================================================================== */
/* 4. Mountain Progress — کوه با مسیر صعود                               */
/* ====================================================================== */
const MountainProgressCountdown: React.FC<{ days: number; progress: number }> = ({
  days,
  progress,
}) => {
  const positions = [0, 25, 50, 75, 100];
  const current = positions.find((p) => p >= progress) ?? 100;
  const idx = positions.indexOf(current);

  return (
    <div className="w-full h-60 relative flex items-end justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-blue-50 to-slate-100 shadow-lg">
      {/* کوه */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mountain-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        <polygon points="0,300 150,80 250,200 400,0 400,300" fill="url(#mountain-grad)" opacity="0.85" />
      </svg>

      {/* مسیر منحنی */}
      <svg className="absolute w-full h-full" viewBox="0 0 400 300">
        <path
          d="M 200 250 Q 150 200, 120 150 T 80 50"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="8"
          opacity={progress > 0 ? 0.7 : 0.2}
        />
      </svg>

      {/* نقاط کاربران در مسیر */}
      {positions.map((p, i) => {
        const t = p / 100;
        const x = 200 - 120 * t + 60 * Math.sin(t * Math.PI);
        const y = 250 - 200 * t;
        return (
          <div
            key={p}
            className={`absolute w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-md transition-all ${
              p <= progress
                ? 'bg-gradient-to-br from-indigo-400 to-purple-500 border-white'
                : 'bg-gray-300 border-gray-400'
            }`}
            style={{ left: `${(x / 400) * 100}%`, top: `${(y / 300) * 100}%` }}
          >
            <span className="text-xs font-black text-white">{100 - p}</span>
          </div>
        );
      })}

      {/* متن نهایی */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <div className="text-sm font-bold text-slate-600">تا رسیدن</div>
      </div>

      {/* روز‌ها */}
      <div className="relative text-center mb-8 z-10">
        <div className="text-5xl font-black text-slate-800">{toPersianDigits(days)}</div>
      </div>
    </div>
  );
};

/* ====================================================================== */
/* 5. Vertical Gauge — مقیاس رأسی                                        */
/* ====================================================================== */
const VerticalGaugeCountdown: React.FC<{ days: number; progress: number }> = ({
  days,
  progress,
}) => {
  const gaugeHeight = 200;
  const fillHeight = (progress / 100) * gaugeHeight;

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-2">
        {/* مقیاس */}
        <div className="w-16 h-64 bg-slate-800 rounded-full border-4 border-slate-700 relative overflow-hidden shadow-inner">
          {/* درجات */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 flex justify-between px-1"
              style={{ top: `${(i / 24) * 100}%` }}
            >
              {i % 6 === 0 && <span className="text-[9px] font-bold text-slate-400">{24 - i}</span>}
              <div className="bg-slate-500 rounded-full" style={{ width: i % 6 === 0 ? '6px' : '3px', height: '1px' }} />
            </div>
          ))}

          {/* سیال */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-400 via-yellow-300 to-yellow-200 rounded-full opacity-85 transition-all duration-500"
            style={{ height: `${fillHeight}px` }}
          />

          {/* درخشش */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-yellow-300 opacity-40 blur-sm transition-all duration-500"
            style={{ height: `${fillHeight * 1.2}px` }}
          />
        </div>

        <span className="text-xs font-bold text-slate-600">روز</span>
      </div>

      {/* متن */}
      <div className="text-center">
        <div className="text-6xl font-black text-yellow-400 drop-shadow-lg">{toPersianDigits(days)}</div>
        <div className="text-sm font-bold text-slate-700 mt-2">روز</div>
        <div className="text-[11px] font-bold text-slate-500 mt-3 w-32">تا پیام کنکور سراسری</div>
      </div>
    </div>
  );
};

/* ====================================================================== */
/* Wrapper — انتخاب نوع خودکار                                            */
/* ====================================================================== */
export const CountdownRenderer: React.FC<CountdownStylesProps> = ({
  daysRemaining,
  progressPercent,
  examName,
  style,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = (() => {
    if (!examName) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, daysRemaining * 86_400_000);
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  })();

  switch (style) {
    case 'gradient-ring':
      return <GradientRingCountdown days={remaining.days} progress={progressPercent} />;
    case 'liquid-ring':
      return <LiquidRingCountdown days={remaining.days} progress={progressPercent} />;
    case 'digital-earth':
      return (
        <DigitalEarthCountdown
          days={remaining.days}
          hours={remaining.hours}
          minutes={remaining.minutes}
          seconds={remaining.seconds}
        />
      );
    case 'mountain-progress':
      return <MountainProgressCountdown days={remaining.days} progress={progressPercent} />;
    case 'vertical-gauge':
      return <VerticalGaugeCountdown days={remaining.days} progress={progressPercent} />;
    default:
      return <GradientRingCountdown days={remaining.days} progress={progressPercent} />;
  }
};
