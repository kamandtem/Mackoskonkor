import React, { useMemo, useState } from 'react';
import { ChevronDown, Clock3 } from 'lucide-react';
import { normalizeTime, toPersianDigits } from '../utils/jalali';
import { PickerSheet, WheelColumn, WheelOption } from './WheelPicker';

interface TimeFieldProps {
  /** HH:MM با رقم لاتین */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** گام دقیقه‌ها؛ پیش‌فرض ۱ */
  minuteStep?: number;
  className?: string;
}

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

const partOfDay = (h: number) =>
  h < 5 ? 'بامداد' : h < 12 ? 'صبح' : h < 14 ? 'ظهر' : h < 18 ? 'عصر' : 'شب';

/** انتخاب ساعت با شیت چرخ‌دار ساعت/دقیقه — جایگزین input[type=time] */
export const TimeField: React.FC<TimeFieldProps> = ({ value, onChange, label, minuteStep = 1, className }) => {
  const [h0, m0] = normalizeTime(value, '09:00').split(':').map(Number);
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(h0);
  const [m, setM] = useState(m0);

  const hours = useMemo<WheelOption<number>[]>(
    () => Array.from({ length: 24 }, (_, i) => ({ value: i, label: toPersianDigits(pad2(i)) })),
    [],
  );
  const minutes = useMemo<WheelOption<number>[]>(() => {
    const list: WheelOption<number>[] = [];
    for (let i = 0; i < 60; i += minuteStep) list.push({ value: i, label: toPersianDigits(pad2(i)) });
    if (!list.some((o) => o.value === m)) {
      list.push({ value: m, label: toPersianDigits(pad2(m)) });
      list.sort((a, b) => a.value - b.value);
    }
    return list;
  }, [minuteStep, m]);

  const openSheet = () => {
    setH(h0);
    setM(m0);
    setOpen(true);
  };

  return (
    <>
      <button type="button" className={`picker-trigger is-time ${className ?? ''}`} onClick={openSheet} dir="rtl">
        <span className="picker-trigger-icon">
          <Clock3 />
        </span>
        <span className="picker-trigger-text">
          <b dir="ltr">{toPersianDigits(`${pad2(h0)}:${pad2(m0)}`)}</b>
          <small>{partOfDay(h0)}</small>
        </span>
        <ChevronDown className="picker-trigger-caret" />
      </button>

      <PickerSheet
        open={open}
        title={label ?? 'انتخاب ساعت'}
        preview={
          <>
            <span dir="ltr">{toPersianDigits(`${pad2(h)}:${pad2(m)}`)}</span> {partOfDay(h)}
          </>
        }
        wheelsDir="ltr"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onChange(`${pad2(h)}:${pad2(m)}`);
          setOpen(false);
        }}
        shortcut={{
          label: 'الان',
          onClick: () => {
            const now = new Date();
            setH(now.getHours());
            setM(Math.floor(now.getMinutes() / minuteStep) * minuteStep);
          },
        }}
      >
        <WheelColumn ariaLabel="ساعت" options={hours} value={h} onChange={(v: number) => setH(v)} primary unit="ساعت" />
        <span className="wheel-colon" aria-hidden="true">:</span>
        <WheelColumn ariaLabel="دقیقه" options={minutes} value={m} onChange={(v: number) => setM(v)} primary unit="دقیقه" />
      </PickerSheet>
    </>
  );
};
