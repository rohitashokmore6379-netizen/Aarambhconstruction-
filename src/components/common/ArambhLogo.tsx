import React from 'react';

interface ArambhLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'badge-only' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  useImage?: boolean;
}

export function ArambhLogo({
  className = '',
  variant = 'full',
  size = 'md',
  useImage = true,
}: ArambhLogoProps) {
  // Size mapping
  const heightClasses = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Graphic Logo Image */}
      <img
        src="/logo.jpg"
        alt="आरंभ कन्स्ट्रक्शन - इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर"
        referrerPolicy="no-referrer"
        className={`${heightClasses[size]} w-auto object-contain rounded-lg shadow-sm border border-slate-800/80 bg-black`}
        onError={(e) => {
          // Fallback if image load fails
          e.currentTarget.style.display = 'none';
          const sibling = e.currentTarget.nextElementSibling;
          if (sibling) (sibling as HTMLElement).style.display = 'flex';
        }}
      />

      {/* High-Precision Vector SVG Fallback / Companion */}
      <div className="hidden flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <div className="text-xl sm:text-2xl font-black text-white tracking-wider font-serif">
            || <span className="text-white">आ</span>
            <span className="text-amber-500 font-extrabold">रं</span>
            <span className="text-white">भ</span> ||
          </div>
          <span className="text-xs sm:text-sm font-bold text-amber-500 uppercase tracking-widest ml-1">
            कन्स्ट्रक्शन
          </span>
        </div>
        <div className="mt-0.5 px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-[10px] sm:text-[11px] font-semibold text-amber-200 tracking-wide text-center">
          इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
        </div>
      </div>
    </div>
  );
}

export function ArambhHeaderBrand() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo.jpg"
        alt="आरंभ कन्स्ट्रक्शन"
        referrerPolicy="no-referrer"
        className="h-11 sm:h-13 w-auto object-contain rounded-xl border border-slate-800 bg-black shadow-md shadow-amber-500/10"
      />
      <div className="hidden sm:block">
        <div className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
          <span>ARAMBH CONSTRUCTION</span>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Govt Contractor
          </span>
        </div>
        <div className="text-[11px] text-amber-400 font-medium">
          Er. Sudarshan Bajrang Naik • Civil Engineer
        </div>
      </div>
    </div>
  );
}
