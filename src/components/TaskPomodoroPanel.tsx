import React, { useEffect, useRef, useState } from 'react';
import { Check, Coffee, Pause, Play, Square, Timer, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem } from '../types/konkur';
import { formatMinutesShort, toPersianDigits } from '../utils/jalali';

interface TaskPomodoroPanelProps {
  task: TaskItem | null;
  /** مدت هر بازه‌ی مطالعه (پیش‌فرض ۲۵ دقیقه) */
  workMinutes: number;
  /** مدت هر استراحت (پیش‌فرض ۵ دقیقه) */
  breakMinutes: number;
  /** دقیقه‌های باقی‌مانده تا کامل شدن مدتی که کاربر برای این درس تعیین کرده */
  remainingMinutes: number;
  /** هر بازه‌ی مطالعه‌ی کامل‌شده بی‌درنگ در آمار ثبت می‌شود */
  onLogMinutes: (minutes: number) => void;
  onClose: () => void;
}

type Phase = 'work' | 'break' | 'done';
type PersistedTaskTimer = { phase: Phase; blockSeconds: number; secondsLeft: number; isRunning: boolean; loggedMinutes: number; cycle: number; target: number; endTime: number | null };
const taskTimerKey = (taskId: string) => `konkur_task_pomodoro_v1_${taskId}`;
const readTaskTimer = (taskId: string): PersistedTaskTimer | null => { try { const raw = localStorage.getItem(taskTimerKey(taskId)); return raw ? JSON.parse(raw) as PersistedTaskTimer : null; } catch { return null; } };
const saveTaskTimer = (taskId: string, value: PersistedTaskTimer | null) => { try { if (value) localStorage.setItem(taskTimerKey(taskId), JSON.stringify(value)); else localStorage.removeItem(taskTimerKey(taskId)); } catch {} };

const pad = (value: number) => toPersianDigits(String(value).padStart(2, '0'));

/**
 * پنل پومودورو مخصوص یک ردیف برنامه:
 * ۲۵ دقیقه مطالعه / ۵ دقیقه استراحت، پشت‌سرهم تا مدت تعیین‌شده تمام شود،
 * و هر بازه به‌صورت خودکار در آمار برنامه ثبت می‌شود.
 */
