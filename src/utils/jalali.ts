/**
 * ابزار تاریخ شمسی و بومی‌سازی — کاملاً آفلاین و بدون وابستگی بیرونی
 *
 * قواعد این فایل:
 *  - همه‌ی تاریخ‌های ذخیره‌شده با رقم لاتین‌اند (1405/08/15) تا قابل مقایسه و مرتب‌سازی باشند.
 *  - تبدیل به رقم فارسی فقط در لحظه‌ی نمایش انجام می‌شود.
 *  - تاریخ میلادی همیشه بر مبنای تقویم محلی دستگاه محاسبه می‌شود، نه UTC.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

/** ارقام فارسی و عربی را به لاتین تبدیل می‌کند */
export function toLatinDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/** با ایندکس Date.getDay() خوانده می‌شود: ۰ = یکشنبه */
export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

/* ------------------------------------------------------------------ */
/* تبدیل تقویم                                                          */
/* ------------------------------------------------------------------ */

export function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number,
): { jy: number; jm: number; jd: number } {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDaysInMonth[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number,
): { gy: number; gm: number; gd: number } {
  const jy2 = jy + 1595;
  let days =
    -355668 +
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const monthLengths = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  while (gm < 13 && days >= monthLengths[gm]) {
    days -= monthLengths[gm];
    gm++;
  }
  return { gy, gm, gd: days + 1 };
}

/** تعداد روزهای یک ماه شمسی */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * کبیسه بودن سال شمسی را از خودِ توابع تبدیل استخراج می‌کند تا هیچ‌گاه با
 * تقویم واقعی ناهمخوان نشود: اگر ۳۰ اسفند وجود داشته باشد، سال کبیسه است.
 */
export function isJalaliLeapYear(jy: number): boolean {
  const { gy, gm, gd } = jalaliToGregorian(jy, 12, 30);
  const probe = new Date(gy, gm - 1, gd);
  const back = gregorianToJalali(
    probe.getFullYear(),
    probe.getMonth() + 1,
    probe.getDate(),
  );
  return back.jy === jy && back.jm === 12 && back.jd === 30;
}

/* ------------------------------------------------------------------ */
/* تاریخ میلادی محلی (بدون خطای UTC)                                    */
/* ------------------------------------------------------------------ */

/** YYYY-MM-DD بر اساس تقویم محلی دستگاه (جایگزین امن toISOString) */
export function toLocalIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromLocalIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(toLatinDigits(iso).trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ */
/* کلید تاریخ شمسی: 1405/08/15                                          */
/* ------------------------------------------------------------------ */

export function dateToJalaliKey(date: Date = new Date()): string {
  const { jy, jm, jd } = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return `${jy}/${pad2(jm)}/${pad2(jd)}`;
}

export function todayJalaliKey(): string {
  return dateToJalaliKey(new Date());
}

/** ورودی را با رقم فارسی یا لاتین و با جداکننده / - . می‌پذیرد */
export function parseJalaliKey(
  key: string | null | undefined,
): { jy: number; jm: number; jd: number } | null {
  if (!key) return null;
  const parts = toLatinDigits(key)
    .trim()
    .split(/[/\-.]/)
    .map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [jy, jm, jd] = parts;
  if (jy < 1200 || jy > 1700) return null;
  if (jm < 1 || jm > 12) return null;
  if (jd < 1 || jd > jalaliMonthLength(jy, jm)) return null;
  return { jy, jm, jd };
}

/** کلید شمسی را نرمال می‌کند؛ اگر نامعتبر باشد null برمی‌گرداند */
export function normalizeJalaliKey(key: string | null | undefined): string | null {
  const p = parseJalaliKey(key);
  return p ? `${p.jy}/${pad2(p.jm)}/${pad2(p.jd)}` : null;
}

export function jalaliKeyToDate(key: string | null | undefined): Date | null {
  const p = parseJalaliKey(key);
  if (!p) return null;
  const { gy, gm, gd } = jalaliToGregorian(p.jy, p.jm, p.jd);
  const d = new Date(gy, gm - 1, gd);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDaysToJalaliKey(key: string, days: number): string {
  const d = jalaliKeyToDate(key);
  if (!d) return key;
  return dateToJalaliKey(addDays(d, days));
}

export function isoToJalaliKey(iso: string): string | null {
  const d = fromLocalIso(iso);
  return d ? dateToJalaliKey(d) : null;
}

export function jalaliKeyToIso(key: string): string | null {
  const d = jalaliKeyToDate(key);
  return d ? toLocalIso(d) : null;
}

/** «۱۵ آبان ۱۴۰۵» */
export function formatJalaliKey(key: string, withYear = true): string {
  const p = parseJalaliKey(key);
  if (!p) return '';
  const base = `${toPersianDigits(p.jd)} ${PERSIAN_MONTHS[p.jm - 1]}`;
  return withYear ? `${base} ${toPersianDigits(p.jy)}` : base;
}

/** «شنبه ۱۵ آبان» */
export function formatJalaliKeyWithWeekday(key: string): string {
  const d = jalaliKeyToDate(key);
  if (!d) return '';
  return `${PERSIAN_WEEKDAYS[d.getDay()]} ${formatJalaliKey(key, false)}`;
}

export function getCurrentJalaliDate(): {
  year: number;
  month: number;
  day: number;
  weekdayName: string;
  monthName: string;
  formattedText: string;
  dateKey: string;
} {
  const now = new Date();
  const { jy, jm, jd } = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
  return {
    year: jy,
    month: jm,
    day: jd,
    weekdayName: PERSIAN_WEEKDAYS[now.getDay()],
    monthName: PERSIAN_MONTHS[jm - 1],
    formattedText: `${PERSIAN_WEEKDAYS[now.getDay()]} ${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]}`,
    dateKey: `${jy}/${pad2(jm)}/${pad2(jd)}`,
  };
}

/** هفته‌ی جاری از شنبه تا جمعه */
export function getCurrentJalaliWeek(): {
  iso: string;
  jalaliKey: string;
  weekdayName: string;
  isToday: boolean;
  isFuture: boolean;
}[] {
  const today = startOfToday();
  // شنبه = getDay() 6 ← فاصله تا شنبه‌ی همین هفته
  const backToSaturday = (today.getDay() + 1) % 7;
  const saturday = addDays(today, -backToSaturday);
  const todayIso = toLocalIso(today);

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(saturday, i);
    const iso = toLocalIso(d);
    return {
      iso,
      jalaliKey: dateToJalaliKey(d),
      weekdayName: PERSIAN_WEEKDAYS[d.getDay()],
      isToday: iso === todayIso,
      isFuture: d.getTime() > today.getTime(),
    };
  });
}

/* ------------------------------------------------------------------ */
/* ساعت                                                                */
/* ------------------------------------------------------------------ */

/** هر ورودی‌ای را به HH:MM لاتین تبدیل می‌کند؛ در صورت شکست مقدار پیش‌فرض */
export function normalizeTime(value: string | null | undefined, fallback = '09:00'): string {
  const m = /^(\d{1,2})\s*[:.]\s*(\d{1,2})$/.exec(toLatinDigits(value).trim());
  if (!m) return fallback;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${pad2(h)}:${pad2(min)}`;
}

/** HH:MM ← دقیقه از نیمه‌شب */
export function timeToMinutes(value: string): number {
  const t = normalizeTime(value, '00:00');
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const clamped = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

export function formatTime(value: string): string {
  return toPersianDigits(normalizeTime(value, '00:00'));
}

export function currentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/* ------------------------------------------------------------------ */
/* قالب‌بندی مدت زمان                                                   */
/* ------------------------------------------------------------------ */

export function formatMinutesToPersian(minutes: number): string {
  if (!minutes || minutes <= 0) return '۰ دقیقه';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0 && mins > 0) {
    return `${toPersianDigits(hrs)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  }
  if (hrs > 0) return `${toPersianDigits(hrs)} ساعت`;
  return `${toPersianDigits(mins)} دقیقه`;
}

/** «۲س ۳۰د» — برای کارت‌های کوچک */
export function formatMinutesShort(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes || 0));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs === 0) return `${toPersianDigits(mins)} دقیقه`;
  if (mins === 0) return `${toPersianDigits(hrs)} ساعت`;
  return `${toPersianDigits(hrs)}س ${toPersianDigits(mins)}د`;
}

