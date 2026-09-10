export type MajorType = 'تجربی' | 'ریاضی' | 'انسانی' | 'هنر' | 'زبان';

export interface UserProfile {
  /** خالی یعنی کاربر هنوز اطلاعاتش را وارد نکرده است */
  name: string;
  major: MajorType;
  examName: string;
  /** تاریخ کنکور، میلادی به شکل YYYY-MM-DD. خالی = تعیین‌نشده */
  examTargetDate: string;
  /** تاریخ شروع آماده‌سازی، میلادی به شکل YYYY-MM-DD. خالی = تعیین‌نشده */
  startDate: string;
  dailyGoalMinutes: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  notificationsEnabled: boolean;
  /** عکس پروفایل کاربر به شکل data:image/... (خالی = بدون عکس) */
  avatarDataUrl?: string;
  /** تنها وقتی true می‌شود که کاربر اطلاعات اولیه‌اش را ثبت کرده باشد */
  isOnboarded: boolean;
}

export interface SubjectItem {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  weeklyGoalHours: number;
}

export interface TaskItem {
  id: string;
  subjectId: string;
  subjectName: string;
  activityType?: 'study' | 'class' | 'other';
  chapter?: string;
  /** کلید تاریخ شمسی با رقم لاتین: 1405/08/15 */
  dateStr: string;
  /** ساعت ۲۴ ساعته با رقم لاتین: 09:00 */
  startTime: string;
  durationMinutes: number;
  isCompleted: boolean;
  notes?: string;
  resource?: string;
  reportType?: string;
  questionType?: 'test' | 'written';
  questionCount?: number;
  color?: string;
  /** دقیقه‌های مطالعه‌ی همین ردیف که تا حالا در آمار ثبت شده است */
  loggedMinutes?: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  durationMinutes: number;
  /** کلید تاریخ شمسی با رقم لاتین: 1405/08/15 */
  dateStr: string;
  /** تاریخ محلی به شکل YYYY-MM-DD */
  isoDate: string;
  timestamp: number;
  type: 'pomodoro' | 'timer' | 'manual' | 'drill' | 'virtual' | 'physical';
}

export interface MockExam {
  id: string;
  title: string;
  /** کلید تاریخ شمسی با رقم لاتین: 1405/08/15 */
  dateJalali: string;
  importance: 'high' | 'medium' | 'normal';
}

/** یک جلسه تست‌زنی سرعتی */
export interface TestDrill {
  id: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
  durationSeconds: number;
  /** زمان صرف‌شده برای هر سؤال، به ثانیه */
  perQuestionSeconds: number[];
  /** درصد کنکوری: ((۳×صحیح) − غلط) ÷ (۳×کل) × ۱۰۰ */
  percent: number;
  dateStr: string;
  isoDate: string;
  timestamp: number;
}

export type NavTab = 'home' | 'planner' | 'focus' | 'studyHall' | 'progress' | 'report' | 'exams' | 'drill';

export type AmbientSoundId =
  | 'none'
  | 'rain'
  | 'forest'
  | 'waves'
  | 'fireplace'
  | 'whitenoise'
  | 'lofi';

export interface AmbientSound {
  id: AmbientSoundId;
  name: string;
  persianName: string;
  description: string;
}

/** ساختار کامل داده‌های کاربر برای پشتیبان‌گیری و بازیابی */
export interface AppBackup {
  app: 'konkur-man';
  schemaVersion: number;
  exportedAt: string;
  profile: UserProfile;
  subjects: SubjectItem[];
  tasks: TaskItem[];
  sessions: StudySession[];
  exams: MockExam[];
  drills: TestDrill[];
}
