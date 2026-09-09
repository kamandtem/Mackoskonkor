import React from 'react';
import {
  Award,
  BarChart2,
  Calendar,
  ChevronLeft,
  DatabaseBackup,
  Flame,
  Gauge,
  Info,
  Music4,
  Settings,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { NavTab, UserProfile } from '../types/konkur';
import { APP_VERSION } from '../utils/storage';
import { formatMinutesShort, toPersianDigits } from '../utils/jalali';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  streak: number;
  todayMinutes: number;
  daysRemaining: number | null;
  onNavigate: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenSounds: () => void;
  onOpenBackup: () => void;
  onOpenAbout: () => void;
  onResetData: () => void;
}

interface MenuEntry {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  action: () => void;
}

/**
 * منوی اصلی برنامه. با لمس عکس کاربر در هدر باز می‌شود.
 * هر آیتم اینجا یک مقصد واقعی دارد — هیچ گزینه‌ی بی‌صفحه‌ای در منو نیست.
 */
export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  profile,
  streak,
  todayMinutes,
  daysRemaining,
  onNavigate,
  onOpenSettings,
  onOpenSounds,
  onOpenBackup,
  onOpenAbout,
  onResetData,
}) => {
  const go = (fn: () => void) => () => {
    onClose();
    fn();
  };

  const sections: { title: string; items: MenuEntry[] }[] = [
    {
      title: 'بخش‌های برنامه',
      items: [
        {
          key: 'drill',
          label: 'تست‌زنی سرعتی',
          description: 'کرنومتر سؤال‌به‌سؤال با محاسبه‌ی درصد',
          icon: Gauge,
          tone: 'bg-rose-50 text-rose-600',
          action: go(() => onNavigate('drill')),
        },
        {
          key: 'exams',
          label: 'آزمون‌های آزمایشی',
          description: 'تقویم آزمون‌ها با شمارش معکوس',
          icon: Award,
          tone: 'bg-purple-50 text-purple-600',
          action: go(() => onNavigate('exams')),
        },
        {
          key: 'progress',
          label: 'آمار و پیشرفت',
          description: 'نمودار هفتگی و تفکیک دروس',
          icon: BarChart2,
          tone: 'bg-sky-50 text-sky-600',
          action: go(() => onNavigate('progress')),
        },
        {
          key: 'planner',
          label: 'برنامه‌ریزی روزانه',
          description: 'جدول زمانی امروز و فردا',
          icon: Calendar,
          tone: 'bg-emerald-50 text-emerald-600',
          action: go(() => onNavigate('planner')),
        },
        {
          key: 'focus',
          label: 'تایمر تمرکز',
          description: 'پومودورو با ثبت خودکار مطالعه',
          icon: Timer,
          tone: 'bg-indigo-50 text-indigo-600',
          action: go(() => onNavigate('focus')),
        },
      ],
    },
    {
      title: 'ابزارها',
      items: [
        {
          key: 'sounds',
          label: 'صداهای تمرکز',
          description: 'نویز و صدای محیط، بدون اینترنت',
          icon: Music4,
          tone: 'bg-amber-50 text-amber-600',
          action: go(onOpenSounds),
        },
        {
          key: 'settings',
          label: 'تنظیمات',
          description: 'نام، رشته، تاریخ کنکور و اهداف',
          icon: Settings,
          tone: 'bg-slate-100 text-slate-600',
          action: go(onOpenSettings),
        },
        {
          key: 'backup',
          label: 'پشتیبان‌گیری و بازیابی',
          description: 'ذخیره یا بازگردانی اطلاعات از فایل',
          icon: DatabaseBackup,
          tone: 'bg-teal-50 text-teal-600',
          action: go(onOpenBackup),
        },
        {
          key: 'about',
          label: 'درباره‌ی برنامه',
          description: `نسخه ${toPersianDigits(APP_VERSION)}`,
          icon: Info,
          tone: 'bg-slate-100 text-slate-500',
          action: go(onOpenAbout),
        },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* پرده */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* کشو — در چیدمان راست‌به‌چپ از سمت راست باز می‌شود */}
      <aside
        className={`absolute top-0 right-0 h-full w-[86%] max-w-[330px] bg-[#f8fafc] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* کارت پروفایل */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-lg font-black shrink-0">
                {profile.name.trim().charAt(0) || 'ک'}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black truncate">{profile.name}</h3>
                <p className="text-[11px] font-medium text-white/75 truncate">
                  رشته {profile.major} · {profile.examName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن منو"
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* سه سنجه‌ی سریع */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MiniStat
              label="تا کنکور"
              value={daysRemaining === null ? '—' : `${toPersianDigits(daysRemaining)} روز`}
            />
            <MiniStat label="امروز" value={formatMinutesShort(todayMinutes)} />
            <MiniStat
              label="استریک"
              value={`${toPersianDigits(streak)} روز`}
              icon={streak > 0 ? Flame : undefined}
            />
          </div>
        </div>

        {/* آیتم‌های منو */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-6">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <h4 className="text-[11px] font-black text-slate-400 px-2 mb-2">
                {section.title}
              </h4>

              <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.action}
                      className="w-full flex items-center gap-3 p-3 text-right hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    >
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${item.tone}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-slate-800">{item.label}</div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          {item.description}
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* بازنشانی */}
          <button
            type="button"
            onClick={go(onResetData)}
            className="w-full mt-1 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>پاک کردن همه‌ی اطلاعات</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

const MiniStat: React.FC<{
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="bg-white/15 border border-white/20 rounded-2xl px-2 py-2 text-center">
    <div className="text-[10px] font-medium text-white/70 mb-0.5">{label}</div>
    <div className="text-[11px] font-black flex items-center justify-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      <span>{value}</span>
    </div>
  </div>
);
