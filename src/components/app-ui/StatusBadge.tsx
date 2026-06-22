import React from 'react';
type Tone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'violet'
  | 'orange';

export function StatusBadge({
  tone = 'neutral',
  children,
  dot,
  compact,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  /** Smaller, tighter badge for compact table rows */
  compact?: boolean;
  className?: string;
}) {
  const baseClass =
    tone === 'success'
      ? 'bg-[color:var(--accent-emerald)] text-white'
      : tone === 'warning'
        ? 'bg-[color:var(--accent-warning)] text-white'
        : tone === 'danger'
          ? 'bg-[color:var(--accent-danger)] text-white'
          : tone === 'info'
            ? 'bg-[color:var(--accent-info)] text-white'
            : tone === 'violet'
              ? 'bg-[color:var(--accent-primary)] text-white'
              : tone === 'orange'
                ? 'bg-[color:var(--accent-warning)] text-white'
                : 'bg-[color:var(--accent-neutral)] text-white';

  const dotClass =
    tone === 'success'
      ? 'bg-[color:var(--accent-emerald-soft)]'
      : tone === 'warning'
        ? 'bg-[color:var(--accent-warning-soft)]'
        : tone === 'danger'
          ? 'bg-[color:var(--accent-danger-soft)]'
          : tone === 'info'
            ? 'bg-[color:var(--accent-info-soft)]'
            : tone === 'violet'
              ? 'bg-[color:var(--accent-primary-soft)]'
              : tone === 'orange'
                ? 'bg-[color:var(--accent-warning-soft)]'
                : 'bg-[color:var(--accent-neutral-soft)]';

  return (
    <span className={`ds-badge flex-nowrap whitespace-nowrap ${compact ? 'ds-badge-compact' : ''} ${baseClass} ${className ?? ''}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />}
      <span>{children}</span>
    </span>
  );
}
