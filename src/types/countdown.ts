export type CountdownStyle =
  | 'gradient-ring' // دائره‌ی متدرج رنگ
  | 'liquid-ring' // دائره‌ی با سیال
  | 'digital-earth' // عرض زمین + اعداد رقمی
  | 'mountain-progress' // کوه با مسیر پیشرفت
  | 'vertical-gauge'; // مقیاس رأسی دما‌گونه

export interface CountdownConfig {
  style: CountdownStyle;
  showLabel: boolean;
  animate: boolean;
}

export const COUNTDOWN_STYLES: CountdownStyle[] = [
  'gradient-ring',
  'liquid-ring',
  'digital-earth',
  'mountain-progress',
  'vertical-gauge',
];

export const COUNTDOWN_LABELS: Record<CountdownStyle, string> = {
  'gradient-ring': 'حلقه‌ی متدرج',
  'liquid-ring': 'حلقه‌ی سیال',
  'digital-earth': 'عرض زمین',
  'mountain-progress': 'کوه و پیشرفت',
  'vertical-gauge': 'مقیاس رأسی',
};
