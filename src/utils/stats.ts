import {
  StudySession,
  SubjectItem,
  TaskItem,
  TestDrill,
  UserProfile,
  MockExam,
} from '../types/konkur';
import {
  addDays,
  currentTimeMinutes,
  dateToJalaliKey,
  daysUntilJalaliKey,
  fromLocalIso,
  getCurrentJalaliWeek,
  parseJalaliKey,
  startOfToday,
  timeToMinutes,
  toLocalIso,
  todayJalaliKey,
} from './jalali';

/* ------------------------------------------------------------------ */
/* آمار مطالعه — همه‌چیز از روی جلسات واقعی کاربر محاسبه می‌شود           */
/* ------------------------------------------------------------------ */

export interface WeekDayStat {
  iso: string;
  jalaliKey: string;
  weekdayName: string;
  minutes: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface SubjectStat extends SubjectItem {
  minutes: number;
  hours: number;
  /** سهم این درس از کل مطالعه */
  sharePct: number;
  /** درصد رسیدن به هدف هفتگی */
  weeklyMinutes: number;
  weeklyGoalPct: number;
}

export interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  /** میانگین روزانه در روزهای سپری‌شده‌ی همین هفته */
  weeklyDailyAverage: number;
  longestSessionMinutes: number;
  sessionsCount: number;
  streak: number;
  longestStreak: number;
  goalPct: number;
  week: WeekDayStat[];
  subjects: SubjectStat[];
  hasAnyData: boolean;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export function computeStudyStats(
  sessions: StudySession[],
  subjects: SubjectItem[],
  profile: UserProfile,
): StudyStats {
  const todayIso = toLocalIso();
  const todayKey = todayJalaliKey();
  const todayJalali = parseJalaliKey(todayKey);

  const minutesByIso = new Map<string, number>();
  for (const s of sessions) {
    minutesByIso.set(s.isoDate, (minutesByIso.get(s.isoDate) ?? 0) + s.durationMinutes);
  }

  const week = getCurrentJalaliWeek().map<WeekDayStat>((d) => ({
    iso: d.iso,
    jalaliKey: d.jalaliKey,
    weekdayName: d.weekdayName,
    minutes: minutesByIso.get(d.iso) ?? 0,
    isToday: d.isToday,
    isFuture: d.isFuture,
  }));

  const weekIsoSet = new Set(week.map((d) => d.iso));
  const weekMinutes = sum(week.map((d) => d.minutes));
  const elapsedDaysThisWeek = week.filter((d) => !d.isFuture).length || 1;

  const monthMinutes = todayJalali
    ? sum(
        sessions
          .filter((s) => {
            const p = parseJalaliKey(s.dateStr);
            return !!p && p.jy === todayJalali.jy && p.jm === todayJalali.jm;
          })
          .map((s) => s.durationMinutes),
      )
    : 0;

  const todayMinutes = minutesByIso.get(todayIso) ?? 0;
  const totalMinutes = sum(sessions.map((s) => s.durationMinutes));

  /* استریک: روزهای متوالی که در آن‌ها مطالعه ثبت شده است.
     اگر امروز هنوز چیزی ثبت نشده، از دیروز شمرده می‌شود تا استریک الکی صفر نشود. */
  const studiedDays = new Set(
    sessions.filter((s) => s.durationMinutes > 0).map((s) => s.isoDate),
  );
  const streak = computeStreak(studiedDays);
  const longestStreak = computeLongestStreak(studiedDays);

  const totalForShare = totalMinutes || 1;
  const subjectStats = subjects
    .map<SubjectStat>((sub) => {
      const own = sessions.filter((s) => s.subjectId === sub.id);
      const minutes = sum(own.map((s) => s.durationMinutes));
      const weeklyMinutes = sum(
        own.filter((s) => weekIsoSet.has(s.isoDate)).map((s) => s.durationMinutes),
      );
      const goalMinutes = sub.weeklyGoalHours * 60;
      return {
        ...sub,
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
        sharePct: Math.round((minutes / totalForShare) * 100),
        weeklyMinutes,
        weeklyGoalPct:
          goalMinutes > 0 ? Math.min(100, Math.round((weeklyMinutes / goalMinutes) * 100)) : 0,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    totalMinutes,
    weeklyDailyAverage: Math.round(weekMinutes / elapsedDaysThisWeek),
    longestSessionMinutes: sessions.length
      ? Math.max(...sessions.map((s) => s.durationMinutes))
      : 0,
    sessionsCount: sessions.length,
    streak,
    longestStreak,
    goalPct:
      profile.dailyGoalMinutes > 0
        ? Math.min(999, Math.round((todayMinutes / profile.dailyGoalMinutes) * 100))
        : 0,
    week,
    subjects: subjectStats,
    hasAnyData: sessions.length > 0,
  };
}

function computeStreak(studiedDays: Set<string>): number {
  if (studiedDays.size === 0) return 0;
  const today = startOfToday();
  // اگر امروز ثبت نشده، از دیروز شروع کن
  let cursor = studiedDays.has(toLocalIso(today)) ? today : addDays(today, -1);
  if (!studiedDays.has(toLocalIso(cursor))) return 0;
  let count = 0;
  while (studiedDays.has(toLocalIso(cursor))) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function computeLongestStreak(studiedDays: Set<string>): number {
  if (studiedDays.size === 0) return 0;
  const dates = [...studiedDays]
    .map((iso) => fromLocalIso(iso))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i].getTime() - dates[i - 1].getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* برنامه‌ی روزانه                                                      */
/* ------------------------------------------------------------------ */

export function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function tasksForDay(tasks: TaskItem[], jalaliKey: string): TaskItem[] {
  return sortTasks(tasks.filter((t) => t.dateStr === jalaliKey));
}

export function tomorrowJalaliKey(): string {
  return dateToJalaliKey(addDays(startOfToday(), 1));
}

/**
 * «الان چی بخونم؟» — نزدیک‌ترین کار انجام‌نشده به ساعت فعلی:
 * اگر کاری در حال حاضر در بازه‌ی زمانی‌اش باشد همان، وگرنه اولین کار آینده،
 * و اگر همه‌ی ساعت‌ها گذشته باشد، اولین کار عقب‌افتاده.
 */
export function pickCurrentTask(todayTasks: TaskItem[]): {
  current: TaskItem | null;
  next: TaskItem | null;
  isOverdue: boolean;
} {
  const pending = sortTasks(todayTasks.filter((t) => !t.isCompleted));
  if (pending.length === 0) return { current: null, next: null, isOverdue: false };

  const now = currentTimeMinutes();

  const inProgress = pending.find((t) => {
    const start = timeToMinutes(t.startTime);
    return now >= start && now < start + t.durationMinutes;
  });
  if (inProgress) {
    const idx = pending.indexOf(inProgress);
    return { current: inProgress, next: pending[idx + 1] ?? null, isOverdue: false };
  }

  const upcoming = pending.find((t) => timeToMinutes(t.startTime) >= now);
  if (upcoming) {
    const idx = pending.indexOf(upcoming);
    return { current: upcoming, next: pending[idx + 1] ?? null, isOverdue: false };
  }

  return { current: pending[0], next: pending[1] ?? null, isOverdue: true };
}

/* ------------------------------------------------------------------ */
/* آزمون‌های آزمایشی                                                    */
/* ------------------------------------------------------------------ */

export interface ExamWithCountdown extends MockExam {
  daysRemaining: number;
  isPast: boolean;
}

/** آزمون‌ها را با شمارش معکوس واقعی و مرتب‌شده بر اساس تاریخ برمی‌گرداند */
export function withCountdown(exams: MockExam[]): ExamWithCountdown[] {
  return exams
    .map((e) => {
      const days = daysUntilJalaliKey(e.dateJalali) ?? 0;
      return { ...e, daysRemaining: days, isPast: days < 0 };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function nextExam(exams: MockExam[]): ExamWithCountdown | null {
  return withCountdown(exams).find((e) => !e.isPast) ?? null;
}

/* ------------------------------------------------------------------ */
/* تست‌زنی سرعتی                                                        */
/* ------------------------------------------------------------------ */

export interface DrillStats {
  totalDrills: number;
  totalQuestions: number;
  averagePercent: number;
  averageSecondsPerQuestion: number;
  bestPercent: number;
  hasAnyData: boolean;
}

export function computeDrillStats(drills: TestDrill[]): DrillStats {
  if (drills.length === 0) {
    return {
      totalDrills: 0,
      totalQuestions: 0,
      averagePercent: 0,
      averageSecondsPerQuestion: 0,
      bestPercent: 0,
      hasAnyData: false,
    };
  }
  const totalQuestions = sum(drills.map((d) => d.totalQuestions));
  const totalSeconds = sum(drills.map((d) => d.durationSeconds));
  return {
    totalDrills: drills.length,
    totalQuestions,
    averagePercent:
      Math.round((sum(drills.map((d) => d.percent)) / drills.length) * 10) / 10,
    averageSecondsPerQuestion:
      totalQuestions > 0 ? Math.round(totalSeconds / totalQuestions) : 0,
    bestPercent: Math.max(...drills.map((d) => d.percent)),
    hasAnyData: true,
  };
}
