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
      ? 'ds-badge-tone-success'
      : tone === 'warning'
        ? 'ds-badge-tone-warning'
        : tone === 'danger'
          ? 'ds-badge-tone-danger'
          : tone === 'info'
            ? 'ds-badge-tone-info'
            : tone === 'violet'
              ? 'ds-badge-tone-violet'
              : tone === 'orange'
                ? 'ds-badge-tone-orange'
                : 'ds-badge-tone-neutral';

  const dotClass =
    tone === 'success'
      ? 'ds-badge-dot-success'
      : tone === 'warning'
        ? 'ds-badge-dot-warning'
        : tone === 'danger'
          ? 'ds-badge-dot-danger'
          : tone === 'info'
            ? 'ds-badge-dot-info'
            : tone === 'violet'
              ? 'ds-badge-dot-violet'
              : tone === 'orange'
                ? 'ds-badge-dot-orange'
                : 'ds-badge-dot-neutral';

  return (
    <span className={`ds-badge ${baseClass} ${className ?? ''}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
      {children}
    </span>
  );
}
