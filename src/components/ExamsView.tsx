import React, { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, Check, Plus, Trash2, X } from 'lucide-react';
import { MockExam } from '../types/konkur';
import { ExamWithCountdown, withCountdown } from '../utils/stats';
import {
  addDays,
  dateToJalaliKey,
  formatJalaliKeyWithWeekday,
  startOfToday,
  toPersianDigits,
} from '../utils/jalali';
import { JalaliDateField } from './JalaliDateField';
import { EmptyState } from './EmptyState';

interface ExamsViewProps {
  exams: MockExam[];
  onAddExam: (exam: Omit<MockExam, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  /** با true شدن، فرم ثبت آزمون خودکار باز می‌شود (دکمه‌ی + نوار پایین) */
  autoOpenAdd?: boolean;
  onAutoOpenAddHandled?: () => void;
}

const IMPORTANCE: { id: MockExam['importance']; label: string; tone: string }[] = [
  { id: 'high', label: 'خیلی مهم', tone: 'bg-rose-600' },
  { id: 'medium', label: 'متوسط', tone: 'bg-amber-500' },
  { id: 'normal', label: 'معمولی', tone: 'bg-slate-400' },
];

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  onAddExam,
  onDeleteExam,
  autoOpenAdd = false,
  onAutoOpenAddHandled,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dateKey, setDateKey] = useState(() => dateToJalaliKey(addDays(startOfToday(), 14)));
  const [importance, setImportance] = useState<MockExam['importance']>('high');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoOpenAdd) return;
    setTitle('');
    setDateKey(dateToJalaliKey(addDays(startOfToday(), 14)));
    setImportance('high');
    setError(null);
    setIsModalOpen(true);
    onAutoOpenAddHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenAdd]);

  const sorted = useMemo(() => withCountdown(exams), [exams]);
  const upcoming = sorted.filter((e) => !e.isPast);
  const past = sorted.filter((e) => e.isPast).reverse();

  const resetForm = () => {
    setTitle('');
    setDateKey(dateToJalaliKey(addDays(startOfToday(), 14)));
    setImportance('high');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('نام آزمون را وارد کن.');
      return;
    }
    onAddExam({ title: title.trim(), dateJalali: dateKey, importance });
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="px-4 py-2 flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      {/* سربرگ */}
      <div className="soft-card p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-800">آزمون‌های آزمایشی</h3>
              <p className="text-xs text-slate-500 font-medium">
                {upcoming.length > 0
                  ? `${toPersianDigits(upcoming.length)} آزمون پیش‌رو`
                  : 'هنوز آزمونی ثبت نشده'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1 hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت</span>
          </button>
        </div>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="تقویم آزمون‌هایت خالی است"
          description="تاریخ آزمون‌های آزمایشی‌ات را ثبت کن تا شمارش معکوس هر کدام را در خانه ببینی."
          actionLabel="ثبت اولین آزمون"
          onAction={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              {upcoming.map((exam) => (
                <ExamRow key={exam.id} exam={exam} onDelete={onDeleteExam} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black text-slate-400 px-2 mb-2">
                برگزارشده
              </h4>
              <div className="flex flex-col gap-3">
                {past.map((exam) => (
                  <ExamRow key={exam.id} exam={exam} onDelete={onDeleteExam} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* فرم ثبت آزمون */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-800">ثبت آزمون آزمایشی</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="بستن"
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  نام آزمون و مرحله
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError(null);
                  }}
                  placeholder="مثال: قلم‌چی مرحله ۵"
                  maxLength={80}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              <JalaliDateField
                label="تاریخ آزمون (شمسی)"
                value={dateKey}
                onChange={setDateKey}
                yearsBack={0}
                yearsForward={3}
              />

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  اهمیت
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {IMPORTANCE.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setImportance(opt.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        importance === opt.id
                          ? `${opt.tone} text-white`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {importance === opt.id && <Check className="w-3 h-3" />}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
                >
                  ذخیره آزمون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamRow: React.FC<{
  exam: ExamWithCountdown;
  onDelete: (id: string) => void;
}> = ({ exam, onDelete }) => {
  const importanceTone =
    exam.importance === 'high'
      ? 'bg-rose-500'
      : exam.importance === 'medium'
        ? 'bg-amber-500'
        : 'bg-slate-400';

  return (
    <div
      className={`soft-card p-4 flex items-center justify-between gap-3 ${
        exam.isPast ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-10 rounded-full shrink-0 ${importanceTone}`} />
        <div className="min-w-0">
          <h4 className="text-sm font-black text-slate-800 truncate">{exam.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatJalaliKeyWithWeekday(exam.dateJalali)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
            exam.isPast
              ? 'bg-slate-100 text-slate-400'
              : exam.daysRemaining === 0
                ? 'bg-rose-50 text-rose-600'
                : exam.daysRemaining <= 7
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {exam.isPast
            ? `${toPersianDigits(Math.abs(exam.daysRemaining))} روز پیش`
            : exam.daysRemaining === 0
              ? 'امروز!'
              : `${toPersianDigits(exam.daysRemaining)} روز مانده`}
        </span>

        <button
          type="button"
          onClick={() => onDelete(exam.id)}
          aria-label="حذف آزمون"
          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
