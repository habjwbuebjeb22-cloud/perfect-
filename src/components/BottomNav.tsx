import React from 'react';
import { Home, Mic, BookOpen, Award, ShieldCheck } from 'lucide-react';
import { AppTab } from './Navbar.tsx';

interface BottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'home' as AppTab, label: 'الرئيسية', icon: Home },
    { id: 'recite' as AppTab, label: 'التلاوة', icon: Mic },
    { id: 'learn' as AppTab, label: 'التجويد', icon: BookOpen },
    { id: 'progress' as AppTab, label: 'سجلي', icon: Award },
    { id: 'methodology' as AppTab, label: 'المنهجية', icon: ShieldCheck }
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="sticky bottom-0 z-40 bg-stone-950/95 backdrop-blur-md border-t border-emerald-900/40 py-1 px-2 flex items-center justify-around shadow-2xl shrink-0"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
              isActive
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isActive ? 'bg-emerald-950/90 text-emerald-300 ring-1 ring-emerald-500/40' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
