import React from 'react';
import {
  AlertTriangle,
  Check,
  BookOpen,
  ChevronLeft,
  Clock,
  Plus,
  Zap,
} from 'lucide-react';
import { SubjectItem, TaskItem } from '../types/konkur';
import { pickCurrentTask } from '../utils/stats';
import { formatTime, minutesToTime, timeToMinutes, toPersianDigits } from '../utils/jalali';

const FALLBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316'];

const PERIODS = [
  { id: 'dawn', label: 'سحر', icon: '🌙', from: 0, to: 5 * 60, color: '#6366f1' },
  { id: 'morning', label: 'صبح', icon: '🌤️', from: 5 * 60, to: 12 * 60, color: '#f59e0b' },
  { id: 'noon', label: 'ظهر', icon: '☀️', from: 12 * 60, to: 15 * 60, color: '#f97316' },
  { id: 'afternoon', label: 'عصر', icon: '🌇', from: 15 * 60, to: 19 * 60, color: '#ec4899' },
  { id: 'night', label: 'شب', icon: '🌙', from: 19 * 60, to: 24 * 60, color: '#7c3aed' },
];

function hexToRgba(color: string, alpha: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return `rgba(99, 102, 241, ${alpha})`;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface HomeTimelineProps {
  /** فقط کارهای امروز */
  tasks: TaskItem[];
  /** برای رنگ هر درس روی خط زمان */
  subjects?: SubjectItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onViewAllPlanner: () => void;
  onStartFocusSubject: (subjectName: string) => void;
}

export const HomeTimeline: React.FC<HomeTimelineProps> = ({
  tasks,
  subjects = [],
  onToggleTask,
  onAddTask,
  onViewAllPlanner,
  onStartFocusSubject,
}) => {
  const { current, next, isOverdue } = pickCurrentTask(tasks);
  const doneCount = tasks.filter((t) => t.isCompleted).length;

  const colorFor = (task: TaskItem, index: number) =>
    task.color ||
    subjects.find((s) => s.id === task.subjectId)?.color ||
    FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  // کارهای امروز (از قبل مرتب) را بر اساس بخش روز گروه‌بندی کن؛ اندیس سراسری برای یک‌درمیان چیدن
  const groups = PERIODS.map((p) => ({
    ...p,
    items: tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => {
        const m = timeToMinutes(task.startTime);
        return m >= p.from && m < p.to;
      }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-4 my-3 flex flex-col gap-3">
      {/* الان چی بخونم؟ — فقط وقتی برنامه‌ای وجود دارد */}
      {tasks.length > 0 && (
        <div className="soft-card p-4 bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 border border-indigo-100/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md shrink-0 ${
                  isOverdue
                    ? 'bg-amber-500 shadow-amber-200'
                    : 'bg-indigo-600 shadow-indigo-200'
                }`}
              >
                {isOverdue ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5 fill-white" />
                )}
              </div>

              <div className="min-w-0">
                <span className="text-[11px] font-bold text-indigo-600 tracking-wider block">
                  {isOverdue ? 'عقب افتادی' : 'الان چی بخونم؟'}
                </span>

                {current ? (
                  <div className="text-sm font-black text-slate-800 truncate">
                    <span className="text-indigo-600">{current.subjectName}</span>
                    <span className="text-slate-400 font-bold text-xs">
                      {' '}
                      · {formatTime(current.startTime)}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-emerald-600">
                    آفرین! برنامه‌ی امروز کامل شد 🎉
                  </div>
                )}
              </div>
            </div>

            {current && (
              <button
                type="button"
                onClick={() => onStartFocusSubject(current.subjectName)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                <span>شروع</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {next && (
            <div className="mt-2.5 pt-2 border-t border-indigo-100/50 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="truncate">
                بعدی: {next.subjectName} ساعت {formatTime(next.startTime)}
              </span>
              <span className="text-indigo-500 font-bold shrink-0">
                {toPersianDigits(next.durationMinutes)} دقیقه
              </span>
            </div>
          )}
        </div>
      )}

      {/* جدول امروز */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-slate-800">برنامه امروز</h3>
            {tasks.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                {toPersianDigits(doneCount)} از {toPersianDigits(tasks.length)}
              </span>
            )}
          </div>

          {tasks.length > 0 && (
            <button
              type="button"
              onClick={onViewAllPlanner}
              className="text-xs font-bold text-indigo-600 flex items-center gap-0.5 shrink-0"
            >
              <span>مشاهده همه</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">
              هنوز برنامه‌ای برای امروز نداری
            </p>
            <p className="text-xs text-slate-400 mb-4 max-w-[240px] font-medium">
              دروس امروزت را مشخص کن تا جدول زمانی و آمار ساخته شود.
            </p>
            <button
              type="button"
              onClick={onAddTask}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت برنامه امروز</span>
            </button>
          </div>
        ) : (
          <div className="htl" dir="rtl">
            <span className="htl-rail" aria-hidden="true" />
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                <div className="htl-flag" style={{ '--flag': group.color } as React.CSSProperties}>
                  <span>{group.icon}</span>
                  {group.label}
                </div>

                {group.items.map(({ task, index }) => {
                  const isCurrent = current?.id === task.id;
                  const color = colorFor(task, index);
                  const side = index % 2 === 0 ? 'is-start' : 'is-end';
                  const end = minutesToTime(timeToMinutes(task.startTime) + task.durationMinutes);
                  return (
                    <div
                      key={task.id}
                      className={`htl-row ${side} ${task.isCompleted ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                      style={
                        {
                          '--c': color,
                          '--c-soft': hexToRgba(color, 0.12),
                          '--c-mid': hexToRgba(color, 0.28),
                          '--i': index,
                        } as React.CSSProperties
                      }
                    >
                      <button
                        type="button"
                        className="htl-card"
                        onClick={() => onStartFocusSubject(task.subjectName)}
                        disabled={task.isCompleted}
                      >
                        <span className="htl-card-title">
                          <b>{task.subjectName}</b>
                          <ChevronLeft />
                        </span>
                        <span className="htl-card-sub">
                          {toPersianDigits(task.durationMinutes)} دقیقه
                          {task.notes ? ` · ${task.notes}` : task.chapter ? ` · ${task.chapter}` : ''}
                        </span>
                        {isCurrent && <span className="htl-now">الان</span>}
                      </button>

                      <button
                        type="button"
                        className="htl-node"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={task.isCompleted ? 'برگرداندن به انجام‌نشده' : 'علامت انجام شد'}
                      >
                        {task.isCompleted ? <Check /> : null}
                      </button>

                      <span className="htl-time">
                        <b dir="ltr">{formatTime(task.startTime)}</b>
                        <small dir="ltr">تا {formatTime(end)}</small>
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            <span className="htl-hint">برای تیک زدن، روی دایره‌ی وسط بزن</span>
          </div>
        )}
      </div>
    </div>
  );
};
