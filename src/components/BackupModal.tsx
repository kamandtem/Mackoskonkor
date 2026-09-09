import React, { useRef, useState } from 'react';
import { AlertCircle, Check, Download, Upload, X } from 'lucide-react';
import { AppBackup } from '../types/konkur';
import { ParsedBackup, parseBackup } from '../utils/storage';
import { todayJalaliKey, toLatinDigits } from '../utils/jalali';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildBackup: () => AppBackup;
  onRestore: (data: ParsedBackup) => void;
}

/** پشتیبان‌گیری و بازیابی داده‌ها از فایل JSON — کاملاً آفلاین */
export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  buildBackup,
  onRestore,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    setError(null);
    try {
      const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `konkur-man-${toLatinDigits(todayJalaliKey()).replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDone('فایل پشتیبان ساخته شد.');
    } catch {
      setError('ساخت فایل پشتیبان ناموفق بود.');
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setDone(null);
    try {
      onRestore(parseBackup(await file.text()));
      setDone('اطلاعات با موفقیت بازیابی شد.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خواندن فایل ناموفق بود.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800">پشتیبان‌گیری و بازیابی</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 font-medium mt-3 leading-relaxed">
          اطلاعات این برنامه فقط روی همین گوشی ذخیره می‌شود. برای انتقال به گوشی دیگر یا
          محفوظ ماندن داده‌ها، یک فایل پشتیبان بگیر.
        </p>

        <div className="flex flex-col gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleExport}
            className="w-full p-3.5 rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-3 hover:bg-indigo-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div>گرفتن فایل پشتیبان</div>
              <div className="text-[11px] font-medium text-indigo-500/80">
                یک فایل JSON از همه‌ی اطلاعاتت
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-3 hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div>بازیابی از فایل</div>
              <div className="text-[11px] font-medium text-slate-400">
                اطلاعات فعلی با فایل جایگزین می‌شود
              </div>
            </div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{done}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
        >
          بستن
        </button>
      </div>
    </div>
  );
};
