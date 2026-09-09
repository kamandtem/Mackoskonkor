import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/** حالت خالی استاندارد — تا وقتی کاربر داده‌ای نساخته، جای عدد الکی را می‌گیرد */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) => (
  <div
    className={`soft-card flex flex-col items-center justify-center text-center ${
      compact ? 'p-6' : 'p-8'
    }`}
  >
    <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
      <Icon className="w-7 h-7" />
    </div>
    <p className="text-sm font-bold text-slate-700 mb-1">{title}</p>
    <p className="text-xs text-slate-400 font-medium max-w-[260px] leading-relaxed">
      {description}
    </p>

    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 active:scale-95 transition-transform"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{actionLabel}</span>
      </button>
    )}
  </div>
);
