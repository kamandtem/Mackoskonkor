import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* چرخ انتخاب (Wheel) — اسکرول با snap، ردیف وسط انتخاب‌شده است        */
/* ------------------------------------------------------------------ */

export interface WheelOption<T extends string | number> {
  value: T;
  label: string;
}

interface WheelColumnProps<T extends string | number> {
  options: WheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** ستون اصلی با نوار پررنگ مشخص می‌شود (مثل ستون ماه) */
  primary?: boolean;
  /** نسبت عرض ستون */
  grow?: number;
  /** برچسب کوچک کنار ردیف انتخاب‌شده، مثل «ساعت» */
  unit?: string;
}

export const WHEEL_ITEM_H = 46;
const VISIBLE_ROWS = 5;
const PAD = WHEEL_ITEM_H * Math.floor(VISIBLE_ROWS / 2);

export function WheelColumn<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  primary = false,
  grow = 1,
  unit,
}: WheelColumnProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const settleTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const userScrolling = useRef(false);
  const lastIdx = useRef(-1);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [liveIdx, setLiveIdx] = useState(selectedIndex);

  /** فاصله‌ی هر ردیف از مرکز را به شفافیت/مقیاس/چرخش تبدیل می‌کند */
  const paint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollTop / WHEEL_ITEM_H;
    itemRefs.current.forEach((node, i) => {
      if (!node) return;
      const d = i - center;
      const a = Math.min(Math.abs(d), 3);
      node.style.opacity = String(Math.max(0.16, 1 - a * 0.3));
      node.style.transform = `perspective(420px) rotateX(${(-d * 16).toFixed(1)}deg) scale(${(1 - a * 0.09).toFixed(3)})`;
    });
    const idx = Math.round(center);
    if (idx !== lastIdx.current) {
      if (lastIdx.current !== -1 && userScrolling.current) {
        try {
          navigator.vibrate?.(4);
        } catch {
          /* haptic optional */
        }
      }
      lastIdx.current = idx;
      setLiveIdx(Math.min(options.length - 1, Math.max(0, idx)));
    }
  }, [options.length]);

  // همگام‌سازی موقعیت با مقدار بیرونی (وقتی کاربر در حال کشیدن نیست)
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrolling.current) return;
    el.scrollTop = selectedIndex * WHEEL_ITEM_H;
    lastIdx.current = selectedIndex;
    setLiveIdx(selectedIndex);
    paint();
  }, [selectedIndex, options.length, paint]);

  useEffect(
    () => () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const handleScroll = () => {
    userScrolling.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(paint);

    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const idx = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_H)));
      userScrolling.current = false;
      const opt = options[idx];
      if (opt && opt.value !== value) onChange(opt.value);
    }, 120);
  };

  const scrollToIndex = (i: number) => {
    scrollRef.current?.scrollTo({ top: i * WHEEL_ITEM_H, behavior: 'smooth' });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      scrollToIndex(Math.min(options.length - 1, liveIdx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      scrollToIndex(Math.max(0, liveIdx - 1));
    }
  };

  return (
    <div className={`wheel-col ${primary ? 'is-primary' : ''}`} style={{ flexGrow: grow }}>
      <div className="wheel-band" aria-hidden="true">
        {unit && <span className="wheel-unit">{unit}</span>}
      </div>
      <div
        ref={scrollRef}
        className="wheel-scroll"
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={undefined}
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        style={{ height: WHEEL_ITEM_H * VISIBLE_ROWS, paddingBlock: PAD }}
      >
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            ref={(n) => {
              itemRefs.current[i] = n;
            }}
            type="button"
            role="option"
            aria-selected={i === liveIdx}
            tabIndex={-1}
            className={`wheel-item ${i === liveIdx ? 'is-live' : ''}`}
            style={{ height: WHEEL_ITEM_H }}
            onClick={() => scrollToIndex(i)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* شیت پایین صفحه برای انتخاب‌گرها                                      */
/* ------------------------------------------------------------------ */

interface PickerSheetProps {
  open: boolean;
  title: string;
  /** خلاصه‌ی زنده‌ی انتخاب، مثل «شنبه ۱۲ تیر ۱۴۰۵» */
  preview?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  /** دکمه‌ی میان‌بر مثل «امروز» یا «الان» */
  shortcut?: { label: string; onClick: () => void };
  /** جهت چیدمان ستون‌ها؛ ساعت باید ltr باشد */
  wheelsDir?: 'rtl' | 'ltr';
  children: React.ReactNode;
}

export const PickerSheet: React.FC<PickerSheetProps> = ({
  open,
  title,
  preview,
  onClose,
  onConfirm,
  shortcut,
  wheelsDir = 'rtl',
  children,
}) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClosing(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const animateOut = (after: () => void) => {
    setClosing(true);
    window.setTimeout(after, 190);
  };

  return createPortal(
    <div
      className={`picker-shell ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      dir="rtl"
      onClick={(e) => {
        // رویدادهای پورتال در درخت React بالا می‌روند؛ نگذار مودال والد بسته شود
        e.stopPropagation();
        animateOut(onClose);
      }}
    >
      <div className="picker-sheet" onClick={(e) => e.stopPropagation()}>
        <span className="picker-grip" aria-hidden="true" />
        <header className="picker-head">
          <div>
            <span className="picker-title">{title}</span>
            {preview && <strong className="picker-preview">{preview}</strong>}
          </div>
          <button type="button" className="picker-close" aria-label="بستن" onClick={() => animateOut(onClose)}>
            <X />
          </button>
        </header>

        <div className="picker-wheels" dir={wheelsDir}>{children}</div>

        <div className="picker-actions">
          {shortcut && (
            <button type="button" className="picker-secondary" onClick={shortcut.onClick}>
              {shortcut.label}
            </button>
          )}
          <button type="button" className="picker-primary" onClick={() => animateOut(onConfirm)}>
            تأیید
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
