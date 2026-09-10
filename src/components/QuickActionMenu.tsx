import React, { useEffect, useState } from 'react';
import { Award, CalendarPlus, Timer, X, Zap } from 'lucide-react';

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  /** افزودن درس به برنامه‌ی روز */
  onAddTask: () => void;
  /** تست‌زنی سرعتی */
  onStartDrill: () => void;
  /** ثبت آزمون آزمایشی */
  onAddExam: () => void;
  /** تایمر پومودورو */
  onStartFocus: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glow: string;
  onClick: () => void;
}

/**
 * منوی دکمه‌ی + نوار پایین.
 * کارت‌ها یکی‌یکی از پایین باز می‌شوند؛ هیچ ربطی به پنل خانه ندارد.
 */
export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isOpen,
  onClose,
  onAddTask,
  onStartDrill,
  onAddExam,
  onStartFocus,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMounted(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  // بسته شدن با کلید Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const run = (action: () => void) => {
    action();
    onClose();
  };

  const actions: QuickAction[] = [
    {
      id: 'task',
      label: 'ثبت فعالیت جدید',
      hint: 'درس، فصل و بازه‌ی زمانی را مشخص کن',
      icon: CalendarPlus,
      gradient: 'from-indigo-500 to-violet-600',
      glow: 'rgba(99,102,241,0.45)',
      onClick: () => run(onAddTask),
    },
    {
      id: 'drill',
      label: 'تست‌زنی سریع',
      hint: 'زمان هر تست را جدا اندازه بگیر',
      icon: Zap,
      gradient: 'from-rose-500 to-red-600',
      glow: 'rgba(244,63,94,0.45)',
      onClick: () => run(onStartDrill),
    },
    {
      id: 'exam',
      label: 'ثبت آزمون',
      hint: 'آزمون آزمایشی پیش‌رو را اضافه کن',
      icon: Award,
      gradient: 'from-amber-400 to-orange-500',
      glow: 'rgba(245,158,11,0.45)',
      onClick: () => run(onAddExam),
    },
    {
      id: 'pomodoro',
      label: 'تایمر پومودورو',
      hint: 'مطالعه‌ی بازه‌ای با استراحت کوتاه',
      icon: Timer,
      gradient: 'from-teal-500 to-emerald-600',
      glow: 'rgba(16,185,129,0.45)',
      onClick: () => run(onStartFocus),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="عملیات سریع"
    >
      {/* پرده */}
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px] transition-opacity duration-200"
        style={{ opacity: isMounted ? 1 : 0 }}
      />

      <div className="relative w-full max-w-md h-full flex flex-col justify-end px-4 safe-nav pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2.5 mb-3">
          <p
            className="text-center text-[11px] font-black text-white/70 mb-1 qa-item"
            style={{ animationDelay: '40ms' }}
          >
            چه کاری انجام دهیم؟
          </p>

          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="qa-item w-full bg-white/97 rounded-3xl p-2.5 pr-4 flex items-center justify-between gap-3 border border-white/60 shadow-[0_14px_34px_rgba(2,6,23,0.28)] active:scale-[0.97] transition-transform"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <span className="flex flex-col items-start text-right min-w-0">
                  <span className="text-[13.5px] font-black text-slate-800 truncate">
                    {action.label}
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-400 truncate mt-0.5">
                    {action.hint}
                  </span>
                </span>

                <span
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${action.gradient} text-white flex items-center justify-center shrink-0`}
                  style={{ boxShadow: `0 10px 22px ${action.glow}` }}
                >
                  <Icon className="w-[22px] h-[22px]" />
                </span>
              </button>
            );
          })}

          {/* دکمه‌ی بستن، هم‌جای همان دکمه‌ی + در نوار پایین */}
          <div className="flex justify-center pt-1.5">
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="qa-item w-14 h-14 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-[0_14px_30px_rgba(2,6,23,0.35)] active:scale-90 transition-transform"
              style={{ animationDelay: '380ms' }}
            >
              <X className="w-6 h-6 stroke-[2.6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
