import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Gauge,
  MinusCircle,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { SubjectItem, TestDrill } from '../types/konkur';
import { computeDrillPercent } from '../utils/storage';
import { computeDrillStats } from '../utils/stats';
import {
  formatJalaliKey,
  formatSeconds,
  toPersianDigits,
} from '../utils/jalali';

interface SpeedDrillViewProps {
  subjects: SubjectItem[];
  drills: TestDrill[];
  onSaveDrill: (drill: Omit<TestDrill, 'id' | 'dateStr' | 'isoDate' | 'timestamp'>) => void;
  onDeleteDrill: (id: string) => void;
}

type Phase = 'setup' | 'running' | 'result';
type Answer = 'correct' | 'wrong' | 'blank';

const QUESTION_PRESETS = [10, 20, 30, 50];

/**
 * تست‌زنی سرعتی: کرنومتر سؤال‌به‌سؤال.
 * برای هر سؤال زمان جداگانه ثبت می‌شود، در پایان درصد کنکوری و
 * سرعت متوسط محاسبه و نتیجه در آمار مطالعه هم ثبت می‌شود.
 */
export const SpeedDrillView: React.FC<SpeedDrillViewProps> = ({
  subjects,
  drills,
  onSaveDrill,
  onDeleteDrill,
}) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [targetCount, setTargetCount] = useState(20);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [perQuestion, setPerQuestion] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const startedAtRef = useRef<number>(0);
  const pausedTotalRef = useRef<number>(0);
  const pausedAtRef = useRef<number | null>(null);
  const lastMarkRef = useRef<number>(0);

  const stats = useMemo(() => computeDrillStats(drills), [drills]);
  const activeSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0];

  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  // کرنومتر بر مبنای زمان واقعی، تا خواب صفحه روی دقتش اثر نگذارد
  useEffect(() => {
    if (phase !== 'running' || isPaused) return;
    const tick = () => {
      setElapsed((Date.now() - startedAtRef.current - pausedTotalRef.current) / 1000);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, isPaused]);

  const answered = answers.length;
  const correct = answers.filter((a) => a === 'correct').length;
  const wrong = answers.filter((a) => a === 'wrong').length;
  const blank = answers.filter((a) => a === 'blank').length;

  const currentQuestionSeconds = Math.max(
    0,
    elapsed - perQuestion.reduce((a, b) => a + b, 0),
  );
  const budget = targetCount * secondsPerQuestion;
  const paceDelta = currentQuestionSeconds - secondsPerQuestion;

  const start = () => {
    startedAtRef.current = Date.now();
    pausedTotalRef.current = 0;
    pausedAtRef.current = null;
    lastMarkRef.current = 0;
    setAnswers([]);
    setPerQuestion([]);
    setElapsed(0);
    setIsPaused(false);
    setPhase('running');
  };

  const togglePause = () => {
    if (isPaused) {
      if (pausedAtRef.current !== null) {
        pausedTotalRef.current += Date.now() - pausedAtRef.current;
        pausedAtRef.current = null;
      }
      setIsPaused(false);
    } else {
      pausedAtRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const mark = (answer: Answer) => {
    if (isPaused) return;
    const now = Date.now() - startedAtRef.current - pausedTotalRef.current;
    const spent = Math.max(0, Math.round((now - lastMarkRef.current) / 1000));
    lastMarkRef.current = now;

    const nextAnswers = [...answers, answer];
    const nextPerQuestion = [...perQuestion, spent];
    setAnswers(nextAnswers);
    setPerQuestion(nextPerQuestion);

    if (nextAnswers.length >= targetCount) {
      finish(nextAnswers, nextPerQuestion, now / 1000);
    }
  };

  const undo = () => {
    if (answers.length === 0) return;
    const lastSpent = perQuestion[perQuestion.length - 1] ?? 0;
    lastMarkRef.current = Math.max(0, lastMarkRef.current - lastSpent * 1000);
    setAnswers(answers.slice(0, -1));
    setPerQuestion(perQuestion.slice(0, -1));
  };

  const finish = (
    finalAnswers: Answer[] = answers,
    finalPerQuestion: number[] = perQuestion,
    finalSeconds: number = elapsed,
  ) => {
    if (finalAnswers.length === 0) {
      setPhase('setup');
      return;
    }
    const total = finalAnswers.length;
    const c = finalAnswers.filter((a) => a === 'correct').length;
    const w = finalAnswers.filter((a) => a === 'wrong').length;

    onSaveDrill({
      subjectId: activeSubject?.id ?? '',
      subjectName: activeSubject?.name ?? 'مطالعه آزاد',
      totalQuestions: total,
      correct: c,
      wrong: w,
      blank: total - c - w,
      durationSeconds: Math.round(finalSeconds),
      perQuestionSeconds: finalPerQuestion,
      percent: computeDrillPercent(total, c, w),
    });

    setPerQuestion(finalPerQuestion);
    setAnswers(finalAnswers);
    setElapsed(finalSeconds);
    setPhase('result');
  };

  /* ----------------------------- بدون درس ----------------------------- */
  if (subjects.length === 0) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto w-full text-center">
        <div className="soft-card p-8">
          <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Gauge className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">هنوز درسی نداری</p>
          <p className="text-xs text-slate-400 font-medium">
            از تنظیمات رشته‌ات را انتخاب کن تا دروس اضافه شوند.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-4 max-w-lg mx-auto w-full pb-10">
      {/* سربرگ */}
      <div className="soft-card p-5 bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">تست‌زنی سرعتی</h3>
            <p className="text-xs text-slate-500 font-medium">
              سرعت و دقتت را سؤال‌به‌سؤال اندازه بگیر
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------ تنظیم ------------------------------ */}
      {phase === 'setup' && (
        <>
          <div className="soft-card p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">درس</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                تعداد سؤال: {toPersianDigits(targetCount)}
              </label>
              <div className="flex items-center gap-2">
                {QUESTION_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTargetCount(n)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      targetCount === n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {toPersianDigits(n)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                زمان هدف هر سؤال: {toPersianDigits(secondsPerQuestion)} ثانیه
              </label>
              <input
                type="range"
                min={20}
                max={180}
                step={5}
                value={secondsPerQuestion}
                onChange={(e) => setSecondsPerQuestion(parseInt(e.target.value, 10))}
                className="w-full accent-rose-600"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                کل زمان مجاز: {formatSeconds(budget)}
              </p>
            </div>

            <button
              type="button"
              onClick={start}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-black text-xs shadow-md shadow-rose-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>شروع تست‌زنی</span>
            </button>
          </div>

          {/* آمار کلی تست‌زنی */}
          {stats.hasAnyData && (
            <div className="soft-card p-4 grid grid-cols-3 gap-2 text-center">
              <SmallStat
                label="میانگین درصد"
                value={`${toPersianDigits(stats.averagePercent)}٪`}
              />
              <SmallStat
                label="سرعت متوسط"
                value={`${toPersianDigits(stats.averageSecondsPerQuestion)} ثانیه`}
              />
              <SmallStat
                label="کل سؤال"
                value={toPersianDigits(stats.totalQuestions)}
              />
            </div>
          )}

          {/* تاریخچه */}
          <div className="soft-card p-5">
            <h4 className="text-sm font-black text-slate-800 mb-3">جلسات گذشته</h4>

            {drills.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">
                هنوز جلسه‌ای ثبت نشده. اولین تست‌زنی‌ات را شروع کن.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {[...drills]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 12)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-800 truncate">
                          {d.subjectName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {formatJalaliKey(d.dateStr)} · {toPersianDigits(d.totalQuestions)} سؤال ·{' '}
                          {formatSeconds(d.durationSeconds)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                            d.percent >= 50
                              ? 'bg-emerald-50 text-emerald-600'
                              : d.percent >= 25
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {toPersianDigits(d.percent)}٪
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteDrill(d.id)}
                          aria-label="حذف جلسه"
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------ اجرا ------------------------------ */}
      {phase === 'running' && (
        <div className="soft-card p-5 flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">{activeSubject?.name}</span>
            <span className="text-slate-400">
              سؤال {toPersianDigits(Math.min(answered + 1, targetCount))} از{' '}
              {toPersianDigits(targetCount)}
            </span>
          </div>

          {/* نوار پیشرفت */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (answered / targetCount) * 100)}%` }}
            />
          </div>

          {/* کرنومتر سؤال جاری */}
          <div className="text-center py-2">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              زمان سؤال جاری
            </span>
            <div
              className={`text-5xl font-black tabular-nums ${
                paceDelta > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {formatSeconds(currentQuestionSeconds)}
            </div>
            <span
              className={`text-[11px] font-bold mt-1 inline-block px-2.5 py-1 rounded-full ${
                paceDelta > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {paceDelta > 0
                ? `${toPersianDigits(Math.round(paceDelta))} ثانیه عقب از هدف`
                : `${toPersianDigits(Math.abs(Math.round(paceDelta)))} ثانیه جلوتر از هدف`}
            </span>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-100 pt-3">
            <span>کل زمان: {formatSeconds(elapsed)}</span>
            <span>
              ✓ {toPersianDigits(correct)} · ✕ {toPersianDigits(wrong)} · —{' '}
              {toPersianDigits(blank)}
            </span>
          </div>

          {/* ثبت پاسخ */}
          <div className="w-full grid grid-cols-3 gap-2">
            <AnswerButton
              label="درست"
              icon={Check}
              className="bg-emerald-600 shadow-emerald-200"
              disabled={isPaused}
              onClick={() => mark('correct')}
            />
            <AnswerButton
              label="غلط"
              icon={X}
              className="bg-rose-600 shadow-rose-200"
              disabled={isPaused}
              onClick={() => mark('wrong')}
            />
            <AnswerButton
              label="نزده"
              icon={MinusCircle}
              className="bg-slate-500 shadow-slate-200"
              disabled={isPaused}
              onClick={() => mark('blank')}
            />
          </div>

          <div className="w-full grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={answered === 0}
              className="py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>برگشت</span>
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="py-2.5 rounded-2xl bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'ادامه' : 'توقف'}</span>
            </button>
            <button
              type="button"
              onClick={() => finish()}
              className="py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>پایان</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------ نتیجه ------------------------------ */}
      {phase === 'result' && (
        <div className="soft-card p-5 flex flex-col gap-4">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-400 block mb-1">درصد این جلسه</span>
            <div
              className={`text-5xl font-black ${
                computeDrillPercent(answered, correct, wrong) >= 50
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {toPersianDigits(computeDrillPercent(answered, correct, wrong))}٪
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {activeSubject?.name} · {toPersianDigits(answered)} سؤال در{' '}
              {formatSeconds(elapsed)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <SmallStat label="درست" value={toPersianDigits(correct)} tone="text-emerald-600" />
            <SmallStat label="غلط" value={toPersianDigits(wrong)} tone="text-rose-600" />
            <SmallStat label="نزده" value={toPersianDigits(blank)} tone="text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <SmallStat
              label="سرعت متوسط"
              value={`${toPersianDigits(
                answered > 0 ? Math.round(elapsed / answered) : 0,
              )} ثانیه`}
            />
            <SmallStat
              label="کندترین سؤال"
              value={`${toPersianDigits(
                perQuestion.length ? Math.max(...perQuestion) : 0,
              )} ثانیه`}
            />
          </div>

          {/* نمودار زمان هر سؤال */}
          {perQuestion.length > 1 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-600">زمان هر سؤال</span>
              </div>
              <div className="flex items-end gap-1 h-20 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                {perQuestion.map((s, i) => {
                  const max = Math.max(...perQuestion, secondsPerQuestion);
                  return (
                    <div
                      key={i}
                      title={`سؤال ${i + 1}: ${s} ثانیه`}
                      className={`flex-1 min-w-[3px] rounded-t ${
                        s > secondsPerQuestion ? 'bg-rose-400' : 'bg-emerald-400'
                      }`}
                      style={{ height: `${Math.max(6, (s / max) * 100)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[11px] text-center text-slate-400 font-medium">
            این جلسه در آمار مطالعه‌ات هم ثبت شد.
          </p>

          <button
            type="button"
            onClick={() => setPhase('setup')}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
          >
            بازگشت
          </button>
        </div>
      )}
    </div>
  );
};

const SmallStat: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone = 'text-slate-800',
}) => (
  <div className="p-2">
    <span className="text-[10px] text-slate-400 font-medium block mb-0.5">{label}</span>
    <div className={`text-sm font-black ${tone}`}>{value}</div>
  </div>
);

const AnswerButton: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, className, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`py-4 rounded-2xl text-white font-black text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-all disabled:opacity-40 ${className}`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);
