import React from 'react';
import { ArrowUpRightIcon, ArrowDownRightIcon } from 'lucide-react';
type Tone = 'indigo' | 'violet' | 'emerald' | 'amber' | 'sky' | 'rose' | 'cyan';
export type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: {
    value: string;
    tone: 'up' | 'down' | 'flat';
  };
  icon?: React.ReactNode;
  tone?: Tone;
};
const toneIconBg: Record<Tone, string> = {
  indigo: 'bg-amber-50 text-amber-700 ring-amber-100',
  violet: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  sky: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  cyan: 'bg-amber-50 text-amber-700 ring-amber-100'
};
const toneIconGlow: Record<Tone, string> = {
  indigo: 'group-hover:shadow-[0_0_18px_rgba(99,102,241,0.35)]',
  violet: 'group-hover:shadow-[0_0_18px_rgba(139,92,246,0.35)]',
  emerald: 'group-hover:shadow-[0_0_18px_rgba(16,185,129,0.32)]',
  amber: 'group-hover:shadow-[0_0_18px_rgba(245,158,11,0.32)]',
  sky: 'group-hover:shadow-[0_0_18px_rgba(14,165,233,0.32)]',
  rose: 'group-hover:shadow-[0_0_18px_rgba(244,63,94,0.32)]',
  cyan: 'group-hover:shadow-[0_0_18px_rgba(6,182,212,0.32)]'
};
const toneAccentFrom: Record<Tone, string> = {
  indigo: 'from-amber-500/0 via-amber-600/60 to-amber-500/0',
  violet: 'from-amber-500/0 via-amber-600/60 to-amber-500/0',
  emerald: 'from-emerald-400/0 via-emerald-500/60 to-emerald-400/0',
  amber: 'from-amber-400/0 via-amber-500/60 to-amber-400/0',
  sky: 'from-amber-500/0 via-amber-600/60 to-amber-500/0',
  rose: 'from-rose-400/0 via-rose-500/60 to-rose-400/0',
  cyan: 'from-amber-500/0 via-amber-600/60 to-amber-500/0'
};
export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon,
  tone = 'indigo'
}: MetricCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] hover:shadow-[0_4px_8px_rgba(15,15,25,0.05),0_12px_28px_rgba(15,15,25,0.06)] hover:-translate-y-1 hover:ring-zinc-900/[0.08] transition-all duration-200 ease-out p-5 overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${toneAccentFrom[tone]} opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-px h-px bg-white/80" />
      

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
            {label}
          </span>
          {icon &&
          <span
            className={`h-9 w-9 rounded-xl ring-1 flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${toneIconBg[tone]} ${toneIconGlow[tone]}`}>
            
              {icon}
            </span>
          }
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[28px] leading-none font-semibold text-zinc-900 tracking-tight tabular-nums">
            {value}
          </span>
          {delta &&
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight ring-1 ring-inset ${delta.tone === 'up' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : delta.tone === 'down' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-zinc-100 text-zinc-600 ring-zinc-500/15'}`}>
            
              {delta.tone === 'up' ?
            <ArrowUpRightIcon className="h-3 w-3" strokeWidth={2.5} /> :
            delta.tone === 'down' ?
            <ArrowDownRightIcon className="h-3 w-3" strokeWidth={2.5} /> :
            null}
              {delta.value}
            </span>
          }
        </div>
        {hint && <p className="text-xs text-zinc-500 mt-2">{hint}</p>}
      </div>
    </div>);

}
export function MetricStrip({ items }: {items: MetricCardProps[];}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map((m, i) =>
      <MetricCard key={i} {...m} />
      )}
    </div>);

}