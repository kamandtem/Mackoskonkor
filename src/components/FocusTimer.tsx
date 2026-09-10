import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Pause, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AmbientSoundId, SubjectItem } from '../types/konkur';
import { toPersianDigits } from '../utils/jalali';
import { soundEngine } from '../utils/soundEngine';
import { EmptyState } from './EmptyState';

interface FocusTimerProps {
  subjects: SubjectItem[];
  preselectedSubject?: string;
  /** از تنظیمات کاربر می‌آید، نه عدد ثابت */
  workMinutes: number;
  breakMinutes: number;
  onSessionComplete: (subjectId: string, subjectName: string, durationMinutes: number) => void;
  onOpenSounds: () => void;
  currentSound: AmbientSoundId;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  subjects,
  preselectedSubject,
  workMinutes,
  breakMinutes,
  onSessionComplete,
  onOpenSounds,
  currentSound,
}) => {
  // اولین گزینه همیشه تنظیم دلخواه خودِ کاربر است
  const PRESETS = useMemo(() => {
    const base = [
      { work: workMinutes, break: breakMinutes },
      { work: 25, break: 5 },
      { work: 50, break: 10 },
      { work: 90, break: 20 },
    ];
    const seen = new Set<string>();
    return base
      .filter((p) => {
        const key = `${p.work}/${p.break}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4)
      .map((p) => ({
        ...p,
        label: `${toPersianDigits(p.work)} / ${toPersianDigits(p.break)}`,
      }));
  }, [workMinutes, breakMinutes]);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(workMinutes);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(breakMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(workMinutes * 60);
  const [isActive, setIsActive] = useState(false);

  // Subject choice
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (preselectedSubject) {
      const match = subjects.find((s) => s.name === preselectedSubject);
      if (match) return match.id;
    }
    return subjects[0]?.id ?? '';
  });

  // اگر تنظیمات پومودورو عوض شد و تایمر در حال اجرا نیست، هم‌تراز شو
  useEffect(() => {
    if (isActive) return;
    setTotalWorkMinutes(workMinutes);
    setTotalBreakMinutes(breakMinutes);
    setSelectedPresetIndex(0);
    setSecondsRemaining((mode === 'work' ? workMinutes : breakMinutes) * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMinutes, breakMinutes]);

  // اگر درس انتخاب‌شده دیگر وجود ندارد، به اولین درس موجود برگرد
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // End timestamp reference for background-accurate timing
  const endTimeRef = useRef<number | null>(null);

  // Update selected subject if preselectedSubject changes
  useEffect(() => {
    if (preselectedSubject) {
      const match = subjects.find((s) => s.name === preselectedSubject);
      if (match) setSelectedSubjectId(match.id);
    }
  }, [preselectedSubject, subjects]);

  /* شمارش بر مبنای زمان پایان واقعی تا خواب صفحه یا رفتن برنامه به پس‌زمینه
     روی دقت تایمر اثر نگذارد. وابستگی به secondsRemaining حذف شد چون باعث
     ساخته‌شدن دوباره‌ی interval در هر ثانیه می‌شد. */
  useEffect(() => {
    if (!isActive) {
      endTimeRef.current = null;
      return;
    }

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + secondsRemaining * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsActive(false);
        endTimeRef.current = null;
        handleTimerFinished();
      }
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const handleTimerFinished = () => {
    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    if (mode === 'work') {
      const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
      const subjectName = currentSubject ? currentSubject.name : 'مطالعه آزاد';
      onSessionComplete(selectedSubjectId, subjectName, totalWorkMinutes);

      // Switch to break
      setMode('break');
      setSecondsRemaining(totalBreakMinutes * 60);
    } else {
      // Switch to work
      setMode('work');
      setSecondsRemaining(totalWorkMinutes * 60);
    }
  };

  const toggleTimer = () => {
    if (!isActive) {
      endTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsActive(true);
    } else {
      setIsActive(false);
      endTimeRef.current = null;
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    endTimeRef.current = null;
    const initialSecs = (mode === 'work' ? totalWorkMinutes : totalBreakMinutes) * 60;
    setSecondsRemaining(initialSecs);
  };

  const applyPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = PRESETS[idx];
    setTotalWorkMinutes(p.work);
    setTotalBreakMinutes(p.break);
    setIsActive(false);
    endTimeRef.current = null;
    setSecondsRemaining((mode === 'work' ? p.work : p.break) * 60);
  };

  // Calculations for display & circular ring
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const currentTotalSeconds = (mode === 'work' ? totalWorkMinutes : totalBreakMinutes) * 60;
  const progressRatio = currentTotalSeconds > 0 ? (currentTotalSeconds - secondsRemaining) / currentTotalSeconds : 0;

  const dialSize = 270;
  const strokeWidth = 14;
  const radius = (dialSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressRatio);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  if (subjects.length === 0) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto w-full">
        <EmptyState
          icon={BookOpen}
          title="هنوز درسی نداری"
          description="از منو به تنظیمات برو و رشته‌ات را انتخاب کن تا دروس اضافه شوند."
        />
      </div>
    );
  }

  return (
    <div className="focus-page" dir="rtl">
      {/* Mode Switch (تمرکز / استراحت) */}
      <div className="focus-mode-switch">
        <button
          onClick={() => {
            setIsActive(false);
            setMode('work');
            setSecondsRemaining(totalWorkMinutes * 60);
          }}
          className={`focus-mode-btn ${
            mode === 'work'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          تمرکز و مطالعه 📚
        </button>
        <button
          onClick={() => {
            setIsActive(false);
            setMode('break');
            setSecondsRemaining(totalBreakMinutes * 60);
          }}
          className={`focus-mode-btn ${
            mode === 'break'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          استراحت و بازیابی ☕
        </button>
      </div>

      {/* Preset Buttons (25/5, 50/10, 90/20) */}
      <div className="focus-presets">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(idx)}
            className={`focus-preset ${
              selectedPresetIndex === idx
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Subject Picker Dropdown / Chip */}
      <div className="focus-subject">
        <div className="focus-subject-row">
          <div className="flex items-center gap-2">
            <span className="focus-subject-icon"><BookOpen /></span><span className="focus-subject-label">درس هدف</span>
          </div>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={isActive}
            className="focus-subject-select"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Giant Circular Timer Dial */}
      <div className="focus-dial-wrap">
        <svg width={dialSize} height={dialSize} className="transform -rotate-90">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode === 'work' ? '#4f46e5' : '#059669'} />
              <stop offset="100%" stopColor={mode === 'work' ? '#9333ea' : '#10b981'} />
            </linearGradient>
          </defs>

          {/* Background Ring */}
          <circle
            cx={dialSize / 2}
            cy={dialSize / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            className="opacity-70"
          />

          {/* Active Progress Ring */}
          <circle
            cx={dialSize / 2}
            cy={dialSize / 2}
            r={radius}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-linear"
          />
        </svg>

        {/* Inner Timer Face (Elevated Soft Disc) */}
        <div className="absolute inset-[28px] rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 soft-dial-shadow flex flex-col items-center justify-center border border-white">
          <span className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {mode === 'work' ? (activeSubject?.name || 'تمرکز عمیق') : 'زمان استراحت'}
          </span>

          <div className="text-5xl font-black text-slate-800 tracking-tight flex items-center justify-center font-mono">
            <span>{toPersianDigits(minutes < 10 ? '۰' + minutes : minutes)}</span>
            <span className="text-slate-300 mx-0.5 animate-pulse">:</span>
            <span>{toPersianDigits(seconds < 10 ? '۰' + seconds : seconds)}</span>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 mt-1">
            {isActive ? 'در حال ثبت مطالعه...' : 'آماده برای شروع'}
          </span>
        </div>
      </div>

      {/* Control Buttons (Play/Pause, Reset, Sounds) */}
      <div className="focus-controls">
        {/* Reset Button */}
        <button
          onClick={resetTimer}
          title="بازنشانی تایمر"
          className="focus-icon-btn"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Main Play / Pause Button */}
        <button
          onClick={toggleTimer}
          className={`focus-main-btn ${
            isActive
              ? 'bg-amber-500 shadow-amber-200'
              : mode === 'work'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-200'
              : 'bg-emerald-600 shadow-emerald-200'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-6 h-6 fill-white" />
              <span>توقف موقت</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-white ml-0.5" />
              <span>شروع مطالعه</span>
            </>
          )}
        </button>

        {/* Ambient Sound Button */}
        <button
          onClick={onOpenSounds}
          title="صدای پس‌زمینه تمرکز"
          className={`focus-icon-btn ${
            currentSound !== 'none'
              ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 animate-pulse'
              : 'bg-white text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Current Ambient Sound Indicator */}
      {currentSound !== 'none' && (
        <div className="focus-sound-pill">
          <Volume2 className="w-3.5 h-3.5" />
          <span>صدای پس‌زمینه در حال پخش است</span>
          <button
            onClick={() => soundEngine.stop()}
            className="text-[10px] text-rose-500 font-bold mr-1 underline"
          >
            قطع
          </button>
        </div>
      )}
    </div>
  );
};
