import type React from 'react';
import { StatusBadge } from '../StatusBadge';

type ChipTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type ChipProps = {
  children: React.ReactNode;
  tone?: ChipTone;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
};

const chipToneClassName: Record<ChipTone, string> = {
  default: 'bg-[color:var(--surface-muted)] text-[color:var(--text-secondary)] ring-[color:var(--border-subtle)]',
  primary: 'bg-[color:var(--accent-primary-soft)] text-[color:var(--accent-primary)] ring-[color:color-mix(in_srgb,var(--accent-primary)_16%,transparent)]',
  success: 'bg-[color:color-mix(in_srgb,var(--accent-emerald)_12%,white)] text-[color:var(--accent-emerald)] ring-[color:color-mix(in_srgb,var(--accent-emerald)_16%,transparent)]',
  warning: 'bg-[color:color-mix(in_srgb,var(--accent-warning)_12%,white)] text-[color:var(--accent-warning)] ring-[color:color-mix(in_srgb,var(--accent-warning)_16%,transparent)]',
  danger: 'bg-[color:color-mix(in_srgb,var(--accent-danger)_10%,white)] text-[color:var(--accent-danger)] ring-[color:color-mix(in_srgb,var(--accent-danger)_14%,transparent)]',
  info: 'bg-[color:color-mix(in_srgb,var(--accent-info)_12%,white)] text-[color:var(--accent-info)] ring-[color:color-mix(in_srgb,var(--accent-info)_16%,transparent)]',
  neutral: 'bg-[color:var(--accent-neutral-soft)] text-[color:var(--text-secondary)] ring-[color:var(--border-subtle)]',
};

export function Chip({ children, tone = 'default', leading, trailing, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${chipToneClassName[tone]} ${className}`}
    >
      {leading ? <span className="inline-flex shrink-0 items-center">{leading}</span> : null}
      <span>{children}</span>
      {trailing ? <span className="inline-flex shrink-0 items-center">{trailing}</span> : null}
    </span>
  );
}

export function StatusChip(props: React.ComponentProps<typeof StatusBadge>) {
  return <StatusBadge {...props} />;
}
