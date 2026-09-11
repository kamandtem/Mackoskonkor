import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, Pause, Play, RotateCcw, Search, Sparkles, Volume2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AmbientSoundId, SubjectItem } from '../types/konkur';
import { toPersianDigits } from '../utils/jalali';
import { soundEngine } from '../utils/soundEngine';
import { EmptyState } from './EmptyState';

interface PersistedFocusTimer {
  mode: 'work' | 'break';
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  secondsRemaining: number;
  isActive: boolean;
  selectedSubjectId: string;
  selectedPresetIndex: number;
  endTime: number | null;
}

const FOCUS_TIMER_STORAGE = 'konkur_focus_timer_v1';
const readPersistedFocusTimer = (): PersistedFocusTimer | null => {
  try {
    const raw = localStorage.getItem(FOCUS_TIMER_STORAGE);
    return raw ? (JSON.parse(raw) as PersistedFocusTimer) : null;
  } catch {
    return null;
  }
};
const writePersistedFocusTimer = (value: PersistedFocusTimer | null) => {
  try {
    if (value) localStorage.setItem(FOCUS_TIMER_STORAGE, JSON.stringify(value));
    else localStorage.removeItem(FOCUS_TIMER_STORAGE);
  } catch {
    // Timer remains usable if storage is unavailable.
  }
};

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
  const persisted = useMemo(() => {
    const saved = readPersistedFocusTimer();
    if (saved && !saved.isActive && saved.selectedPresetIndex === 0 && (saved.totalWorkMinutes !== workMinutes || saved.totalBreakMinutes !== breakMinutes)) return null;
    return saved;
  }, [workMinutes, breakMinutes]);
  const restoredRef = useRef(Boolean(persisted));
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
        label: `${toPersianDigits(p.work)}/${toPersianDigits(p.break)}`,
      }));
  }, [workMinutes, breakMinutes]);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(persisted?.selectedPresetIndex ?? 0);
  const [mode, setMode] = useState<'work' | 'break'>(persisted?.mode ?? 'work');
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(persisted?.totalWorkMinutes ?? workMinutes);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(persisted?.totalBreakMinutes ?? breakMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(persisted?.secondsRemaining ?? workMinutes * 60);
  const [isActive, setIsActive] = useState(persisted?.isActive ?? false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState('');

  // Subject choice
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (persisted?.selectedSubjectId) return persisted.selectedSubjectId;
    if (preselectedSubject) {
      const match = subjects.find((s) => s.name === preselectedSubject);
      if (match) return match.id;
    }
    return subjects[0]?.id ?? '';
  });

  // اگر تنظیمات پومودورو عوض شد و تایمر در حال اجرا نیست، هم‌تراز شو.
  // یک بار state ذخیره‌شده را دست‌نخورده می‌گذاریم تا جابه‌جایی بین بخش‌ها تایمر را ریست نکند.
  useEffect(() => {
    if (restoredRef.current) {
      restoredRef.current = false;
      return;
    }
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
  const endTimeRef = useRef<number | null>(persisted?.endTime ?? null);

  useEffect(() => {
    writePersistedFocusTimer({
      mode,
      totalWorkMinutes,
      totalBreakMinutes,
      secondsRemaining,
      isActive,
      selectedSubjectId,
      selectedPresetIndex,
      endTime: endTimeRef.current,
    });
  }, [mode, totalWorkMinutes, totalBreakMinutes, secondsRemaining, isActive, selectedSubjectId, selectedPresetIndex]);

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

      // Start the recovery block automatically after a completed study block.
      const breakSeconds = totalBreakMinutes * 60;
      setMode('break');
      setSecondsRemaining(breakSeconds);
      window.setTimeout(() => {
        endTimeRef.current = Date.now() + breakSeconds * 1000;
        setIsActive(true);
      }, 0);
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
    const p = PRESETS[idx];
    if (!p) return;
    setSelectedPresetIndex(idx);
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
            endTimeRef.current = null;
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
            endTimeRef.current = null;
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
            dir="ltr"
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
          <button type="button" className="focus-subject-select" disabled={isActive} onClick={()=>setSubjectPickerOpen(true)}>
            <span>{activeSubject?.name || 'انتخاب درس'}</span><ChevronDown />
          </button>
        </div>
      </div>

      {subjectPickerOpen && <div className="subject-picker-shell" role="dialog" aria-modal="true" onClick={()=>setSubjectPickerOpen(false)}>
        <div className="subject-picker" onClick={e=>e.stopPropagation()}>
          <header><div><BookOpen/><span><b>درس هدف</b><small>برای این جلسه یک درس انتخاب کن</small></span></div><button onClick={()=>setSubjectPickerOpen(false)} aria-label="بستن"><X/></button></header>
          <label><Search/><input value={subjectQuery} onChange={e=>setSubjectQuery(e.target.value)} placeholder="جست‌وجوی درس..." autoFocus /></label>
          <div className="subject-picker-list">{subjects.filter(s=>s.name.includes(subjectQuery.trim())).map((s,i)=><button key={s.id} className={selectedSubjectId===s.id?'selected':''} style={{'--subject-color':s.color,'--i':i} as React.CSSProperties} onClick={()=>{setSelectedSubjectId(s.id);setSubjectPickerOpen(false);setSubjectQuery('')}}><i/><span>{s.name}</span>{selectedSubjectId===s.id?<Check/>:<ChevronDown/>}</button>)}</div>
        </div>
      </div>}

      {/* Giant Circular Timer Dial */}
      <div className={`focus-dial-wrap ${isActive ? 'is-running' : ''}`}>
        <div className="focus-orbit-layer" aria-hidden="true"><i className="orbit-ring ring-a" /><i className="orbit-ring ring-b" /><i className="orbit-ring ring-c" /></div>
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

          <div dir="ltr" className="text-5xl font-black text-slate-800 tracking-tight flex items-center justify-center font-mono">
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
              <span>{mode === 'break' ? 'شروع استراحت' : 'شروع مطالعه'}</span>
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
