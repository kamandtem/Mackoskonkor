import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  DatabaseBackup,
  Headphones,
  Layers3,
  Home,
  Info,
  Instagram,
  Moon,
  PenLine,
  Send,
  Settings,
  Sun,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import { NavTab, UserProfile } from '../types/konkur';
import { ThemeMode } from '../utils/theme';
import { toPersianDigits } from '../utils/jalali';

type ArcAction =
  | 'tab'
  | 'sound'
  | 'focus_subject'
  | 'break'
  | 'profile'
  | 'manual_log'
  | 'backup'
  | 'about'
  | 'reset';

export interface ArcMenuItem {
  id: string;
  labelFa: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgLight: string;
  actionType: ArcAction;
  targetTab?: NavTab;
  subjectName?: string;
}

interface ArcWheelMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onStartFocusSubject: (subject: string) => void;
  onOpenSounds: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenManualLog: () => void;
  onOpenBackup: () => void;
  onOpenAbout: () => void;
  onResetData: () => void;
  /** بعداً به آدرس واقعی وصل می‌شود */
  telegramUrl?: string;
  instagramUrl?: string;
}

/** همه‌ی بخش‌های برنامه در یک منو — منوی کشویی قدیمی حذف شده است */
const ARC_MENU_ITEMS_BASE: ArcMenuItem[] = [
  {
    id: 'home',
    labelFa: 'خانه',
    icon: Home,
    color: '#0ea5e9',
    bgLight: '#e0f2fe',
    actionType: 'tab',
    targetTab: 'home',
  },
  {
    id: 'flashcards',
    labelFa: 'فلش‌کارت‌ها',
    icon: Layers3,
    color: '#7c3aed',
    bgLight: '#f3e8ff',
    actionType: 'tab',
    targetTab: 'flashcards',
  },
  {
    id: 'planner',
    labelFa: 'برنامه‌ریزی',
    icon: Calendar,
    color: '#10b981',
    bgLight: '#ecfdf5',
    actionType: 'tab',
    targetTab: 'planner',
  },
  {
    id: 'schedule',
    labelFa: 'زمان‌بندی مطالعه',
    icon: Clock,
    color: '#6d5dfb',
    bgLight: '#eeecff',
    actionType: 'tab',
    targetTab: 'schedule',
  },
  {
    id: 'advisors',
    labelFa: 'مشاوره و مدرسان',
    icon: Award,
    color: '#f97316',
    bgLight: '#fff1e8',
    actionType: 'tab',
    targetTab: 'advisors',
  },
  {
    id: 'drill',
    labelFa: 'تست‌زنی سرعتی',
    icon: CheckCircle2,
    color: '#ec4899',
    bgLight: '#fdf2f8',
    actionType: 'tab',
    targetTab: 'drill',
  },
  {
    id: 'focus',
    labelFa: 'تایمر پومودورو',
    icon: Clock,
    color: '#06b6d4',
    bgLight: '#ecfeff',
    actionType: 'tab',
    targetTab: 'focus',
  },
  {
    id: 'break',
    labelFa: 'استراحت و تحرک',
    icon: Coffee,
    color: '#f97316',
    bgLight: '#fff7ed',
    actionType: 'break',
  },
  {
    id: 'manual_log',
    labelFa: 'ثبت مطالعه',
    icon: PenLine,
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    actionType: 'manual_log',
  },
  {
    id: 'exams',
    labelFa: 'آزمون آزمایشی',
    icon: Award,
    color: '#a855f7',
    bgLight: '#faf5ff',
    actionType: 'tab',
    targetTab: 'exams',
  },
  {
    id: 'progress',
    labelFa: 'کارنامه و تراز',
    icon: BarChart2,
    color: '#22c55e',
    bgLight: '#f0fdf4',
    actionType: 'tab',
    targetTab: 'report',
  },
  {
    id: 'sounds',
    labelFa: 'صداهای تمرکز',
    icon: Headphones,
    color: '#6366f1',
    bgLight: '#eef2ff',
    actionType: 'sound',
  },
  {
    id: 'profile',
    labelFa: 'پروفایل من',
    icon: User,
    color: '#eab308',
    bgLight: '#fefce8',
    actionType: 'profile',
  },
  {
    id: 'backup',
    labelFa: 'پشتیبان‌گیری',
    icon: DatabaseBackup,
    color: '#14b8a6',
    bgLight: '#f0fdfa',
    actionType: 'backup',
  },
  {
    id: 'about',
    labelFa: 'درباره‌ی برنامه',
    icon: Info,
    color: '#64748b',
    bgLight: '#f1f5f9',
    actionType: 'about',
  },
  {
    id: 'reset',
    labelFa: 'پاک کردن داده‌ها',
    icon: Trash2,
    color: '#ef4444',
    bgLight: '#fef2f2',
    actionType: 'reset',
  },
];

