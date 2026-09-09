import React from 'react';
import { Bookmark, Calendar, ChevronLeft } from 'lucide-react';
import { ExamWithCountdown } from '../utils/stats';
import { formatJalaliKeyWithWeekday, toPersianDigits } from '../utils/jalali';

interface UpcomingExamCardProps {
  exam: ExamWithCountdown | null;
  onViewAllExams: () => void;
}

/** شمارش معکوس این کارت واقعی است و از تاریخ ثبت‌شده‌ی آزمون محاسبه می‌شود */
export const UpcomingExamCard: React.FC<UpcomingExamCardProps> = ({
  exam,
  onViewAllExams,
}) => {
  if (!exam) return null;

  const urgent = exam.daysRemaining <= 7;

  return (
    <button
      type="button"
      onClick={onViewAllExams}
      className="mx-4 my-2 soft-card p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-100/80 text-right active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-purple-200 shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-bold text-purple-600 tracking-wider">
              نزدیک‌ترین آزمون آزمایشی
            </span>
            <h4 className="text-sm font-black text-slate-800 truncate">{exam.title}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatJalaliKeyWithWeekday(exam.dateJalali)}</span>
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap ${
                  urgent
                    ? 'text-rose-600 bg-rose-100/80'
                    : 'text-purple-600 bg-purple-100/80'
                }`}
              >
                {exam.daysRemaining === 0
                  ? 'امروز!'
                  : `${toPersianDigits(exam.daysRemaining)} روز مانده`}
              </span>
            </div>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-white text-slate-600 flex items-center justify-center shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
