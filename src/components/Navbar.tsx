import React from 'react';
import { BarChart2, Calendar, Clock, Home, Plus } from 'lucide-react';
import { NavTab } from '../types/konkur';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  /** دکمه‌ی + کنار کپسول: منوی عملیات سریع را باز می‌کند */
  onQuickAdd: () => void;
}

/**
 * نوار پایین شناور: کپسول نرم چهار بخش اساسی + دکمه‌ی گرد کنار آن.
 * همیشه بالای دکمه‌های سیستمی اندروید می‌نشیند (حاشیه‌ی امن پایین).
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onQuickAdd,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'planner', label: 'تقویم', icon: Calendar },
    { id: 'focus', label: 'تمرکز', icon: Clock },
    { id: 'progress', label: 'پیشرفت', icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-nav px-4 pointer-events-none flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 w-full max-w-md">
        {/* کپسول بخش‌های اساسی */}
        <div className="flex-1 min-w-0 bg-[#ededf0]/90 backdrop-blur-md rounded-full p-2 border border-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.13),0_3px_10px_rgba(15,23,42,0.05)] flex items-center justify-between gap-0.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (isActive) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className="bg-white text-slate-900 rounded-full pr-3.5 pl-4 py-2.5 flex items-center gap-2 shadow-[0_4px_14px_rgba(15,23,42,0.08)] border border-white font-black text-[12.5px] transition-all"
                >
                  <Icon className="w-[21px] h-[21px]" />
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
                className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
              >
                <Icon className="w-[21px] h-[21px]" />
              </button>
            );
          })}
        </div>

        {/* دکمه‌ی + کنار کپسول — منوی عملیات سریع */}
        <button
          type="button"
          onClick={onQuickAdd}
          title="افزودن سریع"
          aria-label="افزودن سریع"
          className="w-14 h-14 rounded-full bg-[#f0564f] flex items-center justify-center text-white shadow-[0_14px_28px_rgba(240,86,79,0.38)] active:scale-90 transition-all shrink-0"
        >
          <Plus className="w-7 h-7 stroke-[2.6]" />
        </button>
      </div>
    </nav>
  );
};
