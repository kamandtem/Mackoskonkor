import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  DatabaseBackup,
  Headphones,
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
  telegramUrl?: string;
  instagramUrl?: string;
}

export const ARC_MENU_ITEMS: ArcMenuItem[] = [
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
    id: 'planner',
    labelFa: 'برنامه‌ریزی',
    icon: Calendar,
    color: '#10b981',
    bgLight: '#ecfdf5',
    actionType: 'tab',
    targetTab: 'planner',
  },
  {
    id: 'power_study',
    labelFa: 'مطالعه پرفشار',
    icon: Zap,
    color: '#f43f5e',
    bgLight: '#fff1f2',
    actionType: 'focus_subject',
    subjectName: 'مطالعه مفهومی',
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
    labelFa: 'تایمر',
    icon: Clock,
    color: '#06b6d4',
    bgLight: '#ecfeff',
    actionType: 'tab',
    targetTab: 'focus',
  },
  {
    id: 'break',
    labelFa: 'استراحت',
    icon: Coffee,
    color: '#f97316',
    bgLight: '#fff7ed',
    actionType: 'break',
  },
  {
    id: 'manual_log',
    labelFa: 'ثبت دستی',
    icon: PenLine,
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    actionType: 'manual_log',
  },
  {
    id: 'exams',
    labelFa: 'آزمون‌ها',
    icon: Award,
    color: '#a855f7',
    bgLight: '#faf5ff',
    actionType: 'tab',
    targetTab: 'exams',
  },
  {
    id: 'progress',
    labelFa: 'پیشرفت',
    icon: BarChart2,
    color: '#22c55e',
    bgLight: '#f0fdf4',
    actionType: 'tab',
    targetTab: 'progress',
  },
  {
    id: 'sounds',
    labelFa: 'صدا‌ها',
    icon: Headphones,
    color: '#6366f1',
    bgLight: '#eef2ff',
    actionType: 'sound',
  },
  {
    id: 'profile',
    labelFa: 'پروفایل',
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
    labelFa: 'درباره',
    icon: Info,
    color: '#64748b',
    bgLight: '#f1f5f9',
    actionType: 'about',
  },
  {
    id: 'reset',
    labelFa: 'پاک‌سازی',
    icon: Trash2,
    color: '#ef4444',
    bgLight: '#fef2f2',
    actionType: 'reset',
  },
];

const pad2 = (value: number) => toPersianDigits(String(Math.max(0, value)).padStart(2, '0'));

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
          <span className="text-[12px] font-black">تاریخ نامشخص</span>
        </span>
      )}
    </button>
  );
};

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
  const [selectedIndex, setSelectedIndex] = useState(Math.floor(ARC_MENU_ITEMS.length / 2));
  const [scrollOffset, setScrollOffset] = useState(selectedIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const wheelAreaRef = useRef<HTMLDivElement | null>(null);
  const [wheelDims, setWheelDims] = useState({ width: 375, height: 560 });

  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      const rect = wheelAreaRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        setWheelDims({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  useEffect(() => {
    if (!isDragging) setScrollOffset(selectedIndex);
  }, [selectedIndex, isDragging]);

  const halfHeight = Math.max(120, wheelDims.height / 2 - 26);
  const bulge = Math.max(70, wheelDims.width * 0.34);
  const radius = (halfHeight * halfHeight + bulge * bulge) / (2 * bulge);
  const maxAngleDeg = (Math.asin(Math.min(1, halfHeight / radius)) * 180) / Math.PI;
  const itemAngleStep = (2 * maxAngleDeg) / Math.max(1, ARC_MENU_ITEMS.length - 1);
  const spacing = (itemAngleStep * Math.PI * radius) / 180;
  const apexX = wheelDims.width * 0.56;
  const arcCenterX = apexX + radius;
  const arcCenterY = wheelDims.height / 2;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartX.current = event.clientX;
    dragStartOffset.current = scrollOffset;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = event.clientX - dragStartX.current;
    const deltaItems = deltaX / Math.max(28, spacing);
    const newOffset = dragStartOffset.current + deltaItems;
    setScrollOffset(Math.max(-0.4, Math.min(ARC_MENU_ITEMS.length - 0.6, newOffset)));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    const nearest = Math.round(scrollOffset);
    const finalIndex = Math.max(0, Math.min(ARC_MENU_ITEMS.length - 1, nearest));
    setSelectedIndex(finalIndex);
    setScrollOffset(finalIndex);
  };

  // سوایپ به راست (swipe right to close/go back)
  const handleSwipeRight = () => {
    if (scrollOffset < 0.5) {
      // اولین آیتم: بپرس "خارج میشوید؟"
      handleTripleTap();
    } else {
      // یکی برگرده
      const newIndex = selectedIndex - 1;
      setSelectedIndex(Math.max(0, newIndex));
    }
  };

  const handleTripleTap = () => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 500);
    } else if (tapCount.current === 3) {
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      setShowExitDialog(true);
    }
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
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-[#f4f5f8] relative overflow-hidden flex flex-col select-none touch-none shadow-2xl"
      >
        {/* ریل سمت چپ */}
        <div className="absolute left-3 safe-sheet-top z-30 flex flex-col gap-2">
          <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.07)]">
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.07)] flex flex-col gap-1">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center active:scale-90 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-9 h-9 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center active:scale-90 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-3xl p-1.5 border border-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.07)] flex flex-col gap-1">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center active:scale-90 transition-all"
            >
              <Send className="w-4 h-4" />
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center active:scale-90 transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* قوس تعاملی */}
        <div
          ref={wheelAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
        >
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
                    if (isSelected) handleExecuteAction(item);
                    else {
                      setSelectedIndex(index);
                      setScrollOffset(index);
                    }
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
                      <div className="bg-white px-3 py-1.5 rounded-full shadow-[0_4px_16px_rgba(15,23,42,0.09)] border border-slate-100">
                        <span className="text-[13px] font-black text-slate-900 whitespace-nowrap">
                          {item.labelFa}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] font-bold text-slate-400 whitespace-nowrap">
                        {item.labelFa}
                      </span>
                    )}
                  </div>

                  <div>
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

        {/* پایین */}
        <div className="relative z-20 px-4 pt-2 safe-sheet-bottom">
          <div className="bg-white rounded-[26px] p-2.5 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex items-center gap-2.5">
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
              className="px-3 h-[64px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-[12px] flex items-center gap-1 shadow-[0_8px_20px_rgba(251,191,36,0.45)] active:scale-95 transition-all shrink-0"
            >
              <span>شروع</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dialog خروج */}
      {showExitDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setShowExitDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-4 animate-in scale-in-95 duration-200"
          >
            <h2 className="text-lg font-black text-slate-800 mb-2">خارج میشوید؟</h2>
            <p className="text-sm text-slate-600 mb-5">
              همه‌ی پیشرفتت ذخیره می‌شود. می‌تونی بعداً برگردی و ادامه بدی.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm active:scale-95"
              >
                نه، ادامه می‌دم
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowExitDialog(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-sm active:scale-95"
              >
                بله، خارج میشم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