export function formatMinutesCompact(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes || 0));
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${toPersianDigits(hrs)}:${toPersianDigits(pad2(mins))}`;
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${toPersianDigits(pad2(m))}:${toPersianDigits(pad2(s))}`;
}

/* ------------------------------------------------------------------ */
/* شمارش معکوس                                                         */
/* ------------------------------------------------------------------ */

/** روزهای باقی‌مانده تا یک تاریخ میلادی. null اگر تاریخ تعیین نشده باشد */
export function daysUntilIso(iso: string | null | undefined): number | null {
  const target = fromLocalIso(iso || '');
  if (!target) return null;
  const today = startOfToday();
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** روزهای باقی‌مانده تا یک تاریخ شمسی. منفی = گذشته */
export function daysUntilJalaliKey(key: string | null | undefined): number | null {
  const target = jalaliKeyToDate(key);
  if (!target) return null;
  const today = startOfToday();
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** سازگاری با کد قبلی: روزهای باقی‌مانده، هرگز منفی نمی‌شود */
export function calculateDaysRemaining(targetIso: string | null | undefined): number {
  const d = daysUntilIso(targetIso);
  return d === null ? 0 : Math.max(0, d);
}

export function calculateProgressPercentage(
  startIso: string | null | undefined,
  targetIso: string | null | undefined,
): number {
  const start = fromLocalIso(startIso || '');
  const target = fromLocalIso(targetIso || '');
  if (!start || !target) return 0;
  const startMs = start.getTime();
  const targetMs = target.getTime();
  if (targetMs <= startMs) return 100;
  const now = startOfToday().getTime();
  if (now <= startMs) return 0;
  if (now >= targetMs) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - startMs) / (targetMs - startMs)) * 100)));
}
