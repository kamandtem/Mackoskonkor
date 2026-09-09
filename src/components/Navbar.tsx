import React from 'react';
import { BarChart2, Calendar, Clock, Home, Plus } from 'lucide-react';
import { NavTab } from '../types/konkur';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAction: () => void;
}

/**
 * نوار پایین فقط چهار بخش اصلی را نگه می‌دارد.
 * آیکن «بیشتر» حذف شد؛ بقیه‌ی بخش‌ها از منوی هدر (عکس کاربر) در دسترس‌اند.
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAction,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'planner', label: 'برنامه', icon: Calendar },
    { id: 'focus', label: 'تمرکز', icon: Clock },
    { id: 'progress', label: 'پیشرفت', icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-3 px-4">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-[28px] border border-white/80 shadow-[0_12px_36px_rgba(100,116,139,0.18),0_2px_8px_rgba(100,116,139,0.06)] px-3 py-2 flex items-center justify-between w-full max-w-md">
        {tabs.map((t) => {
          const isActive = currentTab === t.id;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTab(t.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive ? 'text-indigo-600 font-black' : 'text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 -bottom-1 absolute" />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenQuickAction}
          title="عملیات سریع"
          aria-label="عملیات سریع"
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-300 hover:scale-105 active:scale-95 transition-all ml-1 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8px]" />
        </button>
      </div>
    </nav>
  );
};
