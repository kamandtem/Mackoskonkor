import React from 'react';
import { Calendar, Clock, FileText, X, Zap } from 'lucide-react';

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: () => void;
  onStartDrill: () => void;
  onAddTask: () => void;
  onManualLog: () => void;
}

/**
 * منوی سریع: ۴ عملیات اساسی
 * با لمس دکمه شناور باز می‌شود
 */
export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  isOpen,
  onClose,
  onStartFocus,
  onStartDrill,
  onAddTask,
  onManualLog,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      label: 'شروع تمرکز (پومودورو)',
      icon: Clock,
      color: 'from-indigo-600 to-blue-600',
      onClick: () => {
        onStartFocus();
        onClose();
      },
    },
    {
      label: 'تست‌زنی سرعتی',
      icon: Zap,
      color: 'from-rose-600 to-red-600',
      onClick: () => {
        onStartDrill();
        onClose();
      },
    },
    {
      label: 'افزودن درس به برنامه',
      icon: Calendar,
      color: 'from-purple-600 to-violet-600',
      onClick: () => {
        onAddTask();
        onClose();
      },
    },
    {
      label: 'ثبت زمان مطالعه انجام‌شده',
      icon: FileText,
      color: 'from-emerald-600 to-teal-600',
      onClick: () => {
        onManualLog();
        onClose();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* سرصفحه */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-800">عملیات سریع</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center active:scale-90 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* عملیات */}
        <div className="space-y-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all border border-slate-100"
              >
                <span className="text-sm font-black text-slate-800">{action.label}</span>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
