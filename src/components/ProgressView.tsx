import React from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Flame,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { TestDrill, UserProfile } from '../types/konkur';
import { DrillStats, StudyStats } from '../utils/stats';
import {
  formatMinutesShort,
  formatMinutesToPersian,
  toPersianDigits,
} from '../utils/jalali';
import { EmptyState } from './EmptyState';

interface ProgressViewProps {
  stats: StudyStats;
  drillStats: DrillStats;
  drills: TestDrill[];
  profile: UserProfile;
  onStartFocus: () => void;
}

/** همه‌ی اعداد این صفحه از جلسات واقعی کاربر می‌آید. چیزی از پیش پر نشده است. */
export const ProgressView: React.FC<ProgressViewProps> = ({
  stats,
  drillStats,
  profile,
  onStartFocus,
}) => {
  if (!stats.hasAnyData && !drillStats.hasAnyData) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto w-full">
        <EmptyState
          icon={BarChart3}
          title="هنوز آماری نداری"
          description="به محض اینکه اولین جلسه‌ی تمرکز یا تست‌زنی‌ات را ثبت کنی، نمودارها و آمار همین‌جا ساخته می‌شود."
          actionLabel="شروع اولین جلسه تمرکز"
          onAction={onStartFocus}
        />
      </div>
    );
  }

  const maxMinutes = Math.max(...stats.week.map((d) => d.minutes), profile.dailyGoalMinutes, 60);

  return (
    <div className="px-4 py-2 flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      {/* چهار سنجه‌ی اصلی */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Clock}
          iconTone="text-sky-500"
          label="مطالعه امروز"
          value={formatMinutesShort(stats.todayMinutes)}
          note={`${toPersianDigits(stats.goalPct)}٪ از هدف روز`}
          noteTone={stats.goalPct >= 100 ? 'text-emerald-600' : 'text-slate-400'}
        />
        <MetricCard
          icon={TrendingUp}
          iconTone="text-indigo-500"
          label="این هفته"
          value={formatMinutesShort(stats.weekMinutes)}
          note={`میانگین ${formatMinutesShort(stats.weeklyDailyAverage)} در روز`}
          noteTone="text-indigo-500"
        />
        <MetricCard
          icon={Calendar}
          iconTone="text-purple-500"
          label="این ماه"
          value={formatMinutesShort(stats.monthMinutes)}
          note={`${toPersianDigits(stats.sessionsCount)} جلسه ثبت‌شده`}
          noteTone="text-purple-500"
        />
        <MetricCard
          icon={Flame}
          iconTone="text-amber-500"
          label="استریک"
          value={`${toPersianDigits(stats.streak)} روز`}
          note={`رکورد: ${toPersianDigits(stats.longestStreak)} روز`}
          noteTone="text-amber-600"
        />
      </div>

      {/* نمودار هفتگی */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">مطالعه‌ی این هفته</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">شنبه تا جمعه</span>
        </div>

        <div className="flex items-end justify-between h-40 pt-4 px-1 gap-2 border-b border-slate-100 pb-2">
          {stats.week.map((day) => {
            const heightPct = day.minutes > 0 ? Math.max(6, (day.minutes / maxMinutes) * 100) : 0;
            return (
              <div
                key={day.iso}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[10px] font-bold text-slate-400 h-3">
                  {day.minutes > 0 ? toPersianDigits((day.minutes / 60).toFixed(1)) : ''}
                </span>

                <div className="w-full max-w-[28px] h-full flex items-end justify-center bg-slate-100 rounded-t-xl overflow-hidden">
                  {heightPct > 0 && (
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${
                        day.isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                          : 'bg-gradient-to-t from-indigo-300 to-indigo-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  )}
                </div>

                <span
                  className={`text-[11px] font-bold mt-1 ${
                    day.isToday
                      ? 'text-indigo-600'
                      : day.isFuture
                        ? 'text-slate-300'
                        : 'text-slate-500'
                  }`}
                >
                  {day.weekdayName.slice(0, 4)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 font-medium text-center mt-3">
          خط هدف روزانه: {formatMinutesShort(profile.dailyGoalMinutes)}
        </p>
      </div>

      {/* نکات تکمیلی */}
      <div className="soft-card p-4 grid grid-cols-2 gap-3 divide-x divide-slate-100 divide-x-reverse">
        <div className="text-center p-2">
          <span className="text-xs text-slate-400 block mb-1 font-medium">
            طولانی‌ترین جلسه
          </span>
          <div className="text-base font-black text-slate-800">
            {stats.longestSessionMinutes > 0
              ? formatMinutesToPersian(stats.longestSessionMinutes)
              : '—'}
          </div>
        </div>

        <div className="text-center p-2">
          <span className="text-xs text-slate-400 block mb-1 font-medium">
            مجموع کل مطالعه
          </span>
          <div className="text-base font-black text-slate-800">
            {formatMinutesShort(stats.totalMinutes)}
          </div>
        </div>
      </div>

      {/* آمار تست‌زنی */}
      {drillStats.hasAnyData && (
        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-black text-slate-800">تست‌زنی سرعتی</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block mb-0.5">
                میانگین درصد
              </span>
              <div className="text-sm font-black text-slate-800">
                {toPersianDigits(drillStats.averagePercent)}٪
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block mb-0.5">
                بهترین درصد
              </span>
              <div className="text-sm font-black text-emerald-600">
                {toPersianDigits(drillStats.bestPercent)}٪
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block mb-0.5">
                سرعت متوسط
              </span>
              <div className="text-sm font-black text-slate-800">
                {toPersianDigits(drillStats.averageSecondsPerQuestion)} ث
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium text-center mt-3">
            {toPersianDigits(drillStats.totalDrills)} جلسه ·{' '}
            {toPersianDigits(drillStats.totalQuestions)} سؤال
          </p>
        </div>
      )}

      {/* تفکیک دروس */}
      <div className="soft-card p-5">
        <h3 className="text-sm font-black text-slate-800 mb-4">تفکیک مطالعه بر اساس دروس</h3>

        {stats.totalMinutes === 0 ? (
          <p className="text-xs text-slate-400 font-medium text-center py-6">
            هنوز مطالعه‌ای برای هیچ درسی ثبت نشده است.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.subjects
              .filter((s) => s.minutes > 0)
              .map((sub) => (
                <div key={sub.id}>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="text-slate-800 truncate">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 shrink-0">
                      <span>{formatMinutesShort(sub.minutes)}</span>
                      <span className="text-slate-400 font-semibold">
                        ({toPersianDigits(sub.sharePct)}٪)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, sub.sharePct)}%`,
                        backgroundColor: sub.color,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  label: string;
  value: string;
  note: string;
  noteTone: string;
}> = ({ icon: Icon, iconTone, label, value, note, noteTone }) => (
  <div className="soft-card p-4">
    <div className="flex items-center gap-2 mb-2 text-slate-400">
      <Icon className={`w-4 h-4 ${iconTone}`} />
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <div className="text-lg font-black text-slate-800">{value}</div>
    <span className={`text-[10px] font-bold mt-1 block ${noteTone}`}>{note}</span>
  </div>
);
