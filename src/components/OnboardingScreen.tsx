import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Rocket,
  Sparkles,
  Target,
  Upload,
  User,
} from 'lucide-react';
import { MajorType, UserProfile } from '../types/konkur';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ALL_MAJORS, ParsedBackup, parseBackup } from '../utils/storage';
import {
  addDays,
  dateToJalaliKey,
  daysUntilJalaliKey,
  formatJalaliKeyWithWeekday,
  jalaliKeyToIso,
  startOfToday,
  toLocalIso,
  toPersianDigits,
} from '../utils/jalali';
import { JalaliDateField } from './JalaliDateField';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
  onRestoreBackup: (data: ParsedBackup) => void;
}

const TOTAL_STEPS = 4;

/**
 * صفحه‌ی ورود اطلاعات. تا وقتی این مرحله تکمیل نشود هیچ داده‌ای در برنامه
 * نمایش داده نمی‌شود — نه شمارش معکوس، نه آمار، نه برنامه.
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onRestoreBackup,
}) => {
  const [introStep, setIntroStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [major, setMajor] = useState<MajorType>('تجربی');
  const [examName, setExamName] = useState('کنکور سراسری');
  const [examDateKey, setExamDateKey] = useState(() =>
    dateToJalaliKey(addDays(startOfToday(), 180)),
  );
  const [dailyGoalHours, setDailyGoalHours] = useState(6);

  const fileRef = useRef<HTMLInputElement>(null);

  const daysRemaining = daysUntilJalaliKey(examDateKey) ?? 0;

  const introSlides = [
    {
      image: '/onboarding/Learning-rafiki.svg',
      eyebrow: 'شروع هوشمند',
      title: <>برنامه‌ات را<br />با خیال راحت بچین</>,
      description: 'درس، فصل و زمان مطالعه را مشخص کن و مسیرت را منظم جلو ببر.',
    },
    {
      image: '/onboarding/Online-test-pana.svg',
      eyebrow: 'آزمون و تحلیل',
      title: <>درصدت را<br />دقیق‌تر بشناس</>,
      description: 'نتیجه تست‌ها را ثبت کن، درصد را ببین و پیشرفتت را مقایسه کن.',
    },
    {
      image: '/onboarding/Cohort-analysis-cuate.svg',
      eyebrow: 'تمرکز روی رشد',
      title: <>پیشرفتت را<br />واضح ببین</>,
      description: 'مطالعه‌ها، آزمون‌ها و کارنامه‌ات را یک‌جا دنبال کن.',
    },
  ];

  if (showIntro) {
    const slide = introSlides[introStep];
    const isLast = introStep === introSlides.length - 1;
    return (
      <div className="onboarding-intro-shell" dir="rtl">
        <div className="onboarding-intro">
          <div className="intro-brand">
            <img src="/icon.svg" alt="" />
            <span>شمارش معکوس کنکور</span>
            <button type="button" onClick={() => { setShowIntro(false); setIntroStep(0); }}>رد کردن</button>
          </div>
          <div className="intro-art"><div className="intro-art-blob" /><img src={slide.image} alt="" /></div>
          <div className="intro-copy">
            <span>{slide.eyebrow}</span>
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
          </div>
          <div className="intro-bottom">
            <div className="intro-dots">{introSlides.map((_, index) => <i key={index} className={index === introStep ? 'active' : ''} />)}</div>
            <button type="button" className="intro-next" onClick={() => isLast ? setShowIntro(false) : setIntroStep((value) => value + 1)}>
              {isLast ? 'بزن بریم' : 'بعدی'} {isLast ? <Check /> : <ChevronLeft />}
            </button>
            {introStep > 0 && <button type="button" className="intro-back" onClick={() => setIntroStep((value) => value - 1)}><ChevronRight /> قبلی</button>}
          </div>
        </div>
      </div>
    );
  }

  const validateStep = (): string | null => {
    if (step === 1) {
      if (name.trim().length < 2) return 'برای شروع، نامت را وارد کن (حداقل ۲ حرف).';
    }
    if (step === 3) {
      if (!examName.trim()) return 'عنوان آزمون هدف را وارد کن.';
      if (daysRemaining <= 0) return 'تاریخ کنکور باید بعد از امروز باشد.';
    }
    return null;
  };

  const handleNext = () => {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    const examIso = jalaliKeyToIso(examDateKey);
    if (!examIso) {
      setError('تاریخ کنکور معتبر نیست.');
      return;
    }

    onComplete({
      name: name.trim(),
      major,
      examName: examName.trim(),
      examTargetDate: examIso,
      startDate: toLocalIso(),
      dailyGoalMinutes: dailyGoalHours * 60,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      notificationsEnabled: true,
      isOnboarded: true,
    });
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      onRestoreBackup(parseBackup(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خواندن فایل پشتیبان ناموفق بود.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef2ff] via-[#f2f5f9] to-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* برند */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Rocket className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-800">کنکور من</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            برنامه‌ات را با اطلاعات خودت بساز
          </p>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-[0_20px_50px_-12px_rgba(100,116,139,0.25)] border border-white">
          {/* نشانگر مرحله */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-8 bg-indigo-600'
                    : step > s
                      ? 'w-3 bg-indigo-300'
                      : 'w-3 bg-slate-100'
                }`}
              />
            ))}
          </div>

          {/* مرحله ۱: نام یا بازیابی پشتیبان */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">اسمت چیه؟</h3>
              <p className="text-xs text-slate-400 mb-5 font-medium">
                همه‌ی اطلاعات فقط روی همین گوشی ذخیره می‌شود
              </p>

              <div className="text-right">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  placeholder="مثلاً: علی، سارا..."
                  autoFocus
                  maxLength={40}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>

              {/* بازیابی از فایل پشتیبان */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-medium mb-2">
                  قبلاً از برنامه پشتیبان گرفته‌ای؟
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-98 transition-all"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>بارگذاری فایل پشتیبان</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          {/* مرحله ۲: رشته */}
          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">رشته‌ات چیه؟</h3>
              <p className="text-xs text-slate-400 mb-5 font-medium">
                دروس این رشته به‌عنوان نقطه‌ی شروع اضافه می‌شود و بعداً قابل تغییر است
              </p>

              <div className="flex flex-col gap-2.5">
                {ALL_MAJORS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMajor(m)}
                    className={`py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-between border ${
                      major === m
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>رشته {m}</span>
                    {major === m && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* مرحله ۳: تاریخ کنکور */}
          {step === 3 && (
            <div>
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  کنکورت کِیه؟
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  شمارش معکوس دقیقاً بر اساس همین تاریخ حساب می‌شود
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    عنوان آزمون هدف
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => {
                      setExamName(e.target.value);
                      setError(null);
                    }}
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
                />

                {daysRemaining > 0 && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                    <span className="text-xs font-bold text-indigo-700">
                      {formatJalaliKeyWithWeekday(examDateKey)} — {' '}
                      {toPersianDigits(daysRemaining)} روز دیگر
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* مرحله ۴: هدف روزانه و تأیید */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">
                روزی چند ساعت می‌خوانی؟
              </h3>
              <p className="text-xs text-slate-400 mb-5 font-medium">
                هر زمان خواستی از منو تغییرش بده
              </p>

              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 mb-5">
                <span className="text-4xl font-black text-slate-800 block mb-1">
                  {toPersianDigits(dailyGoalHours)}
                </span>
                <span className="text-xs text-slate-400 font-bold mb-4 block">
                  ساعت در روز
                </span>
                <input
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={dailyGoalHours}
                  onChange={(e) => setDailyGoalHours(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* خلاصه‌ی اطلاعات وارد‌شده */}
              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 text-right">
                <SummaryRow label="نام" value={name.trim()} />
                <SummaryRow label="رشته" value={major} />
                <SummaryRow label="آزمون هدف" value={examName.trim()} />
                <SummaryRow
                  label="تاریخ کنکور"
                  value={`${formatJalaliKeyWithWeekday(examDateKey)} (${toPersianDigits(daysRemaining)} روز)`}
                />
              </div>

              <p className="text-[11px] text-slate-400 font-medium mt-4 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>بعد از ورود، برنامه‌ات از همین لحظه شروع به ثبت می‌کند</span>
              </p>
            </div>
          )}

          {/* خطا */}
          {error && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 text-right">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* دکمه‌ها */}
          <div className="flex items-center gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>قبلی</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 hover:brightness-105 active:scale-98 transition-all"
            >
              <span>{step === TOTAL_STEPS ? 'ورود به برنامه' : 'مرحله بعد'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
          بدون نیاز به اینترنت · بدون حساب کاربری
        </p>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between px-3.5 py-2.5">
    <span className="text-[11px] font-medium text-slate-400">{label}</span>
    <span className="text-xs font-bold text-slate-700 truncate max-w-[60%]">{value}</span>
  </div>
);
