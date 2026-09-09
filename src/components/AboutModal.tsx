import React from 'react';
import { Rocket, ShieldCheck, WifiOff, X } from 'lucide-react';
import { APP_VERSION } from '../utils/storage';
import { toPersianDigits } from '../utils/jalali';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
          <Rocket className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-black text-slate-800">کنکور من</h3>
        <p className="text-xs text-slate-400 font-bold mb-4">
          نسخه {toPersianDigits(APP_VERSION)}
        </p>

        <div className="flex flex-col gap-2 text-right">
          <Feature
            icon={WifiOff}
            title="کاملاً آفلاین"
            description="هیچ داده‌ای به جایی ارسال نمی‌شود و برنامه بدون اینترنت کار می‌کند."
          />
          <Feature
            icon={ShieldCheck}
            title="اطلاعات فقط روی گوشی تو"
            description="همه‌چیز در حافظه‌ی محلی دستگاه ذخیره می‌شود. با پشتیبان‌گیری منتقلش کن."
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};

const Feature: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
    <div>
      <div className="text-xs font-black text-slate-700">{title}</div>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);
