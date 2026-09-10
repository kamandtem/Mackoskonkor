import {
  AppBackup,
  MajorType,
  MockExam,
  NoteItem,
  StudySession,
  SubjectItem,
  TaskItem,
  TestDrill,
  UserProfile,
} from '../types/konkur';
import { normalizeJalaliKey, normalizeTime, todayJalaliKey, toLocalIso } from './jalali';

export const SCHEMA_VERSION = 2;
export const APP_VERSION = '2.6.0';

const STORAGE_KEYS = {
  PROFILE: 'konkur_profile_v2',
  SUBJECTS: 'konkur_subjects_v2',
  TASKS: 'konkur_tasks_v2',
  SESSIONS: 'konkur_sessions_v2',
  EXAMS: 'konkur_exams_v2',
  DRILLS: 'konkur_drills_v2',
  NOTES: 'konkur_notes_v1',
} as const;

/** کلیدهای نسخه‌ی قبلی که داده‌ی نمونه در آن‌ها ریخته می‌شد */
const LEGACY_KEYS = [
  'konkur_user_profile_v1',
  'konkur_subjects_v1',
  'konkur_tasks_v1',
  'konkur_sessions_v1',
  'konkur_exams_v1',
];

/* ------------------------------------------------------------------ */
/* دروس پیش‌فرض هر رشته — تنها به عنوان پیشنهاد اولیه پس از ثبت‌نام      */
/* ------------------------------------------------------------------ */

