import React from 'react';
import { BookOpen, Smartphone, Monitor, ZoomIn, ZoomOut, Wifi } from 'lucide-react';

export type AppTab = 'home' | 'recite' | 'learn' | 'progress' | 'methodology';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  quranFontSize: number;
  onChangeFontSize: (delta: number) => void;
  isAndroidFrameActive: boolean;
  onToggleFrame: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  quranFontSize,
  onChangeFontSize,
  isAndroidFrameActive,
  onToggleFrame
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-emerald-900/50 shadow-md">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 text-right focus:outline-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-950 flex items-center justify-center border border-amber-500/40 shadow-sm shadow-emerald-900/50 group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base text-emerald-400 tracking-tight">مُتقِن</span>
            <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-700/50 font-medium">
              التجويد الذكي
            </span>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Offline/Online badge */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
            <Wifi className="w-3 h-3" />
            <span>يعمل دون اتصال</span>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center bg-stone-950/80 rounded-lg p-0.5 border border-stone-800">
            <button
              onClick={() => onChangeFontSize(-2)}
              disabled={quranFontSize <= 20}
              aria-label="تصغير خط المصحف"
              title="تصغير الخط"
              className="p-1 hover:text-emerald-400 disabled:opacity-30 transition-colors text-xs text-stone-400"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] px-1 text-stone-300 font-mono select-none">{quranFontSize}</span>
            <button
              onClick={() => onChangeFontSize(2)}
              disabled={quranFontSize >= 44}
              aria-label="تكبير خط المصحف"
              title="تكبير الخط"
              className="p-1 hover:text-emerald-400 disabled:opacity-30 transition-colors text-xs text-stone-400"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Android Frame Mockup Toggle */}
          <button
            onClick={onToggleFrame}
            className="flex items-center gap-1 p-1.5 bg-stone-950/80 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-800 text-xs transition-colors"
            title={isAndroidFrameActive ? "التبديل إلى الشاشة الكاملة" : "معاينة إطار هاتف أندرويد"}
            aria-label="تبديل وضع الإطار"
          >
            {isAndroidFrameActive ? <Monitor className="w-3.5 h-3.5 text-emerald-400" /> : <Smartphone className="w-3.5 h-3.5 text-stone-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
