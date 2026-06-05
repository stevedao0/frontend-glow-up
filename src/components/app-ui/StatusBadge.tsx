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
  success: 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20',
  warning: 'bg-amber-500 text-white shadow-sm shadow-amber-600/20',
  danger: 'bg-rose-700 text-white shadow-sm shadow-rose-900/20',
  info: 'bg-teal-700 text-white shadow-sm shadow-teal-900/20',
  // "Hợp đồng mới" — champagne gold thay cho violet để hợp tone emerald prestige
  violet: 'bg-[#b8923a] text-white shadow-sm shadow-amber-900/20',
  orange: 'bg-orange-600 text-white shadow-sm shadow-orange-900/20',
  neutral: 'bg-stone-800 text-stone-100 shadow-sm shadow-stone-900/20',
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
