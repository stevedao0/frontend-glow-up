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
  sparkline?: number[];
  onClick?: () => void;
  compare?: {
    value: string;
    label?: string;
  };
};

function Sparkline({ data, tone }: { data: number[]; tone: 'up' | 'down' | 'flat' }) {
  if (!data || data.length < 2) return null;
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`);
  const d = `M${pts.join(' L')}`;
  const area = `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
  const stroke = tone === 'down' ? '#b8302b' : tone === 'flat' ? '#9aa39d' : '#9c6d3e';
  const fill = tone === 'down' ? 'rgba(184,48,43,0.10)' : tone === 'flat' ? 'rgba(154,163,157,0.10)' : 'rgba(200,153,104,0.18)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90 group-hover:opacity-100 transition-opacity">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(data.length - 1) * step} cy={h - ((data[data.length - 1] - min) / range) * h} r="2.2" fill={stroke} />
    </svg>
  );
}
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
  tone = 'indigo',
  sparkline,
  onClick,
  compare,
}: MetricCardProps) {
  const interactive = !!onClick;
  const Tag: any = interactive ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      type={interactive ? 'button' : undefined}
      className={`group relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] hover:shadow-[0_0_0_1px_rgba(200,153,104,0.5),0_0_0_4px_rgba(200,153,104,0.10),0_14px_30px_-10px_rgba(156,109,62,0.25)] hover:-translate-y-1 transition-all duration-200 ease-out p-5 overflow-hidden ${interactive ? 'cursor-pointer text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600' : ''}`}>
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${toneAccentFrom[tone]} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-px h-px bg-white/80" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#c89968]/0 group-hover:bg-[#c89968]/10 blur-2xl transition-colors duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
            {label}
          </span>
          {icon &&
          <span
            className={`h-9 w-9 rounded-xl ring-1 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:rotate-3 ${toneIconBg[tone]} ${toneIconGlow[tone]}`}>
              {icon}
            </span>
          }
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span
              className="text-[28px] leading-none font-semibold text-zinc-900 tracking-tight nums"
              style={{ animation: 'countUp 420ms var(--ease-out) both' }}>
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
          {sparkline && (
            <Sparkline data={sparkline} tone={delta?.tone || 'flat'} />
          )}
        </div>
        {compare && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="inline-block h-1.5 w-3 rounded-sm bg-zinc-300" />
            <span className="font-medium">{compare.label ?? 'Kỳ trước'}:</span>
            <span className="tabular-nums text-zinc-700">{compare.value}</span>
          </div>
        )}
        {hint && <p className="text-xs text-zinc-500 mt-2">{hint}</p>}
      </div>
    </Tag>);

}
export function MetricStrip({ items }: {items: MetricCardProps[];}) {
  const n = items.length;
  // Chọn cột để KPI luôn cân đối — không bao giờ chừa ô trống
  const cols =
    n <= 2 ? 'grid-cols-1 sm:grid-cols-2'
    : n === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : n === 4 ? 'grid-cols-2 lg:grid-cols-4'
    : n === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
    : n === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
    : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';
  return (
    <div className={`grid ${cols} gap-5 stagger`}>
      {items.map((m, i) =>
      <MetricCard key={i} {...m} />
      )}
    </div>);
}