import React, { useState } from 'react';
import { ArrowLeft as ArrowLeftIcon, Calendar, Target, Award, Sparkles as SparklesIcon, Clock, Flame } from 'lucide-react';
import { toPersianDigits, formatMinutesShort } from '../utils/jalali';
import { ConfirmDialog } from './ConfirmDialog';

interface CountdownDialProps {
  daysRemaining: number;
  progressPercent: number;
  examName: string;
  dailyGoalMinutes: number;
  todayStudyMinutes: number;
  streakDays: number;
  goalPct: number;
  onOpenDatePicker: () => void;
  onStatClick?: (card: 'study' | 'goal' | 'streak') => void;
}

export const CountdownDial: React.FC<CountdownDialProps> = ({
  daysRemaining, progressPercent, examName, dailyGoalMinutes, todayStudyMinutes, streakDays, goalPct, onOpenDatePicker, onStatClick,
}) => {
  const [showJourney, setShowJourney] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcDegree = 260;
  const arcLength = (circumference * arcDegree) / 360;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, progressPercent))) / 100;
  const ticks = Array.from({ length: 32 }).map((_, i) => {
    const angle = -220 + (i / 31) * arcDegree;
    const rad = (angle * Math.PI) / 180;
    const tickRadius = radius + 12;
    return { x1: size / 2 + (tickRadius - 5) * Math.cos(rad), y1: size / 2 + (tickRadius - 5) * Math.sin(rad), x2: size / 2 + tickRadius * Math.cos(rad), y2: size / 2 + tickRadius * Math.sin(rad), isMajor: i % 5 === 0 };
  });
  const closeJourney = () => setShowJourney(false);
  const handleJourneyBack = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (showJourney) closeJourney();
    else setConfirmExit(true);
  };
  const handleCardKey = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowJourney(true); }
  };
  const stat = (card: 'study' | 'goal' | 'streak', Icon: typeof Clock, label: string, value: string, note?: string) => (
    <button type="button" className="countdown-inline-stat" onClick={(event) => { event.stopPropagation(); onStatClick?.(card); }}>
      <span className="countdown-inline-icon"><Icon /></span><span className="countdown-inline-label">{label}</span>
      <strong>{value}{note && <small> ({note})</small>}</strong>
    </button>
  );

  return <>
    <div className={`countdown-flip-card-shell ${showJourney ? 'is-flipped' : ''}`}>
      <div className="countdown-flip-card countdown-flip-front" onClick={() => setShowJourney(true)} role="button" tabIndex={0} onKeyDown={handleCardKey}>
        <div className="countdown-card-header" dir="rtl">
          <span><Target /> {examName || 'کنکور سراسری'}</span><button type="button" className="countdown-front-back" onClick={handleJourneyBack} aria-label="خروج از کارت"><ArrowLeftIcon /></button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onOpenDatePicker(); }}><Calendar /><b>تغییر تاریخ</b></button>
        </div>
        <div className="countdown-card-body relative flex flex-col items-center justify-center">
          <div className="relative w-[260px] h-[260px] flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-[40deg]">
              <defs><linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="50%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ec4899"/></linearGradient><filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter></defs>
              <g className="opacity-40">{ticks.map((t, idx) => <line key={idx} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.isMajor ? '#94a3b8' : '#cbd5e1'} strokeWidth={t.isMajor ? 2.5 : 1.5} strokeLinecap="round" />)}</g>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round" className="opacity-70" />
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#countdownGradient)" strokeWidth={strokeWidth} strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" filter="url(#softGlow)" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-[32px] rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 soft-dial-shadow flex flex-col items-center justify-center p-3 border border-white">
              <span className="text-xs font-semibold text-slate-400 mb-0.5">شمارش معکوس</span>
              <div className="flex items-baseline justify-center tracking-tight"><span className="text-6xl font-black text-slate-800 drop-shadow-xs">{toPersianDigits(daysRemaining)}</span></div>
              <span className="text-sm font-bold text-slate-600 -mt-1">{daysRemaining === 0 ? 'امروز روز کنکور است' : 'روز تا کنکور'}</span>
              <div className="mt-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100/80 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs flex items-center gap-1"><Award className="w-3 h-3 text-indigo-500" /><span>{toPersianDigits(progressPercent)}٪ از مسیر طی شده</span></div>
            </div>
          </div>
          <div className="countdown-card-metrics w-full grid grid-cols-2 gap-4">
            <div className="text-center px-2"><div className="text-lg font-black text-slate-800">{toPersianDigits(Math.max(0, Math.ceil(daysRemaining / 7)))} <span className="text-xs font-medium text-slate-500">هفته</span></div><div className="text-[11px] text-slate-400 font-medium">فرصت باقی‌مانده</div></div>
            <div className="text-center px-2"><div className="text-lg font-black text-slate-800">{toPersianDigits(Math.round((daysRemaining * dailyGoalMinutes) / 60))} <span className="text-xs font-medium text-slate-500">ساعت</span></div><div className="text-[11px] text-slate-400 font-medium">ظرفیت مطالعه با هدف فعلی</div></div>
          </div>
          <div className="countdown-inline-stats" dir="rtl">
            {stat('study', Clock, 'مطالعه امروز', todayStudyMinutes > 0 ? formatMinutesShort(todayStudyMinutes) : '—')}
            {stat('goal', Target, 'هدف امروز', formatMinutesShort(dailyGoalMinutes), todayStudyMinutes > 0 ? `${toPersianDigits(goalPct)}٪` : undefined)}
            {stat('streak', Flame, 'استریک', streakDays > 0 ? `${toPersianDigits(streakDays)} روز` : '—')}
          </div>
        </div>
      </div>
      <div className="countdown-flip-card countdown-flip-back" dir="rtl">
        <div className="journey-map-bg" aria-hidden="true" />
        <div className="journey-back-head"><span><SparklesIcon/> مسیر پیشرفت تو</span><button onClick={handleJourneyBack} aria-label="بازگشت"><ArrowLeftIcon/></button></div>
        <div className="journey-copy"><small>هر روزی که می‌گذرد، یک قدم بالاتر</small><strong>{toPersianDigits(Math.round(Math.min(100, Math.max(0, progressPercent))))}٪ از مسیر طی شده</strong><p>موقعیت امروزت روی جاده‌ی قله</p><div className="journey-days-hero">{daysRemaining > 0 ? `${toPersianDigits(daysRemaining)} روز تا قله` : 'امروز روز قله است'}</div></div>
        <JourneyPath progress={progressPercent} />
        <button className="journey-return" onClick={handleJourneyBack}>بازگشت به شمارشگر</button>
      </div>
    </div>
    <ConfirmDialog isOpen={confirmExit} title="از این بخش خارج می‌شوید؟" message="با تأیید، به مرحله قبلی کارت برمی‌گردی." confirmLabel="خروج" cancelLabel="ادامه" onConfirm={() => { setConfirmExit(false); closeJourney(); }} onCancel={() => setConfirmExit(false)} />
  </>;
};

