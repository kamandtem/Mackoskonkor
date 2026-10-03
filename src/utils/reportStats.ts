import { ActivityKind, StudySession, SubjectItem, TaskItem, TestDrill } from '../types/konkur';
import {
  PERSIAN_MONTHS,
  addDays,
  dateToJalaliKey,
  gregorianToJalali,
  jalaliKeyToIso,
  jalaliMonthLength,
  jalaliToGregorian,
  startOfToday,
  timeToMinutes,
  toLocalIso,
  toPersianDigits,
} from './jalali';

/* ------------------------------------------------------------------ */
/* گزارش‌های دوره‌ای — همه از روی داده‌های واقعی کاربر                     */
/* ------------------------------------------------------------------ */

export type ReportPeriod = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  thisWeek: 'این هفته',
  lastWeek: 'هفتهٔ قبل',
  thisMonth: 'این ماه',
  lastMonth: 'ماه قبل',
};

/** ترتیب ستون‌ها از شنبه تا جمعه */
export const WEEKDAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
export const WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const KIND_META: Record<ActivityKind, { label: string; color: string; soft: string }> = {
  study: { label: 'مطالعه', color: '#7c5cfa', soft: '#efeaff' },
  class: { label: 'کلاس', color: '#ff8a4c', soft: '#fff1e8' },
  other: { label: 'سایر', color: '#22c55e', soft: '#e8f9ee' },
};

const FALLBACK_COLORS = ['#7c5cfa', '#ff8a4c', '#22c55e', '#3b82f6', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444', '#6366f1', '#84cc16'];

export interface TimeWindow {
  start: number; // دقیقه از نیمه‌شب
  end: number;
  kind: ActivityKind;
  subjectName: string;
  color: string;
}

export interface ReportDay {
  iso: string;
  jalaliKey: string;
  /** ۰ = شنبه … ۶ = جمعه */
  weekdayIdx: number;
  jDay: number;
  isToday: boolean;
  isFuture: boolean;
  study: number;
  class: number;
  other: number;
  total: number;
  tests: number;
  sessions: number;
  windows: TimeWindow[];
}

export interface SubjectSlice {
  key: string;
  name: string;
  color: string;
  minutes: number;
  pct: number;
}

export interface PeriodReport {
  period: ReportPeriod;
  title: string;
  isWeek: boolean;
  days: ReportDay[];
  /** روزهایی که گذشته‌اند یا امروزند */
  elapsedDays: number;
  totals: {
    study: number;
    class: number;
    other: number;
    all: number;
    tests: number;
    sessions: number;
    activeDays: number;
    inactiveDays: number;
    longestRun: number;
  };
  kindPct: Record<ActivityKind, number>;
  subjects: SubjectSlice[];
  /** مجموع هر روز هفته (برای نمای ماهانه‌ی تفکیک روزانه) */
  byWeekday: { idx: number; study: number; class: number; other: number; total: number }[];
  hasData: boolean;
  hasTimeData: boolean;
}

const weekdayIdxOf = (d: Date) => (d.getDay() + 1) % 7;

/** بازه‌ی میلادی هر دوره (شروع و پایان شامل) */
export function periodRange(period: ReportPeriod, ref: Date = startOfToday()): { start: Date; end: Date; title: string } {
  if (period === 'thisWeek' || period === 'lastWeek') {
    const saturday = addDays(ref, -weekdayIdxOf(ref) - (period === 'lastWeek' ? 7 : 0));
    const end = addDays(saturday, 6);
    const s = gregorianToJalali(saturday.getFullYear(), saturday.getMonth() + 1, saturday.getDate());
    const e = gregorianToJalali(end.getFullYear(), end.getMonth() + 1, end.getDate());
    const title =
      s.jm === e.jm
        ? `${toPersianDigits(s.jd)} تا ${toPersianDigits(e.jd)} ${PERSIAN_MONTHS[e.jm - 1]}`
        : `${toPersianDigits(s.jd)} ${PERSIAN_MONTHS[s.jm - 1]} تا ${toPersianDigits(e.jd)} ${PERSIAN_MONTHS[e.jm - 1]}`;
    return { start: saturday, end, title };
  }
  const t = gregorianToJalali(ref.getFullYear(), ref.getMonth() + 1, ref.getDate());
  let jy = t.jy;
  let jm = t.jm;
  if (period === 'lastMonth') {
    jm -= 1;
    if (jm === 0) {
      jm = 12;
      jy -= 1;
    }
  }
  const g1 = jalaliToGregorian(jy, jm, 1);
  const start = new Date(g1.gy, g1.gm - 1, g1.gd);
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, jalaliMonthLength(jy, jm) - 1);
  return { start, end, title: `${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}` };
}

