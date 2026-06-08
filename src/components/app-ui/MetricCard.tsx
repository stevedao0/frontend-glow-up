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

function toneIconClass(tone: Tone): string {
  if (tone === 'emerald') return 'ds-metric-icon-tone-success ds-metric-icon-glow';
  if (tone === 'amber' || tone === 'indigo' || tone === 'violet' || tone === 'sky' || tone === 'cyan') return 'ds-metric-icon ds-metric-icon-glow';
  if (tone === 'rose') return 'ds-metric-icon-tone-danger ds-metric-icon-glow';
  return 'ds-metric-icon ds-metric-icon-glow';
}

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
      className={`ds-card group relative rounded-2xl overflow-hidden p-[var(--card-padding)] ${interactive ? 'cursor-pointer text-left w-full ds-focus-ring' : ''}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-px h-px bg-white/80" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#c89968]/0 group-hover:bg-[#c89968]/10 blur-2xl transition-colors duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-muted">
            {label}
          </span>
          {icon &&
          <span
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:rotate-3 ${toneIconClass(tone)}`}>
              {icon}
            </span>
          }
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span
              className={`text-[28px] leading-none font-semibold tracking-tight nums ${value === '—' ? 'text-fg-subtle' : 'text-fg-primary'}`}
              style={{ animation: 'countUp 420ms var(--ease-out) both' }}
              title={value === '—' ? 'Chưa có dữ liệu kỳ này' : undefined}>
              {value}
            </span>
            {value === '—' && (
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-fg-muted italic">
                Chưa có dữ liệu
              </span>
            )}
            {delta &&
            <span
              className={`ds-delta ${delta.tone === 'up' ? 'ds-delta-up' : delta.tone === 'down' ? 'ds-delta-down' : 'ds-delta-flat'}`}>
                {delta.tone === 'up' ?
              <ArrowUpRightIcon className="h-3 w-3" strokeWidth={2.5} /> :
              delta.tone === 'down' ?
              <ArrowDownRightIcon className="h-3 w-3" strokeWidth={2.5} /> :
              null}
                {delta.value}
              </span>
            }
          </div>
          {sparkline && value !== '—' && (
            <Sparkline data={sparkline} tone={delta?.tone || 'flat'} />
          )}
        </div>
        {compare && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span className="ds-compare-dot h-1.5 w-3 rounded-sm" />
            <span className="font-medium">{compare.label ?? 'Kỳ trước'}:</span>
            <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{compare.value}</span>
          </div>
        )}
        {hint && <p className="text-xs text-fg-muted mt-2">{hint}</p>}
      </div>
    </Tag>);
}

export function MetricStrip({ items }: {items: MetricCardProps[];}) {
  const n = items.length;
  const cols =
    n <= 2 ? 'grid-cols-1 sm:grid-cols-2'
    : n === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : n === 4 ? 'grid-cols-2 lg:grid-cols-4'
    : n === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
    : n === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
    : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4';
  return (
    <div className={`grid ${cols} gap-4 stagger`}>
      {items.map((m, i) =>
      <MetricCard key={i} {...m} />
      )}
    </div>);
}
