import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import {
  PERSIAN_MONTHS,
  formatJalaliKeyWithWeekday,
  jalaliMonthLength,
  parseJalaliKey,
  todayJalaliKey,
  toPersianDigits,
} from '../utils/jalali';
import { PickerSheet, WheelColumn, WheelOption } from './WheelPicker';

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
const toKey = (jy: number, jm: number, jd: number) =>
  `${jy}/${pad2(jm)}/${pad2(Math.min(jd, jalaliMonthLength(jy, jm)))}`;

/**
 * انتخاب تاریخ شمسی با شیت چرخ‌دار (روز / ماه / سال).
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

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(parsed);

  const years = useMemo<WheelOption<number>[]>(() => {
    let from = today.jy - yearsBack;
    let to = today.jy + yearsForward;
    // اگر مقدار ذخیره‌شده خارج از بازه است، بازه را گسترش بده تا گم نشود
    from = Math.min(from, parsed.jy, draft.jy);
    to = Math.max(to, parsed.jy, draft.jy);
    const list: WheelOption<number>[] = [];
    for (let y = from; y <= to; y++) list.push({ value: y, label: toPersianDigits(y) });
    return list;
  }, [today.jy, yearsBack, yearsForward, parsed.jy, draft.jy]);

  const months = useMemo<WheelOption<number>[]>(
    () => PERSIAN_MONTHS.map((m, i) => ({ value: i + 1, label: m })),
    [],
  );

  const daysInMonth = jalaliMonthLength(draft.jy, draft.jm);
  const days = useMemo<WheelOption<number>[]>(
    () => Array.from({ length: daysInMonth }, (_, i) => ({ value: i + 1, label: toPersianDigits(i + 1) })),
    [daysInMonth],
  );

  const setPart = (part: Partial<typeof draft>) => {
    setDraft((d) => {
      const next = { ...d, ...part };
      next.jd = Math.min(next.jd, jalaliMonthLength(next.jy, next.jm));
      return next;
    });
  };

  const openSheet = () => {
    setDraft(parseJalaliKey(value) ?? today);
    setOpen(true);
  };

  const draftKey = toKey(draft.jy, draft.jm, draft.jd);
  const currentKey = toKey(parsed.jy, parsed.jm, parsed.jd);

  return (
    <div>
      {label && <span className="text-xs font-bold text-slate-600 mb-1.5 block">{label}</span>}

      <button type="button" className="picker-trigger" onClick={openSheet} dir="rtl">
        <span className="picker-trigger-icon">
          <CalendarDays />
        </span>
        <span className="picker-trigger-text">
          <b>
            {toPersianDigits(parsed.jd)} {PERSIAN_MONTHS[parsed.jm - 1]} {toPersianDigits(parsed.jy)}
          </b>
          <small>{hint ?? formatJalaliKeyWithWeekday(currentKey).split(' ')[0]}</small>
        </span>
        <ChevronDown className="picker-trigger-caret" />
      </button>

      <PickerSheet
        open={open}
        title={label ?? 'انتخاب تاریخ'}
        preview={formatJalaliKeyWithWeekday(draftKey) + ' ' + toPersianDigits(draft.jy)}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onChange(draftKey);
          setOpen(false);
        }}
        shortcut={{ label: 'امروز', onClick: () => setDraft(today) }}
      >
        <WheelColumn ariaLabel="روز" options={days} value={draft.jd} onChange={(jd) => setPart({ jd })} />
        <WheelColumn
          ariaLabel="ماه"
          options={months}
          value={draft.jm}
          onChange={(jm) => setPart({ jm })}
          primary
          grow={1.7}
        />
        <WheelColumn ariaLabel="سال" options={years} value={draft.jy} onChange={(jy) => setPart({ jy })} grow={1.2} />
      </PickerSheet>
    </div>
  );
};
