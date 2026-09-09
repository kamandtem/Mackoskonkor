import React, { useMemo } from 'react';
import {
  PERSIAN_MONTHS,
  formatJalaliKeyWithWeekday,
  jalaliMonthLength,
  parseJalaliKey,
  todayJalaliKey,
  toPersianDigits,
} from '../utils/jalali';

interface JalaliDateFieldProps {
  /** کلید شمسی با رقم لاتین: 1405/08/15 */
  value: string;
  onChange: (jalaliKey: string) => void;
  label?: string;
  /** بازه‌ی سال‌های قابل انتخاب نسبت به سال جاری */
  yearsBack?: number;
  yearsForward?: number;
  hint?: string;
}

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

/**
 * انتخاب تاریخ شمسی با سه لیست سال/ماه/روز.
 * از input[type=date] میلادی استفاده نمی‌کنیم چون کاربر ایرانی تاریخ کنکور را
 * شمسی می‌داند و تبدیل ذهنی، منبع اصلی خطای ورودی بود.
 */
export const JalaliDateField: React.FC<JalaliDateFieldProps> = ({
  value,
  onChange,
  label,
  yearsBack = 1,
  yearsForward = 6,
  hint,
}) => {
  const today = parseJalaliKey(todayJalaliKey())!;
  const parsed = parseJalaliKey(value) ?? today;

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = today.jy - yearsBack; y <= today.jy + yearsForward; y++) list.push(y);
    return list;
  }, [today.jy, yearsBack, yearsForward]);

  const daysInMonth = jalaliMonthLength(parsed.jy, parsed.jm);
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const emit = (jy: number, jm: number, jd: number) => {
    // اگر روز انتخاب‌شده در ماه جدید وجود ندارد، به آخرین روز ماه بچسبان
    const safeDay = Math.min(jd, jalaliMonthLength(jy, jm));
    onChange(`${jy}/${pad2(jm)}/${pad2(safeDay)}`);
  };

  const selectClass =
    'flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 appearance-none text-center';

  return (
    <div>
      {label && (
        <label className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</label>
      )}

      <div className="flex items-center gap-2" dir="rtl">
        <select
          aria-label="سال"
          value={parsed.jy}
          onChange={(e) => emit(Number(e.target.value), parsed.jm, parsed.jd)}
          className={selectClass}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {toPersianDigits(y)}
            </option>
          ))}
        </select>

        <select
          aria-label="ماه"
          value={parsed.jm}
          onChange={(e) => emit(parsed.jy, Number(e.target.value), parsed.jd)}
          className={`${selectClass} flex-[1.4]`}
        >
          {PERSIAN_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          aria-label="روز"
          value={parsed.jd}
          onChange={(e) => emit(parsed.jy, parsed.jm, Number(e.target.value))}
          className={selectClass}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {toPersianDigits(d)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-slate-400 font-medium mt-1.5">
        {hint ?? formatJalaliKeyWithWeekday(`${parsed.jy}/${pad2(parsed.jm)}/${pad2(parsed.jd)}`)}
      </p>
    </div>
  );
};
