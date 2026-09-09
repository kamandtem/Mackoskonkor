import React from 'react';
import { Clock, Flame, Target } from 'lucide-react';
import { formatMinutesShort, toPersianDigits } from '../utils/jalali';

interface StatCardsProps {
  todayStudyMinutes: number;
  dailyGoalMinutes: number;
  streakDays: number;
  goalPct: number;
  onCardClick?: (card: 'study' | 'goal' | 'streak') => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  todayStudyMinutes,
  dailyGoalMinutes,
  streakDays,
  goalPct,
  onCardClick,
}) => (
  <div className="mx-4 my-2 grid grid-cols-3 gap-2.5">
    <Card
      onClick={() => onCardClick?.('study')}
      icon={Clock}
      gradient="from-sky-400 to-blue-500"
      shadow="shadow-blue-200"
      label="مطالعه امروز"
      value={todayStudyMinutes > 0 ? formatMinutesShort(todayStudyMinutes) : '—'}
    />
    <Card
      onClick={() => onCardClick?.('goal')}
      icon={Target}
      gradient="from-amber-300 to-amber-500"
      shadow="shadow-amber-200"
      label="هدف امروز"
      value={formatMinutesShort(dailyGoalMinutes)}
      note={todayStudyMinutes > 0 ? `${toPersianDigits(goalPct)}٪` : undefined}
    />
    <Card
      onClick={() => onCardClick?.('streak')}
      icon={Flame}
      gradient="from-rose-400 to-purple-500"
      shadow="shadow-rose-200"
      label="استریک"
      value={streakDays > 0 ? `${toPersianDigits(streakDays)} روز` : '—'}
    />
  </div>
);

const Card: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
  label: string;
  value: string;
  note?: string;
  onClick: () => void;
}> = ({ icon: Icon, gradient, shadow, label, value, note, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="soft-card p-3 flex flex-col items-center justify-between text-center active:scale-95 transition-transform"
  >
    <div
      className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-sm ${shadow} mb-2`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-[11px] font-medium text-slate-400 mb-0.5">{label}</span>
    <div className="text-xs font-black text-slate-800 leading-tight">
      {value}
      {note && <span className="text-[10px] text-slate-400 font-bold"> ({note})</span>}
    </div>
  </button>
);