/** دوره‌ی هم‌اندازه‌ی قبلی، برای مقایسه */
export function previousPeriodRange(period: ReportPeriod): { start: Date; end: Date } {
  const { start } = periodRange(period);
  const ref = addDays(start, -1);
  return periodRange(period === 'thisWeek' || period === 'lastWeek' ? 'thisWeek' : 'thisMonth', ref);
}

export const sessionKind = (s: StudySession): ActivityKind => s.activityType ?? 'study';

/** بازه‌ی ساعتی یک جلسه؛ برای داده‌های قدیمیِ تایمر از زمان ثبت تخمین زده می‌شود */
export function sessionWindow(s: StudySession): { start: number; end: number } | null {
  if (s.startTime && s.endTime) {
    const start = timeToMinutes(s.startTime);
    let end = timeToMinutes(s.endTime);
    if (end < start) end = 24 * 60 - 1;
    return { start, end };
  }
  // جلسه‌های تایمری قدیمی دقیقاً هنگام پایان ذخیره می‌شدند
  if (s.type !== 'manual' && s.timestamp) {
    const d = new Date(s.timestamp);
    if (toLocalIso(d) !== s.isoDate) return null;
    const end = d.getHours() * 60 + d.getMinutes();
    return { start: Math.max(0, end - s.durationMinutes), end };
  }
  return null;
}

interface Inputs {
  sessions: StudySession[];
  drills: TestDrill[];
  tasks: TaskItem[];
  subjects: SubjectItem[];
}

export function buildRangeDays(start: Date, end: Date, inputs: Inputs): ReportDay[] {
  const today = startOfToday();
  const todayIso = toLocalIso(today);
  const days: ReportDay[] = [];
  const index = new Map<string, ReportDay>();
  const subjectColor = new Map(inputs.subjects.map((s) => [s.id, s.color]));

  for (let d = new Date(start); d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    const iso = toLocalIso(d);
    const key = dateToJalaliKey(d);
    const day: ReportDay = {
      iso,
      jalaliKey: key,
      weekdayIdx: weekdayIdxOf(d),
      jDay: Number(key.split('/')[2]),
      isToday: iso === todayIso,
      isFuture: d.getTime() > today.getTime(),
      study: 0,
      class: 0,
      other: 0,
      total: 0,
      tests: 0,
      sessions: 0,
      windows: [],
    };
    days.push(day);
    index.set(iso, day);
  }

  for (const s of inputs.sessions) {
    const day = index.get(s.isoDate);
    if (!day || s.durationMinutes <= 0) continue;
    const kind = sessionKind(s);
    day[kind] += s.durationMinutes;
    day.total += s.durationMinutes;
    day.sessions += 1;
    day.tests += s.questionCount ?? 0;
    const w = sessionWindow(s);
    if (w)
      day.windows.push({
        ...w,
        kind,
        subjectName: s.subjectName,
        color: subjectColor.get(s.subjectId) ?? KIND_META[kind].color,
      });
  }

  // تست‌زنی سرعتی
  for (const d of inputs.drills) {
    const day = index.get(d.isoDate);
    if (day) day.tests += d.totalQuestions;
  }

  // ردیف‌های انجام‌شده‌ی برنامه با سؤال تستی
  for (const t of inputs.tasks) {
    if (!t.isCompleted || !t.questionCount || t.questionType === 'written') continue;
    const iso = jalaliKeyToIso(t.dateStr);
    const day = iso ? index.get(iso) : undefined;
    if (day) day.tests += t.questionCount;
  }

  for (const d of days) d.windows.sort((a, b) => a.start - b.start);
  return days;
}

