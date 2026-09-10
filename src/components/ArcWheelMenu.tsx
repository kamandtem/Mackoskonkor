import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Coffee,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  BarChart2,
  Headphones,
  X,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { NavTab } from '../types/konkur';

export interface ArcMenuItem {
  id: string;
  labelFa: string;
  labelEn: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgLight: string;
  actionType: 'tab' | 'sound' | 'focus_subject' | 'break';
  targetTab?: NavTab;
  subjectName?: string;
}

interface ArcWheelMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onStartFocusSubject?: (subject: string) => void;
  onOpenSounds?: () => void;
}

export const ARC_MENU_ITEMS: ArcMenuItem[] = [
  {
    id: 'sleep',
    labelFa: 'خواب و ریکاوری',
    labelEn: 'Sleep & Rest',
    desc: 'تنظیم ساعت خواب و شارژ انرژی مغز برای یادگیری پایدار',
    icon: Moon,
    color: '#3b82f6', // آبی ملایم
    bgLight: '#eff6ff',
    actionType: 'tab',
    targetTab: 'home',
  },
  {
    id: 'break',
    labelFa: 'استراحت و تحرک',
    labelEn: 'Break & Stretch',
    desc: '۵ دقیقه کشش عضلانی، تنفس عمیق و بازیابی هشیاری بین پارت‌های مطالعه',
    icon: Coffee,
    color: '#f97316', // نارنجی
    bgLight: '#fff7ed',
    actionType: 'break',
  },
  {
    id: 'power_study',
    labelFa: 'مطالعه پرفشار و مفهومی',
    labelEn: 'Power Study',
    desc: 'یادگیری عمیق، حل تست‌های سخت و تحلیل موشکافانه درس‌ها',
    icon: Zap,
    color: '#f43f5e', // قرمز مرجانی
    bgLight: '#fff1f2',
    actionType: 'focus_subject',
    subjectName: 'مطالعه مفهومی',
  },
  {
    id: 'practice',
    labelFa: 'تست‌زنی سرعتی',
    labelEn: 'Speed Practice',
    desc: 'حل تست‌های زمان‌دار کنکور سراسری و افزایش سرعت پردازش ذهنی',
    icon: CheckCircle2,
    color: '#ec4899', // صورتی درخشان (آیتم اصلی مثل تصویر)
    bgLight: '#fdf2f8',
    actionType: 'tab',
    targetTab: 'drill',
  },
  {
    id: 'focus',
    labelFa: 'تایمر پومودورو',
    labelEn: 'Pomodoro Timer',
    desc: 'غوطه‌وری در تمرکز عمیق بدون حواس‌پرتی در سیکل‌های ۲۵ دقیقه‌ای',
    icon: Clock,
    color: '#06b6d4', // فیروزه‌ای
    bgLight: '#ecfeff',
    actionType: 'tab',
    targetTab: 'focus',
  },
  {
    id: 'review',
    labelFa: 'مرور و فلش‌کارت',
    labelEn: 'Flashcards & Review',
    desc: 'مرور سریع فرمول‌ها، لغات و نکات کلیدی با جعبه لایتنر',
    icon: Sparkles,
    color: '#eab308', // زرد کهربایی
    bgLight: '#fefce8',
    actionType: 'tab',
    targetTab: 'planner',
  },
  {
    id: 'mock_exam',
    labelFa: 'آزمون آزمایشی',
    labelEn: 'Mock Exam',
    desc: 'شبیه‌سازی شرایط واقعی جلسه کنکور و مدیریت زمان و استرس',
    icon: Award,
    color: '#a855f7', // بنفش ملایم
    bgLight: '#faf5ff',
    actionType: 'tab',
    targetTab: 'exams',
  },
  {
    id: 'analytics',
    labelFa: 'کارنامه و تراز',
    labelEn: 'Rank & Stats',
    desc: 'تحلیل ترازها، درصد پاسخگویی و نقاط قوت و ضعف مباحث',
    icon: BarChart2,
    color: '#10b981', // سبز زمردی
    bgLight: '#ecfdf5',
    actionType: 'tab',
    targetTab: 'progress',
  },
  {
    id: 'sounds',
    labelFa: 'صداهای تمرکز',
    labelEn: 'Ambient Waves',
    desc: 'نویز سفید، صدای باران و امواج آرامش‌بخش برای مطالعه بی‌صدا',
    icon: Headphones,
    color: '#6366f1', // نیلی
    bgLight: '#eef2ff',
    actionType: 'sound',
  },
];