const MENU_PRIORITY = ['home','planner','focus','schedule','manual_log','drill','progress','exams','flashcards','advisors','break','sounds','profile','backup','about','reset'];
export const ARC_MENU_ITEMS: ArcMenuItem[] = [...ARC_MENU_ITEMS_BASE].sort((a,b)=>MENU_PRIORITY.indexOf(a.id)-MENU_PRIORITY.indexOf(b.id));

const pad2 = (value: number) => toPersianDigits(String(Math.max(0, value)).padStart(2, '0'));

/** شمارش معکوس تا روز کنکور روی تصویر زمین */
const EarthCountdown: React.FC<{ targetIso: string; onPress: () => void }> = ({
  targetIso,
  onPress,
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!targetIso) return null;
    const target = new Date(`${targetIso}T08:00:00`).getTime();
    if (Number.isNaN(target)) return null;
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
    };
  }, [targetIso, now]);

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex-1 min-w-0 relative rounded-2xl overflow-hidden h-[64px] bg-slate-900 bg-cover bg-center active:scale-[0.99] transition-transform"
      style={{ backgroundImage: "url('/earth-countdown.jpg')" }}
      title="تاریخ کنکور"
    >
      <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/35 to-transparent" />

      {remaining ? (
        <span className="relative flex items-center justify-center gap-2 h-full px-2" dir="ltr">
          {[
            { value: remaining.days, label: 'روز' },
            { value: remaining.hours, label: 'ساعت' },
            { value: remaining.minutes, label: 'دقیقه' },
            { value: remaining.seconds, label: 'ثانیه' },
          ].map((part, index) => (
            <React.Fragment key={part.label}>
              {index > 0 && (
                <span className="text-white/50 text-base font-black -mt-2">:</span>
              )}
              <span className="flex flex-col items-center leading-none">
                <span className="text-white text-lg font-black tabular-nums drop-shadow">
                  {pad2(part.value)}
                </span>
                <span className="text-[9px] font-bold text-white/70 mt-0.5">{part.label}</span>
              </span>
            </React.Fragment>
          ))}
        </span>
      ) : (
        <span className="relative flex flex-col items-center justify-center h-full text-white">
          <span className="text-[12px] font-black">تاریخ کنکور تعیین نشده</span>
          <span className="text-[10px] font-bold text-white/70 mt-0.5">
            برای تنظیم لمس کنید
          </span>
        </span>
      )}
    </button>
  );
};

