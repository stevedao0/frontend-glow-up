import React from 'react';
type Tone =
'success' |
'warning' |
'danger' |
'info' |
'neutral' |
'violet' |
'orange';
// Solid: dùng cho status chính (1 cái / dòng)
const toneMap: Record<Tone, string> = {
  success: 'bg-gradient-to-b from-[#0d8a5f] to-[#0a6b4f] text-white shadow-sm shadow-emerald-900/30 ring-1 ring-inset ring-emerald-300/30',
  warning: 'bg-gradient-to-b from-[#e0a624] to-[#b8860b] text-white shadow-sm shadow-amber-900/25 ring-1 ring-inset ring-amber-200/40',
  danger: 'bg-gradient-to-b from-[#c83a35] to-[#9a2a25] text-white shadow-sm shadow-rose-900/30 ring-1 ring-inset ring-rose-300/30',
  info: 'bg-gradient-to-b from-[#2d6a8f] to-[#1f4d6b] text-white shadow-sm shadow-teal-900/25 ring-1 ring-inset ring-sky-200/30',
  // "Hợp đồng mới" — copper/rose-gold
  violet: 'bg-gradient-to-b from-[#c89968] to-[#9c6d3e] text-white shadow-sm shadow-[#5a4533]/30 ring-1 ring-inset ring-[#f0d4a8]/45',
  orange: 'bg-gradient-to-b from-orange-500 to-orange-700 text-white shadow-sm shadow-orange-900/25 ring-1 ring-inset ring-orange-200/30',
  neutral: 'bg-gradient-to-b from-stone-700 to-stone-900 text-stone-100 shadow-sm shadow-stone-900/20 ring-1 ring-inset ring-white/10',
};
const dotMap: Record<Tone, string> = {
  success: 'bg-emerald-200',
  warning: 'bg-amber-100',
  danger: 'bg-rose-200',
  info: 'bg-teal-200',
  violet: 'bg-amber-100',
  orange: 'bg-orange-200',
  neutral: 'bg-stone-300',
};
export function StatusBadge({
  tone = 'neutral',
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${toneMap[tone]} ${className ?? ''}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotMap[tone]}`} />}
      {children}
    </span>
  );
}
