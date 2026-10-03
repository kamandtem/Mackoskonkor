import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ActivityKind, SessionExtra, SubjectItem } from '../types/konkur';
import { currentTimeMinutes, minutesToTime, timeToMinutes, toPersianDigits } from '../utils/jalali';
import { TimeField } from './TimeField';

const KIND_OPTIONS: { id: ActivityKind; label: string; color: string }[] = [
  { id: 'study', label: 'مطالعه', color: '#7c5cfa' },
  { id: 'class', label: 'کلاس', color: '#ff8a4c' },
  { id: 'other', label: 'سایر', color: '#22c55e' },
];

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  onLogStudy: (
    subjectId: string,
    subjectName: string,
    durationMinutes: number,
    extra: SessionExtra,
  ) => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onLogStudy,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? '');
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<ActivityKind>('study');
  const [startTime, setStartTime] = useState(() => minutesToTime(Math.max(0, currentTimeMinutes() - 90)));
  const [questionCount, setQuestionCount] = useState('');

  // هر بار باز شدن: پیش‌فرض شروع = الان منهای مدت
  useEffect(() => {
    if (isOpen) {
      setStartTime(minutesToTime(Math.max(0, currentTimeMinutes() - (hours * 60 + minutes))));
      setQuestionCount('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // لیست دروس ممکن است تغییر کند (تغییر رشته، بازیابی پشتیبان)
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    if (!sub) {
      setError('اول یک درس انتخاب کن.');
      return;
    }

    const total = hours * 60 + minutes;
    if (total <= 0) {
      setError('مدت زمان باید بیشتر از صفر باشد.');
      return;
    }

    const startMin = timeToMinutes(startTime);
    if (startMin + total > 24 * 60) {
      setError('بازه‌ی جلسه از نیمه‌شب رد می‌شود؛ ساعت شروع یا مدت را اصلاح کن.');
      return;
    }
    const q = parseInt(questionCount.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10);
    onLogStudy(sub.id, sub.name, total, {
      activityType: kind,
      startTime,
      endTime: minutesToTime(Math.min(24 * 60 - 1, startMin + total)),
      questionCount: Number.isFinite(q) && q > 0 ? Math.min(q, 2000) : undefined,
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800">ثبت فعالیت دستی</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">نوع فعالیت</label>
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  className={`py-2.5 rounded-xl text-xs font-black border transition-colors ${
                    kind === k.id ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                  style={kind === k.id ? { backgroundColor: k.color } : undefined}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">انتخاب درس</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
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
              <label className="text-xs font-bold text-slate-600 mb-1 block">ساعت</label>
              <input
                type="number"
                min={0}
                max={12}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">دقیقه</label>
              <input
                type="number"
                min={0}
                max={59}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">ساعت شروع</label>
              <TimeField value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">تعداد تست (اختیاری)</label>
              <input
                type="text"
                inputMode="numeric"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
                placeholder="۰"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center">
            <span className="text-xs font-bold text-indigo-700">
              {toPersianDigits(hours * 60 + minutes)} دقیقه، از {toPersianDigits(startTime)} تا{' '}
              {toPersianDigits(minutesToTime(Math.min(24 * 60 - 1, timeToMinutes(startTime) + hours * 60 + minutes)))}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
            >
              ثبت در آمار
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