export const TaskPomodoroPanel: React.FC<TaskPomodoroPanelProps> = ({
  task,
  workMinutes,
  breakMinutes,
  remainingMinutes,
  onLogMinutes,
  onClose,
}) => {
  const isOpen = task !== null;

  const [phase, setPhase] = useState<Phase>('work');
  const [blockSeconds, setBlockSeconds] = useState(workMinutes * 60);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [loggedMinutes, setLoggedMinutes] = useState(0);
  const [cycle, setCycle] = useState(1);

  const endRef = useRef<number | null>(null);
  const restoreRef = useRef(false);
  const loggedRef = useRef(0);
  const targetRef = useRef(0);

  const work = Math.max(1, workMinutes || 25);
  const rest = Math.max(1, breakMinutes || 5);

  /* هدف فقط یک‌بار در لحظه‌ی باز شدن قفل می‌شود تا ثبت‌های میانی پنل را ری‌ست نکند */
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      endRef.current = null;
      return;
    }
    const target = Math.max(1, remainingMinutes);
    const first = Math.min(work, target);
    const saved = task ? readTaskTimer(task.id) : null;
    if (saved && saved.phase !== 'done') {
      restoreRef.current = true;
      targetRef.current = saved.target;
      loggedRef.current = saved.loggedMinutes;
      setLoggedMinutes(saved.loggedMinutes);
      setCycle(saved.cycle);
      setPhase(saved.phase);
      setBlockSeconds(saved.blockSeconds);
      setSecondsLeft(saved.endTime && saved.isRunning ? Math.max(0, Math.round((saved.endTime - Date.now()) / 1000)) : saved.secondsLeft);
      setIsRunning(saved.isRunning);
      endRef.current = saved.endTime;
      return;
    }
    targetRef.current = target;
    loggedRef.current = 0;
    setLoggedMinutes(0);
    setCycle(1);
    setPhase('work');
    setBlockSeconds(first * 60);
    setSecondsLeft(first * 60);
    setIsRunning(true);
    endRef.current = Date.now() + first * 60 * 1000;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (!task || !isOpen || restoreRef.current) { restoreRef.current = false; return; }
    saveTaskTimer(task.id, { phase, blockSeconds, secondsLeft, isRunning, loggedMinutes, cycle, target: targetRef.current, endTime: endRef.current });
  }, [task, isOpen, phase, blockSeconds, secondsLeft, isRunning, loggedMinutes, cycle]);

  const celebrate = () => {
    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 } });
    } catch {
      // بی‌اهمیت
    }
  };

  const advance = () => {
    if (phase === 'work') {
      const blockMinutes = Math.max(1, Math.round(blockSeconds / 60));
      const left = targetRef.current - loggedRef.current;
      const gain = Math.max(0, Math.min(blockMinutes, left));

      if (gain > 0) {
        loggedRef.current += gain;
        setLoggedMinutes(loggedRef.current);
        onLogMinutes(gain);
      }

      if (loggedRef.current >= targetRef.current) {
        setPhase('done');
        setIsRunning(false);
        endRef.current = null;
        celebrate();
        return;
      }

      setPhase('break');
      setBlockSeconds(rest * 60);
      setSecondsLeft(rest * 60);
      endRef.current = Date.now() + rest * 60 * 1000;
      return;
    }

    const left = targetRef.current - loggedRef.current;
    const next = Math.max(1, Math.min(work, left));
    setCycle((prev) => prev + 1);
    setPhase('work');
    setBlockSeconds(next * 60);
    setSecondsLeft(next * 60);
    endRef.current = Date.now() + next * 60 * 1000;
  };

  /* شمارش بر پایه‌ی زمان پایان واقعی تا خواب صفحه دقت را خراب نکند */
  useEffect(() => {
    if (!isOpen || !isRunning || phase === 'done') return;

    const interval = window.setInterval(() => {
      if (!endRef.current) return;
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(interval);
        advance();
      }
    }, 400);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isRunning, phase, blockSeconds]);

  if (!isOpen || !task) return null;

  const toggleRun = () => {
    if (phase === 'done') return;
    if (isRunning) {
      setIsRunning(false);
      endRef.current = null;
    } else {
      endRef.current = Date.now() + secondsLeft * 1000;
      setIsRunning(true);
    }
  };

  /** بستن پنل؛ اگر بازه‌ی مطالعه نیمه‌کاره است، دقیقه‌های کامل‌شده ثبت می‌شود */
  const finishAndClose = () => {
    if (phase === 'work') {
      const elapsed = Math.max(0, blockSeconds - secondsLeft);
      const left = targetRef.current - loggedRef.current;
      const gain = Math.max(0, Math.min(Math.floor(elapsed / 60), left));
      if (gain > 0) {
        loggedRef.current += gain;
        onLogMinutes(gain);
      }
    }
    setIsRunning(false);
    endRef.current = null;
    onClose();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const target = Math.max(1, targetRef.current);
  const totalPct = Math.min(100, Math.round((loggedMinutes / target) * 100));
  const blockRatio = blockSeconds > 0 ? (blockSeconds - secondsLeft) / blockSeconds : 0;

  const dial = 240;
  const stroke = 13;
  const radius = (dial - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - circumference * (phase === 'done' ? 1 : blockRatio);

  const isBreak = phase === 'break';
  const accent = phase === 'done' ? '#10b981' : isBreak ? '#059669' : '#4f46e5';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-5 pb-7 shadow-2xl qa-sheet">
        {/* سرصفحه */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate">پومودورو · {task.subjectName}</span>
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              {toPersianDigits(work)} دقیقه مطالعه / {toPersianDigits(rest)} دقیقه استراحت · هدف{' '}
              {formatMinutesShort(target)}
            </p>
          </div>
          <button
            type="button"
            onClick={finishAndClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* وضعیت بازه */}
        <div className="flex items-center justify-center mb-3">
          <span
            className="px-3.5 py-1.5 rounded-full text-[11.5px] font-black flex items-center gap-1.5"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {phase === 'done' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>مطالعه‌ی این درس کامل شد</span>
              </>
            ) : isBreak ? (
              <>
                <Coffee className="w-3.5 h-3.5" />
                <span>استراحت کوتاه</span>
              </>
            ) : (
              <>
                <Timer className="w-3.5 h-3.5" />
                <span>بازه‌ی {toPersianDigits(cycle)} مطالعه</span>
              </>
            )}
          </span>
        </div>

        {/* حلقه‌ی زمان */}
        <div className="relative w-[240px] h-[240px] mx-auto flex items-center justify-center">
          <svg width={dial} height={dial} className="-rotate-90">
            <circle
              cx={dial / 2}
              cy={dial / 2}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={stroke}
            />
            <circle
              cx={dial / 2}
              cy={dial / 2}
              r={radius}
              fill="none"
              stroke={accent}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-linear"
            />
          </svg>

          <div className="absolute inset-[26px] rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 soft-dial-shadow border border-white flex flex-col items-center justify-center">
            <div className="text-[44px] leading-none font-black text-slate-800 font-mono flex items-center">
              <span>{pad(minutes)}</span>
              <span className={`text-slate-300 mx-0.5 ${isRunning ? 'animate-pulse' : ''}`}>:</span>
              <span>{pad(seconds)}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 mt-2">
              {phase === 'done'
                ? 'در آمار ثبت شد'
                : isRunning
                  ? isBreak
                    ? 'نفس بکش، بعد ادامه'
                    : 'در حال ثبت مطالعه...'
                  : 'متوقف شده'}
            </span>
          </div>
        </div>

        {/* پیشرفت کل درس */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black text-slate-500">ثبت‌شده در این پنل</span>
            <span className="text-[11px] font-black text-indigo-600">
              {formatMinutesShort(loggedMinutes)} از {formatMinutesShort(target)}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%`, backgroundColor: accent }}
            />
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex items-center gap-3 mt-5">
          {phase === 'done' ? (
            <button
              type="button"
              onClick={finishAndClose}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-95 transition-transform"
            >
              <Check className="w-5 h-5" />
              <span>تمام، ببند</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={finishAndClose}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Square className="w-4 h-4" />
                <span>پایان</span>
              </button>
              <button
                type="button"
                onClick={toggleRun}
                className={`flex-1 py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                  isRunning
                    ? 'bg-amber-500 shadow-md shadow-amber-200'
                    : 'bg-indigo-600 shadow-md shadow-indigo-200'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-white" />
                    <span>توقف موقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>ادامه</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
