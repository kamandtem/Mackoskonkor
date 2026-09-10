import React from 'react';
import { BarChart2, Calendar, Clock, Home, Plus } from 'lucide-react';
import { NavTab } from '../types/konkur';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAction: () => void;
}

/**
 * نوار پایین شناور به سبک کپسول کشیده + دکمه‌ی گرد شناور (FAB).
 * آیتم فعال به شکل قرص سفید برجسته با آیکن و برچسب نمایش داده می‌شود.
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAction,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'planner', label: 'برنامه', icon: Calendar },
    { id: 'focus', label: 'تمرکز', icon: Clock },
    { id: 'progress', label: 'پیشرفت', icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-4 px-4">
      <div className="pointer-events-auto flex items-center gap-3 w-full max-w-md justify-between">
        {/* کپسول نرم و کشیده با چهار بخش اصلی */}
        <div className="flex-1 bg-[#ededf0]/90 backdrop-blur-md rounded-full p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03)] border border-white/80 flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (isActive) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className="bg-white text-slate-900 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.07)] border border-slate-100/60 font-black text-xs transition-all"
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
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
                <Icon className="w-5 h-5 stroke-[2]" />
              </button>
            );
          })}
        </div>

        {/* دکمه‌ی گرد مرجانی عملیات سریع */}
        <button
          type="button"
          onClick={onOpenQuickAction}
          title="عملیات سریع"
          aria-label="عملیات سریع"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#ff4d4f] hover:bg-[#ff383b] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(255,77,79,0.38)] active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </nav>
  );
};
