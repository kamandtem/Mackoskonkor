import React, { useEffect, useState } from 'react';
import { Bell, Check, RotateCw, X } from 'lucide-react';
import { MajorType, UserProfile } from '../types/konkur';
import { ALL_MAJORS } from '../utils/storage';
import {
  daysUntilJalaliKey,
  isoToJalaliKey,
  jalaliKeyToIso,
  todayJalaliKey,
  toPersianDigits,
} from '../utils/jalali';
import { JalaliDateField } from './JalaliDateField';
import { COUNTDOWN_STYLES, COUNTDOWN_LABELS, CountdownStyle } from '../types/countdown';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile, resetSubjectsForMajor: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [major, setMajor] = useState<MajorType>(profile.major);
  const [examName, setExamName] = useState(profile.examName);
  const [examDateKey, setExamDateKey] = useState(
    () => isoToJalaliKey(profile.examTargetDate) ?? todayJalaliKey(),
  );
  const [dailyGoalHours, setDailyGoalHours] = useState(
    Math.max(1, Math.round(profile.dailyGoalMinutes / 60)),
  );
  const [pomodoroWork, setPomodoroWork] = useState(profile.pomodoroWorkMinutes);
  const [pomodoroBreak, setPomodoroBreak] = useState(profile.pomodoroBreakMinutes);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.notificationsEnabled,
  );
  const [replaceSubjects, setReplaceSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // هر بار باز شدن، فرم را با مقادیر فعلی هم‌تراز کن
  useEffect(() => {
    if (!isOpen) return;
    setName(profile.name);
    setMajor(profile.major);
    setExamName(profile.examName);
    setExamDateKey(isoToJalaliKey(profile.examTargetDate) ?? todayJalaliKey());
    setDailyGoalHours(Math.max(1, Math.round(profile.dailyGoalMinutes / 60)));
    setPomodoroWork(profile.pomodoroWorkMinutes);
    setPomodoroBreak(profile.pomodoroBreakMinutes);
    setNotificationsEnabled(profile.notificationsEnabled);
    setReplaceSubjects(false);
    setError(null);
    setSaved(false);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const majorChanged = major !== profile.major;
  const daysLeft = daysUntilJalaliKey(examDateKey);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError('نام باید حداقل ۲ حرف باشد.');
      return;
    }
    const examIso = jalaliKeyToIso(examDateKey);
    if (!examIso) {
      setError('تاریخ کنکور معتبر نیست.');
      return;
    }
    if (daysLeft !== null && daysLeft < 0) {
      setError('تاریخ کنکور در گذشته است. تاریخ درست را انتخاب کن.');
      return;
    }

    onSaveProfile(
      {
        ...profile,
        name: name.trim(),
        major,
        examName: examName.trim() || 'کنکور سراسری',
        examTargetDate: examIso,
        dailyGoalMinutes: dailyGoalHours * 60,
        pomodoroWorkMinutes: pomodoroWork,
        pomodoroBreakMinutes: pomodoroBreak,
        notificationsEnabled,
      },
      majorChanged && replaceSubjects,
    );

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 border border-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800">تنظیمات</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved && (
          <div className="my-3 p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>تنظیمات ذخیره شد</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-3">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">نام</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={40}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              رشته تحصیلی
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_MAJORS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMajor(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    major === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* تغییر رشته دروس را خودسرانه عوض نمی‌کند؛ انتخاب با کاربر است */}
            {majorChanged && (
              <label className="mt-2.5 flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceSubjects}
                  onChange={(e) => setReplaceSubjects(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 mt-0.5 shrink-0"
                />
                <span className="text-[11px] font-bold text-amber-700 leading-relaxed">
                  دروس فعلی با دروس پیش‌فرض رشته {major} جایگزین شود.
                  <span className="block font-medium text-amber-600/90 mt-0.5">
                    جلسات و آمار ثبت‌شده‌ات پاک نمی‌شود.
                  </span>
                </span>
              </label>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              عنوان آزمون هدف
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              maxLength={60}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>

          <JalaliDateField
            label="تاریخ کنکور (شمسی)"
            value={examDateKey}
            onChange={(v) => {
              setExamDateKey(v);
              setError(null);
            }}
            hint={
              daysLeft !== null && daysLeft >= 0
                ? `${toPersianDigits(daysLeft)} روز باقی مانده`
                : 'این تاریخ گذشته است'
            }
          />

          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              هدف مطالعه روزانه: {toPersianDigits(dailyGoalHours)} ساعت
            </label>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                تمرکز: {toPersianDigits(pomodoroWork)} دقیقه
              </label>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={pomodoroWork}
                onChange={(e) => setPomodoroWork(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                استراحت: {toPersianDigits(pomodoroBreak)} دقیقه
              </label>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={pomodoroBreak}
                onChange={(e) => setPomodoroBreak(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* نوع عداد شمارش معکوس */}
          <div className="mb-4">
            <label className="text-[11px] font-black text-slate-500 mb-2 block">نوع عداد</label>
            <div className="grid grid-cols-3 gap-2">
              {COUNTDOWN_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setCountdownStyle(style)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all text-center ${
                    countdownStyle === style
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}
                >
                  {COUNTDOWN_LABELS[style]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700">
                یادآورهای روزانه و استریک
              </span>
            </span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded"
            />
          </label>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