export const SUBJECTS_BY_MAJOR: Record<MajorType, SubjectItem[]> = {
  تجربی: [
    { id: 'sub-zist', name: 'زیست‌شناسی', color: '#10b981', bgLight: '#ecfdf5', weeklyGoalHours: 12 },
    { id: 'sub-shimi', name: 'شیمی', color: '#8b5cf6', bgLight: '#f5f3ff', weeklyGoalHours: 8 },
    { id: 'sub-fizik', name: 'فیزیک', color: '#3b82f6', bgLight: '#eff6ff', weeklyGoalHours: 8 },
    { id: 'sub-riazi-t', name: 'ریاضیات تجربی', color: '#f59e0b', bgLight: '#fffbeb', weeklyGoalHours: 7 },
    { id: 'sub-zamin', name: 'زمین‌شناسی', color: '#06b6d4', bgLight: '#ecfeff', weeklyGoalHours: 3 },
    { id: 'sub-adabiat', name: 'ادبیات فارسی', color: '#ec4899', bgLight: '#fdf2f8', weeklyGoalHours: 4 },
    { id: 'sub-arabi', name: 'عربی', color: '#14b8a6', bgLight: '#f0fdfa', weeklyGoalHours: 4 },
    { id: 'sub-dini', name: 'دین و زندگی', color: '#22c55e', bgLight: '#f0fdf4', weeklyGoalHours: 3 },
    { id: 'sub-zaban', name: 'زبان انگلیسی', color: '#6366f1', bgLight: '#eef2ff', weeklyGoalHours: 3 },
  ],
  ریاضی: [
    { id: 'sub-hesaban', name: 'حسابان و دیفرانسیل', color: '#3b82f6', bgLight: '#eff6ff', weeklyGoalHours: 10 },
    { id: 'sub-fizik-r', name: 'فیزیک', color: '#8b5cf6', bgLight: '#f5f3ff', weeklyGoalHours: 10 },
    { id: 'sub-shimi-r', name: 'شیمی', color: '#10b981', bgLight: '#ecfdf5', weeklyGoalHours: 8 },
    { id: 'sub-hendese', name: 'هندسه', color: '#f59e0b', bgLight: '#fffbeb', weeklyGoalHours: 6 },
    { id: 'sub-gosaste', name: 'گسسته و آمار', color: '#ec4899', bgLight: '#fdf2f8', weeklyGoalHours: 5 },
    { id: 'sub-adabiat', name: 'ادبیات فارسی', color: '#f43f5e', bgLight: '#fff1f2', weeklyGoalHours: 4 },
    { id: 'sub-arabi', name: 'عربی', color: '#14b8a6', bgLight: '#f0fdfa', weeklyGoalHours: 4 },
    { id: 'sub-dini', name: 'دین و زندگی', color: '#22c55e', bgLight: '#f0fdf4', weeklyGoalHours: 3 },
    { id: 'sub-zaban', name: 'زبان انگلیسی', color: '#6366f1', bgLight: '#eef2ff', weeklyGoalHours: 3 },
  ],
  انسانی: [
    { id: 'sub-falsafe', name: 'فلسفه و منطق', color: '#8b5cf6', bgLight: '#f5f3ff', weeklyGoalHours: 8 },
    { id: 'sub-arabi-e', name: 'عربی تخصصی', color: '#3b82f6', bgLight: '#eff6ff', weeklyGoalHours: 7 },
    { id: 'sub-fonoon', name: 'فنون ادبی', color: '#ec4899', bgLight: '#fdf2f8', weeklyGoalHours: 8 },
    { id: 'sub-riazi-e', name: 'ریاضی و آمار', color: '#f59e0b', bgLight: '#fffbeb', weeklyGoalHours: 6 },
    { id: 'sub-eghtesad', name: 'اقتصاد', color: '#10b981', bgLight: '#ecfdf5', weeklyGoalHours: 5 },
    { id: 'sub-jamee', name: 'جامعه‌شناسی', color: '#06b6d4', bgLight: '#ecfeff', weeklyGoalHours: 5 },
    { id: 'sub-tarikh', name: 'تاریخ و جغرافیا', color: '#a855f7', bgLight: '#faf5ff', weeklyGoalHours: 6 },
    { id: 'sub-adabiat', name: 'ادبیات فارسی', color: '#f43f5e', bgLight: '#fff1f2', weeklyGoalHours: 4 },
    { id: 'sub-dini', name: 'دین و زندگی', color: '#22c55e', bgLight: '#f0fdf4', weeklyGoalHours: 3 },
    { id: 'sub-zaban', name: 'زبان انگلیسی', color: '#6366f1', bgLight: '#eef2ff', weeklyGoalHours: 3 },
  ],
  هنر: [
    { id: 'sub-darke-honari', name: 'درک عمومی هنر', color: '#a855f7', bgLight: '#faf5ff', weeklyGoalHours: 8 },
    { id: 'sub-darke-riazi', name: 'درک عمومی ریاضی و فیزیک', color: '#3b82f6', bgLight: '#eff6ff', weeklyGoalHours: 6 },
    { id: 'sub-tarsim', name: 'ترسیم فنی', color: '#f59e0b', bgLight: '#fffbeb', weeklyGoalHours: 5 },
    { id: 'sub-khalaghiat', name: 'خلاقیت تصویری و تجسمی', color: '#ec4899', bgLight: '#fdf2f8', weeklyGoalHours: 6 },
    { id: 'sub-khalaghiat-n', name: 'خلاقیت نمایشی', color: '#14b8a6', bgLight: '#f0fdfa', weeklyGoalHours: 4 },
    { id: 'sub-khaghiat-m', name: 'خواص مواد', color: '#06b6d4', bgLight: '#ecfeff', weeklyGoalHours: 3 },
    { id: 'sub-adabiat', name: 'ادبیات فارسی', color: '#f43f5e', bgLight: '#fff1f2', weeklyGoalHours: 4 },
    { id: 'sub-dini', name: 'دین و زندگی', color: '#22c55e', bgLight: '#f0fdf4', weeklyGoalHours: 3 },
    { id: 'sub-zaban', name: 'زبان انگلیسی', color: '#6366f1', bgLight: '#eef2ff', weeklyGoalHours: 3 },
  ],
  زبان: [
    { id: 'sub-zaban-tak', name: 'زبان تخصصی انگلیسی', color: '#6366f1', bgLight: '#eef2ff', weeklyGoalHours: 12 },
    { id: 'sub-vocab', name: 'واژگان و اصطلاحات', color: '#8b5cf6', bgLight: '#f5f3ff', weeklyGoalHours: 7 },
    { id: 'sub-grammar', name: 'گرامر', color: '#3b82f6', bgLight: '#eff6ff', weeklyGoalHours: 7 },
    { id: 'sub-reading', name: 'درک مطلب (Reading)', color: '#10b981', bgLight: '#ecfdf5', weeklyGoalHours: 8 },
    { id: 'sub-cloze', name: 'کلوز تست', color: '#f59e0b', bgLight: '#fffbeb', weeklyGoalHours: 4 },
    { id: 'sub-adabiat', name: 'ادبیات فارسی', color: '#f43f5e', bgLight: '#fff1f2', weeklyGoalHours: 4 },
    { id: 'sub-arabi', name: 'عربی', color: '#14b8a6', bgLight: '#f0fdfa', weeklyGoalHours: 4 },
    { id: 'sub-dini', name: 'دین و زندگی', color: '#22c55e', bgLight: '#f0fdf4', weeklyGoalHours: 3 },
  ],
};