export function buildPeriodReport(period: ReportPeriod, inputs: Inputs): PeriodReport {
  const { start, end, title } = periodRange(period);
  const days = buildRangeDays(start, end, inputs);
  const isoSet = new Set(days.map((d) => d.iso));
  const elapsed = days.filter((d) => !d.isFuture);

  const totals = {
    study: 0,
    class: 0,
    other: 0,
    all: 0,
    tests: 0,
    sessions: 0,
    activeDays: 0,
    inactiveDays: 0,
    longestRun: 0,
  };
  let run = 0;
  for (const d of days) {
    totals.study += d.study;
    totals.class += d.class;
    totals.other += d.other;
    totals.all += d.total;
    totals.tests += d.tests;
    totals.sessions += d.sessions;
    if (d.isFuture) continue;
    if (d.total > 0) {
      totals.activeDays += 1;
      run += 1;
      totals.longestRun = Math.max(totals.longestRun, run);
    } else {
      totals.inactiveDays += 1;
      run = 0;
    }
  }

  const pctOf = (v: number) => (totals.all ? Math.round((v / totals.all) * 100) : 0);
  const kindPct = { study: pctOf(totals.study), class: pctOf(totals.class), other: pctOf(totals.other) };

  // تفکیک درسی: فقط جلسه‌های مطالعه و کلاس که درس مشخص دارند
  const subjectMap = new Map<string, SubjectSlice>();
  const subjectsById = new Map(inputs.subjects.map((s) => [s.id, s]));
  for (const s of inputs.sessions) {
    if (!isoSet.has(s.isoDate) || s.durationMinutes <= 0 || sessionKind(s) === 'other') continue;
    const known = subjectsById.get(s.subjectId);
    const key = known ? known.id : `name:${s.subjectName}`;
    const cur = subjectMap.get(key);
    if (cur) cur.minutes += s.durationMinutes;
    else
      subjectMap.set(key, {
        key,
        name: known?.name ?? s.subjectName,
        color: known?.color ?? FALLBACK_COLORS[subjectMap.size % FALLBACK_COLORS.length],
        minutes: s.durationMinutes,
        pct: 0,
      });
  }
  const subjectTotal = [...subjectMap.values()].reduce((n, s) => n + s.minutes, 0);
  const subjects = [...subjectMap.values()]
    .sort((a, b) => b.minutes - a.minutes)
    .map((s) => ({ ...s, pct: subjectTotal ? Math.round((s.minutes / subjectTotal) * 1000) / 10 : 0 }));

  const byWeekday = WEEKDAY_LABELS.map((_, idx) => {
    const own = days.filter((d) => d.weekdayIdx === idx);
    const study = own.reduce((n, d) => n + d.study, 0);
    const klass = own.reduce((n, d) => n + d.class, 0);
    const other = own.reduce((n, d) => n + d.other, 0);
    return { idx, study, class: klass, other, total: study + klass + other };
  });

  return {
    period,
    title,
    isWeek: period === 'thisWeek' || period === 'lastWeek',
    days,
    elapsedDays: elapsed.length,
    totals,
    kindPct,
    subjects,
    byWeekday,
    hasData: totals.all > 0 || totals.tests > 0,
    hasTimeData: days.some((d) => d.windows.length > 0),
  };
}

/** خلاصه‌ی دوره‌ی قبلی برای مقایسه‌ی کارت‌های نمای کلی */
export function buildPreviousTotals(period: ReportPeriod, inputs: Inputs) {
  const { start, end } = previousPeriodRange(period);
  let days = buildRangeDays(start, end, inputs);
  // دوره‌ی جاری هنوز تمام نشده: فقط با همان تعداد روزِ اولِ دوره‌ی قبل مقایسه می‌شود
  if (period === 'thisWeek' || period === 'thisMonth') {
    const cur = periodRange(period);
    const elapsedNow = Math.round((startOfToday().getTime() - cur.start.getTime()) / 86400000) + 1;
    days = days.slice(0, Math.max(1, elapsedNow));
  }
  const elapsed = days.filter((d) => !d.isFuture);
  return {
    study: days.reduce((n, d) => n + d.study, 0),
    class: days.reduce((n, d) => n + d.class, 0),
    other: days.reduce((n, d) => n + d.other, 0),
    tests: days.reduce((n, d) => n + d.tests, 0),
    sessions: days.reduce((n, d) => n + d.sessions, 0),
    activeDays: elapsed.filter((d) => d.total > 0).length,
    elapsedDays: elapsed.length || 1,
  };
}

/** کل روزهای فعال و ساعات از ابتدا — برای هدر پروفایل */
export function lifetimeSummary(sessions: StudySession[]) {
  const days = new Set<string>();
  let minutes = 0;
  for (const s of sessions) {
    if (s.durationMinutes <= 0) continue;
    days.add(s.isoDate);
    minutes += s.durationMinutes;
  }
  return { activeDays: days.size, minutes };
}
