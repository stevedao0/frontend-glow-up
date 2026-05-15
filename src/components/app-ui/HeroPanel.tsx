import React from 'react';
import { SparklesIcon } from 'lucide-react';
export function HeroPanel({
  eyebrow,
  title,
  description,
  actions,
  stats









}: {eyebrow?: string;title: React.ReactNode;description?: React.ReactNode;actions?: React.ReactNode;stats?: {label: string;value: string;}[];}) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-[#c9a84c]/20 shadow-xl shadow-emerald-950/40">
      {/* Base gradient — emerald prestige */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
          'linear-gradient(135deg, #04130d 0%, #062a1f 35%, #0a4a36 70%, #0d6e52 100%)'
        }} />
      
      {/* Radial glows — emerald + champagne gold */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full"
        style={{
          background:
          'radial-gradient(circle, rgba(16,185,129,0.40) 0%, rgba(16,185,129,0) 60%)',
          filter: 'blur(20px)'
        }} />
      
      <div
        aria-hidden
        className="absolute -bottom-32 -right-20 h-[460px] w-[460px] rounded-full"
        style={{
          background:
          'radial-gradient(circle, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0) 60%)',
          filter: 'blur(24px)'
        }} />
      

      {/* Signature pattern: contract document lines + seal + wave (music rights) */}
      <svg
        aria-hidden
        viewBox="0 0 800 360"
        className="absolute inset-y-0 right-0 h-full w-auto opacity-[0.07] text-white pointer-events-none"
        preserveAspectRatio="xMaxYMid slice"
        fill="none">
        
        {/* Document lines (right block, like contract text) */}
        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="500" y1="60" x2="760" y2="60" />
          <line x1="500" y1="80" x2="720" y2="80" />
          <line x1="500" y1="100" x2="745" y2="100" />
          <line x1="500" y1="120" x2="700" y2="120" />
          <line x1="500" y1="140" x2="755" y2="140" />
          <line x1="500" y1="160" x2="690" y2="160" />
          <line x1="500" y1="180" x2="730" y2="180" />
          <line x1="500" y1="200" x2="710" y2="200" />
          <line x1="500" y1="220" x2="755" y2="220" />
          <line x1="500" y1="240" x2="680" y2="240" />
          <line x1="500" y1="260" x2="740" y2="260" />
          <line x1="500" y1="280" x2="700" y2="280" />
        </g>
        {/* Music wave (subtle, music-rights nod) */}
        <path
          d="M 0 300 Q 60 270 120 300 T 240 300 T 360 300 T 480 300"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round" />
        
        <path
          d="M 0 320 Q 60 305 120 320 T 240 320 T 360 320 T 480 320"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6" />
        
        {/* Seal stamp (circle with concentric ring) */}
        <g transform="translate(640, 110)" stroke="currentColor" fill="none">
          <circle r="56" strokeWidth="1.2" />
          <circle r="46" strokeWidth="0.8" strokeDasharray="2 4" />
          <circle r="28" strokeWidth="1" />
          <path
            d="M -14 0 L -4 10 L 14 -10"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round" />
          
        </g>
      </svg>

      {/* Dot grid overlay */}
      <div aria-hidden className="absolute inset-0 dot-grid opacity-50" />

      {/* Top highlight */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      

      <div className="relative px-6 sm:px-8 py-7 sm:py-9 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl">
          {eyebrow &&
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-200 bg-white/[0.06] ring-1 ring-inset ring-white/10 backdrop-blur-sm">
              <SparklesIcon className="h-3 w-3" />
              {eyebrow}
            </div>
          }
          <h2 className="mt-3 text-2xl sm:text-[28px] lg:text-3xl font-semibold text-white tracking-tight leading-[1.2]">
            {title}
          </h2>
          {description &&
          <p className="mt-2.5 text-sm sm:text-[15px] text-indigo-100/75 leading-relaxed">
              {description}
            </p>
          }
          {stats && stats.length > 0 &&
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {stats.map((s) =>
            <div
              key={s.label}
              className="flex flex-col border-l border-white/15 pl-3">
              
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-indigo-200/70">
                    {s.label}
                  </span>
                  <span className="text-lg font-semibold text-white tabular-nums">
                    {s.value}
                  </span>
                </div>
            )}
            </div>
          }
        </div>
        {actions &&
        <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        }
      </div>
    </div>);

}