export const ALL_MAJORS: MajorType[] = ['تجربی', 'ریاضی', 'انسانی', 'هنر', 'زبان'];

export function getDefaultSubjects(major: MajorType): SubjectItem[] {
  // کپی عمیق تا ویرایش کاربر روی مقادیر پیش‌فرض اثر نگذارد
  return (SUBJECTS_BY_MAJOR[major] ?? SUBJECTS_BY_MAJOR['تجربی']).map((s) => ({ ...s }));
}

/* ------------------------------------------------------------------ */
/* پروفایل خالی — نقطه‌ی شروع برنامه، بدون هیچ داده‌ی ساختگی             */
/* ------------------------------------------------------------------ */

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  major: 'تجربی',
  examName: 'کنکور سراسری',
  examTargetDate: '',
  startDate: '',
  dailyGoalMinutes: 360,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  notificationsEnabled: true,
  avatarDataUrl: '',
  isOnboarded: false,
};

/* ------------------------------------------------------------------ */
/* خواندن و نوشتن امن                                                  */
/* ------------------------------------------------------------------ */

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* حافظه پر است یا حالت خصوصی مرورگر — بی‌صدا رد می‌شویم */
  }
}

/* ------------------------------------------------------------------ */
/* پاک‌سازی و اعتبارسنجی ورودی‌ها                                       */
/* ------------------------------------------------------------------ */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

function sanitizeIso(value: unknown): string {
  const s = str(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

/** فقط عکس‌های محلی (data URL) و حداکثر ~۱.۵ مگابایت پذیرفته می‌شود */
function sanitizeAvatar(raw: unknown): string {
  const value = typeof raw === 'string' ? raw : '';
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return '';
  if (value.length > 1_600_000) return '';
  return value;
}

export function sanitizeProfile(raw: unknown): UserProfile | null {
  if (!isObj(raw)) return null;
  const major = ALL_MAJORS.includes(raw.major as MajorType)
    ? (raw.major as MajorType)
    : 'تجربی';
  return {
    name: str(raw.name).trim().slice(0, 40),
    major,
    examName: str(raw.examName).trim().slice(0, 60) || 'کنکور سراسری',
    examTargetDate: sanitizeIso(raw.examTargetDate),
    startDate: sanitizeIso(raw.startDate),
    dailyGoalMinutes: num(raw.dailyGoalMinutes, 360, 30, 900),
    pomodoroWorkMinutes: num(raw.pomodoroWorkMinutes, 25, 5, 180),
    pomodoroBreakMinutes: num(raw.pomodoroBreakMinutes, 5, 1, 60),
    notificationsEnabled: raw.notificationsEnabled !== false,
    avatarDataUrl: sanitizeAvatar(raw.avatarDataUrl),
    isOnboarded: raw.isOnboarded === true,
  };
}

function sanitizeSubjects(raw: unknown): SubjectItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out = raw.filter(isObj).map((s, i) => ({
    id: str(s.id) || `sub-${i}-${Date.now()}`,
    name: str(s.name).trim().slice(0, 40) || 'درس بی‌نام',
    color: /^#[0-9a-fA-F]{6}$/.test(str(s.color)) ? str(s.color) : '#6366f1',
    bgLight: /^#[0-9a-fA-F]{6}$/.test(str(s.bgLight)) ? str(s.bgLight) : '#eef2ff',
    weeklyGoalHours: num(s.weeklyGoalHours, 4, 0, 80),
  }));
  return out;
}

function sanitizeTasks(raw: unknown): TaskItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((t, i) => {
      const dateStr = normalizeJalaliKey(str(t.dateStr)) ?? todayJalaliKey();
      return {
        id: str(t.id) || `task-${Date.now()}-${i}`,
        subjectId: str(t.subjectId),
        subjectName: str(t.subjectName).trim().slice(0, 40) || 'مطالعه آزاد',
        activityType: (['study', 'class', 'other'].includes(str(t.activityType)) ? str(t.activityType) : 'study') as TaskItem['activityType'],
        chapter: str(t.chapter).trim().slice(0, 100) || undefined,
        dateStr,
        startTime: normalizeTime(str(t.startTime)),
        durationMinutes: num(t.durationMinutes, 45, 5, 600),
        isCompleted: t.isCompleted === true,
        notes: str(t.notes).slice(0, 200) || undefined,
        resource: str(t.resource).trim().slice(0, 100) || undefined,
        reportType: str(t.reportType).trim().slice(0, 60) || undefined,
        questionType: (['test', 'written'].includes(str(t.questionType)) ? str(t.questionType) : undefined) as TaskItem['questionType'],
        questionCount: t.questionCount == null ? undefined : num(t.questionCount, 0, 0, 1000),
        color: /^#[0-9a-fA-F]{6}$/.test(str(t.color)) ? str(t.color) : undefined,
        loggedMinutes: num(t.loggedMinutes, 0, 0, 1440),
      };
    });
}

