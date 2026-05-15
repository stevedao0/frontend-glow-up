import React from 'react';
type Tone =
'success' |
'warning' |
'danger' |
'info' |
'neutral' |
'violet' |
'orange';
const toneMap: Record<Tone, string> = {
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20',
  warning: 'bg-amber-500 text-white shadow-sm shadow-amber-500/25',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20',
  info: 'bg-sky-600 text-white shadow-sm shadow-sky-600/20',
  violet: 'bg-violet-600 text-white shadow-sm shadow-violet-600/20',
  orange: 'bg-orange-500 text-white shadow-sm shadow-orange-500/25',
  neutral: 'bg-zinc-700 text-white shadow-sm shadow-zinc-700/20',
};
const dotMap: Record<Tone, string> = {
  success: 'bg-emerald-200',
  warning: 'bg-amber-100',
  danger: 'bg-rose-200',
  info: 'bg-sky-200',
  violet: 'bg-violet-200',
  orange: 'bg-orange-100',
  neutral: 'bg-zinc-300',
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