export const ArcWheelMenu: React.FC<ArcWheelMenuProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onStartFocusSubject,
  onOpenSounds,
}) => {
  // Center default item is index 3 (تست‌زنی سرعتی - Pink hero)
  const [selectedIndex, setSelectedIndex] = useState(3);
  const [scrollOffset, setScrollOffset] = useState(3);
  const [isDragging, setIsDragging] = useState(false);

  const wheelAreaRef = useRef<HTMLDivElement | null>(null);
  const [wheelDims, setWheelDims] = useState({ width: 375, height: 520 });

  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);

  // Measure wheel area dynamically
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (wheelAreaRef.current) {
        const rect = wheelAreaRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setWheelDims({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Sync scrollOffset when selectedIndex changes outside drag
  useEffect(() => {
    if (!isDragging) {
      setScrollOffset(selectedIndex);
    }
  }, [selectedIndex, isDragging]);

  // Centered Arc geometry parameters
  // Apex of arc is brought towards the horizontal center of the container
  const itemAngleStep = 14; // degrees between items
  const radius = Math.min(340, wheelDims.height * 0.62);
  const apexX = wheelDims.width * 0.58; // Center the apex near middle of view
  const arcCenterX = apexX + radius; // Circle center to the right
  const arcCenterY = wheelDims.height / 2; // Vertical middle

  // Pointer drag events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartOffset.current = scrollOffset;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY.current;
    // ~55px drag equals 1 item movement
    const deltaItems = -deltaY / 55;
    const newOffset = dragStartOffset.current + deltaItems;
    const clamped = Math.max(-0.4, Math.min(ARC_MENU_ITEMS.length - 0.6, newOffset));
    setScrollOffset(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const nearest = Math.round(scrollOffset);
    const finalIndex = Math.max(0, Math.min(ARC_MENU_ITEMS.length - 1, nearest));
    setSelectedIndex(finalIndex);
    setScrollOffset(finalIndex);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(ARC_MENU_ITEMS.length - 1, selectedIndex + delta));
    setSelectedIndex(newIndex);
  };

  const handleExecuteAction = (item: ArcMenuItem) => {
    if (item.actionType === 'tab' && item.targetTab) {
      onNavigateTab(item.targetTab);
      onClose();
    } else if (item.actionType === 'sound') {
      if (onOpenSounds) onOpenSounds();
      onClose();
    } else if (item.actionType === 'focus_subject' && item.subjectName) {
      if (onStartFocusSubject) onStartFocusSubject(item.subjectName);
      onNavigateTab('focus');
      onClose();
    } else if (item.actionType === 'break') {
      if (onStartFocusSubject) onStartFocusSubject('استراحت و تنفس');
      onNavigateTab('focus');
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentActiveItem = ARC_MENU_ITEMS[selectedIndex] || ARC_MENU_ITEMS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-3"
      onClick={onClose}
    >
      {/* Phone Canvas Frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[390px] h-[780px] max-h-[96vh] bg-[#f4f5f8] rounded-[44px] shadow-[0_30px_90px_rgba(0,0,0,0.25)] border-[7px] border-white relative overflow-hidden flex flex-col justify-between select-none touch-none"
      >
        {/* TOP STATUS BAR & HEADER */}
        <div className="pt-5 px-5 flex items-center justify-between z-20">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              منوی قوسی فعالیت‌ها
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              چرخش و انتخاب مستقیم
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prev = Math.max(0, selectedIndex - 1);
                setSelectedIndex(prev);
              }}
              title="قبلی"
              className="w-8 h-8 rounded-xl bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-2xs border border-slate-100 active:scale-90"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const next = Math.min(ARC_MENU_ITEMS.length - 1, selectedIndex + 1);
                setSelectedIndex(next);
              }}
              title="بعدی"
              className="w-8 h-8 rounded-xl bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-2xs border border-slate-100 active:scale-90"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE CENTERED CURVED WHEEL CONTAINER */}
        <div
          ref={wheelAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex-1 w-full overflow-hidden flex items-center cursor-grab active:cursor-grabbing"
        >
          {/* Centered SVG Arc Guide Line */}
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

          {/* DARK INDICATOR NOTCH (Capsule pill on the centered arc at the equator) */}
          <div
            className="absolute z-20 pointer-events-none transition-transform duration-150"
            style={{
              left: `${apexX - 12}px`,
              top: `${arcCenterY - 5}px`,
            }}
          >
            <div className="w-6 h-2.5 bg-[#20293a] rounded-full shadow-xs" />
          </div>

          {/* WHEEL ITEMS ALONG THE CENTERED ARC */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {ARC_MENU_ITEMS.map((item, idx) => {
              const diff = idx - scrollOffset;

              // Hide items that are too far from center
              if (Math.abs(diff) > 4.2) return null;

              // Angle in radians (0 at equator)
              const angleDeg = diff * itemAngleStep;
              const angleRad = (angleDeg * Math.PI) / 180;

              // Coordinates on circular arc
              const posX = arcCenterX - radius * Math.cos(angleRad);
              const posY = arcCenterY + radius * Math.sin(angleRad);

              const isSelected = Math.abs(diff) < 0.45;
              const opacity = Math.max(0.2, 1 - Math.abs(diff) * 0.22);
              const scale = isSelected ? 1.08 : Math.max(0.85, 1 - Math.abs(diff) * 0.04);

              const ItemIcon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setScrollOffset(idx);
                  }}
                  className="absolute pointer-events-auto cursor-pointer flex items-center transition-transform duration-75 ease-out"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: `translate(-100%, -50%) scale(${scale})`,
                    opacity: opacity,
                    zIndex: isSelected ? 30 : 10,
                  }}
                >
                  {/* PERSIAN LABEL BADGE (To the left of icon) */}
                  <div className="flex items-center gap-2 mr-3">
                    {isSelected ? (
                      /* ACTIVE FLOATING WHITE PILL IN PERSIAN */
                      <div className="bg-white px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-[14px] font-black text-slate-900 whitespace-nowrap">
                          {item.labelFa}
                        </span>
                      </div>
                    ) : (
                      /* INACTIVE SOFT PERSIAN TEXT */
                      <div className="text-right">
                        <span className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                          {item.labelFa}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ICON BUTTON ON THE ARC */}
                  <div className="relative flex items-center justify-center">
                    {isSelected ? (
                      /* ACTIVE ICON (Surrounded by vibrant pill outline, like pink bike in reference) */
                      <div
                        className="px-3.5 py-1.5 rounded-full flex items-center justify-center transition-all shadow-xs"
                        style={{
                          border: `2px solid ${item.color}`,
                          backgroundColor: `${item.color}15`,
                        }}
                      >
                        <ItemIcon
                          className="w-5 h-5 stroke-[2.4]"
                          style={{ color: item.color }}
                        />
                      </div>
                    ) : (
                      /* INACTIVE SOFT SQUIRCLE ICON */
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: item.bgLight,
                        }}
                      >
                        <ItemIcon
                          className="w-4 h-4 stroke-[2]"
                          style={{ color: item.color }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ACTIVE ACTION BAR IN PURE PERSIAN */}
        <div className="relative z-20 pb-7 pt-3 px-6 bg-gradient-to-t from-[#f4f5f8] via-[#f4f5f8] to-transparent flex flex-col gap-2.5">
          {/* Active Item Description card */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-between">
            <div className="text-right flex-1 pr-1">
              <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                <span>{currentActiveItem.labelFa}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currentActiveItem.color }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-1">
                {currentActiveItem.desc}
              </p>
            </div>
            <button
              onClick={() => handleExecuteAction(currentActiveItem)}
              className="ml-3 px-4 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              style={{
                backgroundColor: currentActiveItem.color,
                boxShadow: `0 6px 18px -2px ${currentActiveItem.color}55`,
              }}
            >
              <span>شروع</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick swipe hint in Persian */}
          <div className="text-center text-[11px] text-slate-400 font-medium">
            انگشت خود را به بالا و پایین بکشید یا روی فعالیت‌ها ضربه بزنید
          </div>
        </div>
      </div>
    </div>
  );
};