function sanitizeNotes(raw: unknown): NoteItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObj).map((n, i) => ({
    id: str(n.id) || `note-${Date.now()}-${i}`,
    title: str(n.title).trim().slice(0, 100) || 'یادداشت بدون عنوان',
    content: str(n.content).slice(0, 20000),
    color: ['peach','lavender','lilac','butter','sky','rose'].includes(str(n.color)) ? str(n.color) : 'peach',
    createdAt: str(n.createdAt) || new Date().toISOString(),
    updatedAt: str(n.updatedAt) || str(n.createdAt) || new Date().toISOString(),
  }));
}

function sanitizeSessions(raw: unknown): StudySession[] {
  if (!Array.isArray(raw)) return [];
  const allowed = ['pomodoro', 'timer', 'manual', 'drill', 'virtual', 'physical'];
  return raw.filter(isObj).map((s, i) => {
    const iso = sanitizeIso(s.isoDate) || toLocalIso();
    return {
      id: str(s.id) || `sess-${Date.now()}-${i}`,
      subjectId: str(s.subjectId),
      subjectName: str(s.subjectName).trim().slice(0, 40) || 'مطالعه آزاد',
      durationMinutes: num(s.durationMinutes, 0, 0, 1440),
      isoDate: iso,
      dateStr: normalizeJalaliKey(str(s.dateStr)) ?? todayJalaliKey(),
      timestamp: num(s.timestamp, Date.now(), 0, Number.MAX_SAFE_INTEGER),
      type: (allowed.includes(str(s.type)) ? str(s.type) : 'manual') as StudySession['type'],
    };
  });
}

function sanitizeExams(raw: unknown): MockExam[] {
  if (!Array.isArray(raw)) return [];
  const allowed = ['high', 'medium', 'normal'];
  return raw
    .filter(isObj)
    .map((e, i) => {
      const dateJalali = normalizeJalaliKey(str(e.dateJalali));
      if (!dateJalali) return null;
      return {
        id: str(e.id) || `exam-${Date.now()}-${i}`,
        title: str(e.title).trim().slice(0, 80) || 'آزمون آزمایشی',
        dateJalali,
        importance: (allowed.includes(str(e.importance))
          ? str(e.importance)
          : 'normal') as MockExam['importance'],
      };
    })
    .filter((e): e is MockExam => e !== null);
}

function sanitizeDrills(raw: unknown): TestDrill[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObj).map((d, i) => {
    const total = num(d.totalQuestions, 0, 0, 500);
    const correct = num(d.correct, 0, 0, total);
    const wrong = num(d.wrong, 0, 0, total);
    const blank = Math.max(0, total - correct - wrong);
    return {
      id: str(d.id) || `drill-${Date.now()}-${i}`,
      subjectId: str(d.subjectId),
      subjectName: str(d.subjectName).trim().slice(0, 40) || 'مطالعه آزاد',
      totalQuestions: total,
      correct,
      wrong,
      blank,
      durationSeconds: num(d.durationSeconds, 0, 0, 86400),
      perQuestionSeconds: Array.isArray(d.perQuestionSeconds)
        ? d.perQuestionSeconds.map((v) => num(v, 0, 0, 3600))
        : [],
      percent: computeDrillPercent(total, correct, wrong),
      dateStr: normalizeJalaliKey(str(d.dateStr)) ?? todayJalaliKey(),
      isoDate: sanitizeIso(d.isoDate) || toLocalIso(),
      timestamp: num(d.timestamp, Date.now(), 0, Number.MAX_SAFE_INTEGER),
    };
  });
}

