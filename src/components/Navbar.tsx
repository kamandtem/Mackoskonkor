import React from 'react';
import { BarChart2, Calendar, Clock, Home } from 'lucide-react';
import { NavTab, UserProfile } from '../types/konkur';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile: UserProfile;
  /** با لمس آواتار، صفحه‌ی پروفایل باز می‌شود */
  onOpenProfile: () => void;
}

/**
 * نوار پایین شناور: کپسول چهار بخش اصلی + آواتار کاربر.
 * همیشه بالای دکمه‌های سیستمی اندروید می‌نشیند (حاشیه‌ی امن پایین).
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onOpenProfile,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'planner', label: 'برنامه', icon: Calendar },
    { id: 'focus', label: 'تمرکز', icon: Clock },
    { id: 'progress', label: 'پیشرفت', icon: BarChart2 },
  ];

  const initial = profile.name.trim().charAt(0) || 'ک';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-nav px-4 pointer-events-none flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2.5 w-full max-w-md">
        {/* کپسول بخش‌های اصلی */}
        <div className="flex-1 min-w-0 bg-[#ededf0]/90 backdrop-blur-md rounded-full p-1.5 border border-white/80 shadow-[0_10px_28px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.04)] flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (isActive) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className="bg-white text-slate-900 rounded-full px-3.5 py-2 flex items-center gap-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.08)] border border-slate-100/60 font-black text-[12px] transition-all"
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                aria-label={item.label}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-all"
              >
                <Icon className="w-[19px] h-[19px]" />
              </button>
            );
          })}
        </div>

        {/* آواتار کاربر — ورود به پروفایل */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="پروفایل من"
          aria-label="پروفایل من"
          className="w-13 h-13 rounded-full p-[2.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 shadow-[0_10px_24px_rgba(99,102,241,0.35)] active:scale-95 transition-all shrink-0"
        >
          <span className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt="پروفایل"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-base font-black text-indigo-600">{initial}</span>
            )}
          </span>
        </button>
      </div>
    </nav>
  );
};
