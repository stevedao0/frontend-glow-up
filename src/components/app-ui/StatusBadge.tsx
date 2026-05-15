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
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-500/15'
};
const dotMap: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  violet: 'bg-violet-500',
  orange: 'bg-orange-500',
  neutral: 'bg-zinc-400'
};
export function StatusBadge({
  tone = 'neutral',
  children,
  dot,
  className
}: {tone?: Tone;children: React.ReactNode;dot?: boolean;className?: string;}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${toneMap[tone]} ${className ?? ''}`}>

      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotMap[tone]}`} />}
      {children}
    </span>);

}