/** درصد کنکوری استاندارد با نمره منفی یک‌سوم */
export function computeDrillPercent(total: number, correct: number, wrong: number): number {
  if (total <= 0) return 0;
  const pct = ((correct * 3 - wrong) / (total * 3)) * 100;
  return Math.round(Math.max(-33.33, Math.min(100, pct)) * 10) / 10;
}

/* ------------------------------------------------------------------ */
/* خواندن — هیچ‌کدام داده‌ی نمونه نمی‌سازند و هیچ‌کدام روی حافظه نمی‌نویسند */
/* ------------------------------------------------------------------ */

export function loadProfile(): UserProfile {
  return sanitizeProfile(readJson(STORAGE_KEYS.PROFILE)) ?? { ...EMPTY_PROFILE };
}

/** null یعنی کاربر هنوز دروسی نساخته است */
export function loadSubjects(): SubjectItem[] | null {
  return sanitizeSubjects(readJson(STORAGE_KEYS.SUBJECTS));
}

export function loadTasks(): TaskItem[] {
  return sanitizeTasks(readJson(STORAGE_KEYS.TASKS));
}

export function loadSessions(): StudySession[] {
  return sanitizeSessions(readJson(STORAGE_KEYS.SESSIONS));
}

export function loadExams(): MockExam[] {
  return sanitizeExams(readJson(STORAGE_KEYS.EXAMS));
}

export function loadDrills(): TestDrill[] {
  return sanitizeDrills(readJson(STORAGE_KEYS.DRILLS));
}

export function loadNotes(): NoteItem[] {
  return sanitizeNotes(readJson(STORAGE_KEYS.NOTES));
}

/* ------------------------------------------------------------------ */
/* نوشتن                                                               */
/* ------------------------------------------------------------------ */

export const saveProfile = (v: UserProfile) => writeJson(STORAGE_KEYS.PROFILE, v);
export const saveSubjects = (v: SubjectItem[]) => writeJson(STORAGE_KEYS.SUBJECTS, v);
export const saveTasks = (v: TaskItem[]) => writeJson(STORAGE_KEYS.TASKS, v);
export const saveSessions = (v: StudySession[]) => writeJson(STORAGE_KEYS.SESSIONS, v);
export const saveExams = (v: MockExam[]) => writeJson(STORAGE_KEYS.EXAMS, v);
export const saveDrills = (v: TestDrill[]) => writeJson(STORAGE_KEYS.DRILLS, v);
export const saveNotes = (v: NoteItem[]) => writeJson(STORAGE_KEYS.NOTES, v);

/** همه‌ی داده‌های کاربر را پاک می‌کند و برنامه به حالت روز اول برمی‌گردد */
export function clearAllData(): void {
  try {
    [...Object.values(STORAGE_KEYS), ...LEGACY_KEYS].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* پشتیبان‌گیری و بازیابی                                              */
/* ------------------------------------------------------------------ */

export function buildBackup(data: {
  profile: UserProfile;
  subjects: SubjectItem[];
  tasks: TaskItem[];
  sessions: StudySession[];
  exams: MockExam[];
  drills: TestDrill[];
  notes: NoteItem[];
}): AppBackup {
  return {
    app: 'konkur-man',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

export interface ParsedBackup {
  profile: UserProfile;
  subjects: SubjectItem[];
  tasks: TaskItem[];
  sessions: StudySession[];
  exams: MockExam[];
  drills: TestDrill[];
}

/** فایل پشتیبان کاربر را می‌خواند. در صورت نامعتبر بودن، خطای فارسی می‌دهد */
export function parseBackup(rawText: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('فایل انتخاب‌شده یک فایل پشتیبان معتبر نیست.');
  }
  if (!isObj(parsed)) {
    throw new Error('ساختار فایل پشتیبان قابل خواندن نیست.');
  }
  const profile = sanitizeProfile(parsed.profile);
  if (!profile) {
    throw new Error('اطلاعات پروفایل در این فایل پیدا نشد.');
  }
  const subjects = sanitizeSubjects(parsed.subjects);
  return {
    profile: { ...profile, isOnboarded: true },
    subjects: subjects && subjects.length > 0 ? subjects : getDefaultSubjects(profile.major),
    tasks: sanitizeTasks(parsed.tasks),
    sessions: sanitizeSessions(parsed.sessions),
    exams: sanitizeExams(parsed.exams),
    drills: sanitizeDrills(parsed.drills),
    notes: sanitizeNotes(parsed.notes),
  };
}
