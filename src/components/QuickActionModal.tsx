import React from 'react';
import { CalendarPlus, Clock, Gauge, Play, X } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddPlan: () => void;
  onOpenManualLog: () => void;
  onStartFocus: () => void;
  onStartDrill: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onOpenAddPlan,
  onOpenManualLog,
  onStartFocus,
  onStartDrill,
}) => {
  if (!isOpen) return null;

  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const actions = [
    {
      label: 'شروع تمرکز (پومودورو)',
      icon: Play,
      tone: 'bg-indigo-600',
      wrapper: 'bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700',
      onClick: run(onStartFocus),
    },
    {
      label: 'تست‌زنی سرعتی',
      icon: Gauge,
      tone: 'bg-rose-600',
      wrapper: 'bg-slate-50 hover:bg-slate-100 text-slate-800',
      onClick: run(onStartDrill),
    },
    {
      label: 'افزودن درس به برنامه',
      icon: CalendarPlus,
      tone: 'bg-purple-600',
      wrapper: 'bg-slate-50 hover:bg-slate-100 text-slate-800',
      onClick: run(onOpenAddPlan),
    },
    {
      label: 'ثبت زمان مطالعه انجام‌شده',
      icon: Clock,
      tone: 'bg-emerald-600',
      wrapper: 'bg-slate-50 hover:bg-slate-100 text-slate-800',
      onClick: run(onOpenManualLog),
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center pb-24 p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-xs rounded-3xl p-4 shadow-2xl border border-slate-100 flex flex-col gap-2 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400">عملیات سریع</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={`p-3 rounded-2xl flex items-center gap-3 font-bold text-xs transition-colors ${a.wrapper}`}
            >
              <div
                className={`w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 ${a.tone}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
