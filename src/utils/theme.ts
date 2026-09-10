export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'konkur-man:theme';

/** تم ذخیره‌شده؛ اگر چیزی ذخیره نشده باشد از تنظیم سیستم پیروی می‌کند */
export function loadTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // بی‌اهمیت
  }
  return 'light';
}

export function saveTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // بی‌اهمیت
  }
}

/** کلاس dark را روی ریشه‌ی سند اعمال می‌کند */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mode === 'dark' ? '#0b1220' : '#f0f4f8');
}
