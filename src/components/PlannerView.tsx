import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { SubjectItem, TaskItem } from '../types/konkur';
import { SubjectStat, tasksForDay, tomorrowJalaliKey } from '../utils/stats';
import {
  formatJalaliKeyWithWeekday,
  formatMinutesShort,
  formatTime,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
  todayJalaliKey,
  toPersianDigits,
} from '../utils/jalali';
import { EmptyState } from './EmptyState';

interface PlannerViewProps {
  tasks: TaskItem[];
  subjects: SubjectItem[];
  subjectStats: SubjectStat[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  tasks,
  subjects,
  subjectStats,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const todayKey = todayJalaliKey();
  const tomorrowKey = tomorrowJalaliKey();

  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id ?? '');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newDuration, setNewDuration] = useState(50);
  const [newNotes, setNewNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeKey = selectedDay === 'today' ? todayKey : tomorrowKey;

  // فیلتر واقعی بر اساس تاریخ — پیش‌تر هر دو تب یک لیست را نشان می‌دادند
  const dayTasks = useMemo(() => tasksForDay(tasks, activeKey), [tasks, activeKey]);
  const plannedMinutes = dayTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const doneCount = dayTasks.filter((t) => t.isCompleted).length;

  const openAdd = () => {
    setError(null);
    // ساعت پیشنهادی: بعد از آخرین کار همان روز
    const last = dayTasks[dayTasks.length - 1];
    setNewStartTime(
      last ? minutesToTime(timeToMinutes(last.startTime) + last.durationMinutes + 15) : '09:00',
    );
    if (subjects.length > 0 && !subjects.some((s) => s.id === newSubjectId)) {
      setNewSubjectId(subjects[0].id);
    }
    setIsAddOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = subjects.find((s) => s.id === newSubjectId);
    if (!subject) {
      setError('اول یک درس انتخاب کن.');
      return;
    }
    onAddTask({
      subjectId: subject.id,
      subjectName: subject.name,
      dateStr: activeKey,
      startTime: normalizeTime(newStartTime),
      durationMinutes: Math.max(5, newDuration),
      isCompleted: false,
      notes: newNotes.trim() || undefined,
    });
    setNewNotes('');
    setIsAddOpen(false);
  };

  if (subjects.length === 0) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto w-full">
        <EmptyState
          icon={Target}
          title="هنوز درسی نداری"
          description="از منو به تنظیمات برو و رشته‌ات را انتخاب کن تا دروس اضافه شوند."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      {/* انتخاب روز */}
      <div className="soft-card p-1.5 flex items-center gap-1">
        {(['today', 'tomorrow'] as const).map((day) => {
          const key = day === 'today' ? todayKey : tomorrowKey;
          const count = tasksForDay(tasks, key).length;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{day === 'today' ? 'امروز' : 'فردا'}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 rounded-full ${
                    selectedDay === day ? 'bg-white/25' : 'bg-slate-100'
                  }`}
                >
                  {toPersianDigits(count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* هدف هفتگی دروس */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800">هدف هفتگی دروس</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">شنبه تا جمعه</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {subjectStats.map((sub) => (
            <div key={sub.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5 gap-1">
                <span className="text-xs font-bold text-slate-700 truncate">{sub.name}</span>
                <span className="text-[11px] font-bold text-indigo-600 shrink-0">
                  {toPersianDigits(Math.round((sub.weeklyMinutes / 60) * 10) / 10)} /{' '}
                  {toPersianDigits(sub.weeklyGoalHours)} س
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sub.weeklyGoalPct}%`,
                    backgroundColor: sub.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* جدول زمانی روز انتخابی */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700 shrink-0" />
              <span className="truncate">{formatJalaliKeyWithWeekday(activeKey)}</span>
            </h3>
            {dayTasks.length > 0 && (
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {toPersianDigits(doneCount)} از {toPersianDigits(dayTasks.length)} انجام‌شده ·
                مجموع {formatMinutesShort(plannedMinutes)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن</span>
          </button>
        </div>

        {dayTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-slate-600 mb-1">
              برنامه‌ی {selectedDay === 'today' ? 'امروز' : 'فردا'} خالی است
            </p>
            <p className="text-xs text-slate-400 font-medium mb-4">
              دروس و ساعت‌هایت را اضافه کن تا جدول زمانی ساخته شود.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن درس</span>
            </button>
          </div>
        ) : (
          <div className="relative flex flex-col gap-3">
            <div className="absolute right-[19px] top-3 bottom-3 w-[2px] bg-slate-100 -z-0" />

            {dayTasks.map((task) => (
              <div
                key={task.id}
                className={`relative z-10 flex items-center justify-between gap-2 p-3.5 rounded-2xl transition-all ${
                  task.isCompleted
                    ? 'bg-slate-50 border border-slate-100 opacity-60'
                    : 'bg-white border border-slate-100 shadow-2xs'
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
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{task.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl whitespace-nowrap">
                    {toPersianDigits(task.durationMinutes)} دقیقه
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="حذف"
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* فرم افزودن */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-slate-800">افزودن درس به برنامه</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="بستن"
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              برای {formatJalaliKeyWithWeekday(activeKey)}
            </p>

            <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">درس</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    ساعت شروع
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    مدت (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 30)}
                    min={5}
                    max={600}
                    step={5}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  مبحث یا توضیح (اختیاری)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="مثال: تست‌های حرکت‌شناسی"
                  maxLength={200}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
                >
                  ثبت در برنامه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
