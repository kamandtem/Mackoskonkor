import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  Plus,
  Zap,
} from 'lucide-react';
import { TaskItem } from '../types/konkur';
import { pickCurrentTask } from '../utils/stats';
import { formatTime, toPersianDigits } from '../utils/jalali';

interface HomeTimelineProps {
  /** فقط کارهای امروز */
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onAddTask: () => void;
  onViewAllPlanner: () => void;
  onStartFocusSubject: (subjectName: string) => void;
}

export const HomeTimeline: React.FC<HomeTimelineProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onViewAllPlanner,
  onStartFocusSubject,
}) => {
  const { current, next, isOverdue } = pickCurrentTask(tasks);
  const doneCount = tasks.filter((t) => t.isCompleted).length;

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
          <div className="relative flex flex-col gap-3">
            <div className="absolute right-[19px] top-3 bottom-3 w-[2px] bg-slate-100 -z-0" />

            {tasks.map((task) => {
              const isCurrent = current?.id === task.id;
              return (
                <div
                  key={task.id}
                  className={`relative z-10 flex items-center justify-between gap-2 p-3 rounded-2xl transition-all ${
                    task.isCompleted
                      ? 'bg-slate-50/70 border border-slate-100 opacity-65'
                      : isCurrent
                        ? 'bg-white border border-indigo-200 shadow-xs ring-1 ring-indigo-100'
                        : 'bg-white border border-slate-100/90 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      aria-label="تغییر وضعیت"
                      className="transition-transform active:scale-90 shrink-0"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.subjectName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          {formatTime(task.startTime)}
                        </span>
                      </div>
                      {task.notes && (
                        <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 shrink-0">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="whitespace-nowrap">
                      {toPersianDigits(task.durationMinutes)} دقیقه
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
