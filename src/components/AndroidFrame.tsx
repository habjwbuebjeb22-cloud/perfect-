import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isAndroidFrameActive: boolean;
  onToggleFrame: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  isAndroidFrameActive,
  onToggleFrame
}) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (!isAndroidFrameActive) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-cairo">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 sm:py-4 sm:px-2 md:py-6 flex flex-col items-center justify-center font-cairo">
      {/* Device frame toggle indicator (visible on tablet/desktop) */}
      <div className="hidden sm:flex mb-3 items-center justify-between w-full max-w-[420px] text-xs text-stone-400 px-2">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Smartphone className="w-3.5 h-3.5" />
          معاينة هاتف أندرويد (تطبيق مُتقِن)
        </span>
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1 hover:text-white transition-colors bg-stone-900 px-2.5 py-1 rounded-full border border-stone-800"
          title="التبديل إلى شاشة كاملة"
        >
          <Monitor className="w-3 h-3" />
          شاشة عادية
        </button>
      </div>

      {/* Android Device Shell (nested on desktop, edge-to-edge on mobile screens) */}
      <div className="relative w-full sm:max-w-[412px] h-screen sm:h-[860px] sm:max-h-[92vh] bg-stone-900 sm:rounded-[44px] shadow-2xl shadow-emerald-950/40 sm:border-[10px] sm:border-stone-800 flex flex-col overflow-hidden sm:ring-1 sm:ring-emerald-500/20">
        {/* Android Status Bar (visible only in mockup mode on desktop) */}
        <div className="hidden sm:flex bg-stone-950 text-stone-300 text-xs px-6 pt-2 pb-1.5 items-center justify-between select-none shrink-0 z-50">
          <span className="font-semibold text-[13px] tracking-tight text-stone-200">{timeString}</span>
          {/* Front Camera Punch-Hole */}
          <div className="w-3.5 h-3.5 bg-black rounded-full border border-stone-800 shadow-inner"></div>
          {/* Icons: Wi-Fi, Signal, Battery */}
          <div className="flex items-center gap-1.5 text-[11px] font-sans">
            <span>5G</span>
            <span>📶</span>
            <span>100% 🔋</span>
          </div>
        </div>

        {/* App Content viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-stone-950 text-stone-100">
          {children}
        </div>

        {/* Android Bottom Navigation Pill */}
        <div className="hidden sm:flex bg-stone-950 py-2.5 justify-center items-center shrink-0 z-50 border-t border-stone-900">
          <div className="w-32 h-1 bg-stone-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