const JourneyPath: React.FC<{ progress: number }> = ({ progress }) => {
  const points = [{ x: 16, y: 88, label: 'شروع' }, { x: 37, y: 68, label: 'پایه' }, { x: 62, y: 48, label: 'پیشروی' }, { x: 78, y: 25, label: 'تمرکز' }, { x: 88, y: 8, label: 'قله' }];
  const clamped = Math.max(0, Math.min(100, progress)); const current = clamped / 100 * (points.length - 1); const idx = Math.min(points.length - 1, Math.floor(current)); const next = points[Math.min(points.length - 1, idx + 1)]; const here = points[idx]; const t = current - idx; const x = idx === points.length - 1 ? here.x : here.x + (next.x - here.x) * t; const y = idx === points.length - 1 ? here.y : here.y + (next.y - here.y) * t;
  return <div className="journey-path"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="journeyFill" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="oklch(69% .16 155)"/><stop offset="1" stopColor="oklch(60% .2 285)"/></linearGradient></defs><path d="M 9 93 C 17 83, 26 84, 32 72 S 55 62, 58 49 S 72 40, 75 27 S 86 17, 91 7" fill="none" stroke="oklch(99% .01 285 / .4)" strokeWidth="5"/><path d="M 9 93 C 17 83, 26 84, 32 72 S 55 62, 58 49 S 72 40, 75 27 S 86 17, 91 7" fill="none" stroke="url(#journeyFill)" strokeWidth="1.7" strokeDasharray="140" strokeDashoffset={140 - (140 * clamped / 100)} /></svg>{points.map((point, i) => <span key={point.label} className={`journey-point ${i <= idx ? 'passed' : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }}><i>{i === points.length - 1 ? '◆' : i + 1}</i><small>{point.label}</small></span>)}<span className="journey-user" style={{ left: `${x}%`, top: `${y}%` }}><span>تو</span></span></div>;
};
