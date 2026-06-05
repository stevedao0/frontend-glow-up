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
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
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
                ? 'bg-orange-600 text-white'
                : 'bg-[color:var(--accent-neutral)] text-white';

  const dotClass =
    tone === 'success'
      ? 'bg-emerald-200'
      : tone === 'warning'
        ? 'bg-amber-100'
        : tone === 'danger'
          ? 'bg-rose-200'
          : tone === 'info'
            ? 'bg-teal-200'
            : tone === 'violet'
              ? 'bg-amber-100'
              : tone === 'orange'
                ? 'bg-orange-200'
                : 'bg-stone-300';

  return (
    <span className={`ds-badge ${baseClass} ${className ?? ''}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
      {children}
    </span>
  );
}
