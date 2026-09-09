import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** جایگزین window.confirm — در WebView اندروید ظاهر و رفتار قابل اتکاتری دارد */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-xs rounded-[28px] p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-center">
        <div
          className={`w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-3 ${
            destructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-sm font-black text-slate-800 mb-1.5">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">{message}</p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all active:scale-95 ${
              destructive
                ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700'
                : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
