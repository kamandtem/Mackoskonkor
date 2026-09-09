import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SubjectItem } from '../types/konkur';
import { toPersianDigits } from '../utils/jalali';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectItem[];
  onLogStudy: (subjectId: string, subjectName: string, durationMinutes: number) => void;
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

    onLogStudy(sub.id, sub.name, total);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800">ثبت مطالعه دستی</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
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

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center">
            <span className="text-xs font-bold text-indigo-700">
              مدت زمان قابل ثبت: {toPersianDigits(hours * 60 + minutes)} دقیقه
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
