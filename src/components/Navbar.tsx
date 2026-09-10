import React from 'react';
import { BarChart2, Calendar, Clock, Home, Plus } from 'lucide-react';
import { NavTab } from '../types/konkur';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAction: () => void;
}

/**
 * نوبار پایین شناور: کپسول چهار بخش اصلی + دکمه شناور منوی سریع.
 * همیشه بالای دکمه‌های سیستمی اندروید می‌نشیند (حاشیه‌ی امن پایین).
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAction,
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

        {/* دکمه شناور منوی سریع */}
        <button
          type="button"
          onClick={onOpenQuickAction}
          title="عملیات سریع"
          aria-label="عملیات سریع"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.4)] active:scale-90 transition-all shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </nav>
  );
};