const RailButton: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: string;
}> = ({ label, onClick, children, tone }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all ${
      tone ?? 'bg-slate-50 text-slate-500 hover:text-slate-800'
    }`}
  >
    {children}
  </button>
);

export const ArcWheelMenu: React.FC<ArcWheelMenuProps> = ({
  isOpen,
  onClose,
  profile,
  theme,
  onToggleTheme,
  onNavigateTab,
  onStartFocusSubject,
  onOpenSounds,
  onOpenSettings,
  onOpenProfile,
  onOpenManualLog,
  onOpenBackup,
  onOpenAbout,
  onResetData,
  telegramUrl = '#',
  instagramUrl = '#',
}) => {
  const itemsCount = ARC_MENU_ITEMS.length;
  const middleIndex = Math.floor(itemsCount / 2);

  const [selectedIndex, setSelectedIndex] = useState(middleIndex);
  const [scrollOffset, setScrollOffset] = useState(middleIndex);
  const [isDragging, setIsDragging] = useState(false);

  const wheelAreaRef = useRef<HTMLDivElement | null>(null);
  const [wheelDims, setWheelDims] = useState({ width: 375, height: 560 });

  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const dragDistance = useRef(0);

  /* ---------------------------------------------------------------- */
  /* کشیدن به سمت راست برای بستن منو                                   */
  /* حرکت عمودی گزینه‌ها دست‌نخورده می‌ماند: محور حرکت قفل می‌شود        */
  /* ---------------------------------------------------------------- */
  const SWIPE_CLOSE_PX = 96;
  const [dragX, setDragX] = useState(0);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);
  const [isSwipingOut, setIsSwipingOut] = useState(false);
  const swipeActive = useRef(false);
  const swipeStart = useRef({ x: 0, y: 0 });
  const gestureAxis = useRef<'none' | 'x' | 'y'>('none');
  const dragXRef = useRef(0);
  const closeTimer = useRef<number | null>(null);

  const setDrag = (value: number) => {
    dragXRef.current = value;
    setDragX(value);
  };

  useEffect(() => {
    if (isOpen) {
      setDrag(0);
      setIsSwipeDragging(false);
      setIsSwipingOut(false);
      swipeActive.current = false;
      gestureAxis.current = 'none';
    }
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [isOpen]);

  const handleSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isSwipingOut) return;
    swipeActive.current = true;
    gestureAxis.current = 'none';
    swipeStart.current = { x: event.clientX, y: event.clientY };
    setDrag(0);
  };

  const handleSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeActive.current) return;
    const deltaX = event.clientX - swipeStart.current.x;
    const deltaY = event.clientY - swipeStart.current.y;

    if (gestureAxis.current === 'none' && (Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12)) {
      gestureAxis.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.5 ? 'x' : 'y';
      if (gestureAxis.current === 'x') {
        setIsSwipeDragging(true);
        // قوس سر جای خودش می‌ماند؛ این حرکت فقط بستن منو است
        setScrollOffset(selectedIndex);
      }
    }

    if (gestureAxis.current !== 'x') return;
    setDrag(Math.max(0, deltaX));
  };

  const handleSheetPointerUp = () => {
    if (!swipeActive.current) return;
    swipeActive.current = false;
    const shouldClose = gestureAxis.current === 'x' && dragXRef.current > SWIPE_CLOSE_PX;
    gestureAxis.current = 'none';
    setIsSwipeDragging(false);

    if (shouldClose) {
      setIsSwipingOut(true);
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        onClose();
      }, 190);
      return;
    }

    setDrag(0);
  };

  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      const rect = wheelAreaRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setWheelDims({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const raf = window.requestAnimationFrame(updateSize);
    window.addEventListener('resize', updateSize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) setScrollOffset(selectedIndex);
  }, [selectedIndex, isDragging]);

  /* ---------------------------------------------------------------- */
  /* هندسه‌ی قوس — قوس کوچک‌تر و بازتر تا همه‌ی گزینه‌ها در کادر جا شوند */
  /* ---------------------------------------------------------------- */
  // نیم‌ارتفاع قابل استفاده و برآمدگی افقی قوس؛ شعاع از همین دو به دست می‌آید
  // تا هم همه‌ی گزینه‌ها در کادر جا شوند و هم قوس از لبه‌ی صفحه بیرون نزند.
  const halfHeight = Math.max(120, wheelDims.height / 2 - 26);
  const bulge = Math.max(70, wheelDims.width * 0.34);
  const radius = (halfHeight * halfHeight + bulge * bulge) / (2 * bulge);
  const maxAngleDeg = (Math.asin(Math.min(1, halfHeight / radius)) * 180) / Math.PI;
  const itemAngleStep = (2 * maxAngleDeg) / Math.max(1, itemsCount - 1);
  const spacing = (itemAngleStep * Math.PI * radius) / 180;
  const apexX = wheelDims.width * 0.56;
  const arcCenterX = apexX + radius;
  const arcCenterY = wheelDims.height / 2;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartY.current = event.clientY;
    dragStartX.current = event.clientX;
    dragStartOffset.current = scrollOffset;
    dragDistance.current = 0;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // بی‌اهمیت
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = event.clientY - dragStartY.current;
    const deltaX = event.clientX - dragStartX.current;
    dragDistance.current = Math.max(
      dragDistance.current,
      Math.abs(deltaY),
      Math.abs(deltaX),
    );
    // کشیدن افقی کار بستن منو است، نه چرخاندن قوس
    if (gestureAxis.current === 'x') return;
    const newOffset = dragStartOffset.current + -deltaY / Math.max(28, spacing);
    setScrollOffset(Math.max(-0.4, Math.min(itemsCount - 0.6, newOffset)));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // بی‌اهمیت
    }
    const nearest = Math.round(scrollOffset);
    const finalIndex = Math.max(0, Math.min(itemsCount - 1, nearest));
    setSelectedIndex(finalIndex);
    setScrollOffset(finalIndex);
  };

  const handleWheel = (event: React.WheelEvent) => {
    const delta = event.deltaY > 0 ? 1 : -1;
    setSelectedIndex((prev) => Math.max(0, Math.min(itemsCount - 1, prev + delta)));
  };

  const handleExecuteAction = (item: ArcMenuItem) => {
    switch (item.actionType) {
      case 'tab':
        if (item.targetTab) onNavigateTab(item.targetTab);
        break;
      case 'sound':
        onOpenSounds();
        break;
      case 'focus_subject':
        if (item.subjectName) onStartFocusSubject(item.subjectName);
        else onNavigateTab('focus');
        break;
      case 'break':
        onStartFocusSubject('استراحت و تنفس');
        break;
      case 'profile':
        onOpenProfile();
        break;
      case 'manual_log':
        onOpenManualLog();
        break;
      case 'backup':
        onOpenBackup();
        break;
      case 'about':
        onOpenAbout();
        break;
      case 'reset':
        onResetData();
        break;
      default:
        break;
    }
    onClose();
  };

  if (!isOpen) return null;

  const activeItem = ARC_MENU_ITEMS[selectedIndex] ?? ARC_MENU_ITEMS[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-150 flex justify-center"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handleSheetPointerDown}
        onPointerMove={handleSheetPointerMove}
        onPointerUp={handleSheetPointerUp}
        onPointerCancel={handleSheetPointerUp}
        className="w-full max-w-md h-full bg-[#f4f5f8] relative overflow-hidden flex flex-col select-none touch-none shadow-2xl"
        style={{
          transform: isSwipingOut ? 'translateX(110%)' : `translateX(${dragX}px)`,
          opacity: isSwipingOut ? 0 : 1,
          transition: isSwipeDragging
            ? 'none'
            : 'transform 200ms ease-out, opacity 200ms ease-out',
        }}
      >
        {/* ریل سمت چپ: بستن، تنظیمات، تم */}
        <div className="absolute left-3 safe-sheet-top z-30 flex flex-col gap-2">
          <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.07)]">
            <RailButton label="بستن منو" onClick={onClose}>
              <X className="w-4 h-4" />
            </RailButton>
          </div>

          <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.07)] flex flex-col gap-1">
            <RailButton
              label="تنظیمات"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
            >
              <Settings className="w-4 h-4" />
            </RailButton>
            <RailButton
              label={theme === 'dark' ? 'تم روشن' : 'تم تاریک'}
              onClick={onToggleTheme}
              tone="bg-amber-50 text-amber-500"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </RailButton>
          </div>
        </div>

        {/* قوس تعاملی */}
        <div
          ref={wheelAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
        >
          {/* خط راهنمای قوس */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${wheelDims.width} ${wheelDims.height}`}
          >
            <circle
              cx={arcCenterX}
              cy={arcCenterY}
              r={radius}
              fill="none"
              stroke="#dce1ea"
              strokeWidth="2.5"
            />
          </svg>

          {/* نشانگر تیره روی قوس */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{ left: `${apexX - 12}px`, top: `${arcCenterY - 5}px` }}
          >
            <div className="w-6 h-2.5 bg-[#20293a] rounded-full shadow-xs" />
          </div>

          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {ARC_MENU_ITEMS.map((item, index) => {
              const diff = index - scrollOffset;
              const angleRad = (diff * itemAngleStep * Math.PI) / 180;
              const posX = arcCenterX - radius * Math.cos(angleRad);
              const posY = arcCenterY + radius * Math.sin(angleRad);

              const isSelected = Math.abs(diff) < 0.45;
              const opacity = Math.max(0.28, 1 - Math.abs(diff) * 0.12);
              const scale = isSelected ? 1.06 : Math.max(0.86, 1 - Math.abs(diff) * 0.02);
              const ItemIcon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (dragDistance.current > 8) return;
                    if (isSelected) {
                      handleExecuteAction(item);
                      return;
                    }
                    setSelectedIndex(index);
                    setScrollOffset(index);
                  }}
                  className="absolute pointer-events-auto cursor-pointer flex items-center transition-transform duration-75 ease-out"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: `translate(-100%, -50%) scale(${scale})`,
                    opacity,
                    zIndex: isSelected ? 30 : 10,
                  }}
                >
                  <div className="flex items-center gap-2 mr-3">
                    {isSelected ? (
                      <div className="bg-white px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(15,23,42,0.09)] border border-slate-100 flex items-center gap-2">
                        <span className="text-[14px] font-black text-slate-900 whitespace-nowrap">
                          {item.labelFa}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12.5px] font-bold text-slate-400 whitespace-nowrap">
                        {item.labelFa}
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center justify-center">
                    {isSelected ? (
                      <div
                        className="px-3.5 py-1.5 rounded-full flex items-center justify-center shadow-xs"
                        style={{
                          border: `2px solid ${item.color}`,
                          backgroundColor: `${item.color}15`,
                        }}
                      >
                        <ItemIcon className="w-5 h-5 stroke-[2.4]" style={{ color: item.color }} />
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: item.bgLight }}
                      >
                        <ItemIcon className="w-4 h-4 stroke-[2]" style={{ color: item.color }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* پایین منو: شمارش معکوس روی تصویر زمین + دکمه‌ی «بزن بریم» + شبکه‌های اجتماعی */}
        <div className="relative z-20 px-4 pt-2 safe-sheet-bottom">
          <div className="bg-white rounded-[26px] p-2.5 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <EarthCountdown
                targetIso={profile.examTargetDate}
                onPress={() => {
                  onOpenSettings();
                  onClose();
                }}
              />

              <button
                type="button"
                onClick={() => handleExecuteAction(activeItem)}
                className="px-4 h-[64px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-[13px] flex items-center gap-1.5 shadow-[0_8px_20px_rgba(251,191,36,0.45)] active:scale-95 transition-all shrink-0"
              >
                <span>بزن بریم</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.6]" />
              </button>
            </div>

            {/* زیر شمارش معکوس: تلگرام و اینستاگرام — فلت و خاکستری */}
            <div className="flex items-center justify-center gap-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                title="کانال تلگرام"
                aria-label="کانال تلگرام"
                className="w-10 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-all"
              >
                <Send className="w-[17px] h-[17px]" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                title="پیج اینستاگرام"
                aria-label="پیج اینستاگرام"
                className="w-10 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90 transition-all"
              >
                <Instagram className="w-[17px] h-[17px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
