import React from 'react';

export function Chip({
  children,
  tone = 'neutral',
  size = 'md',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const toneClassName =
    tone === 'info'
      ? 'bg-[color:var(--accent-info-soft)] text-[color:var(--accent-info)]'
      : tone === 'success'
        ? 'bg-[color:color-mix(in_srgb,var(--accent-emerald)_16%,white)] text-[color:var(--accent-emerald)]'
        : tone === 'warning'
          ? 'bg-[color:color-mix(in_srgb,var(--accent-warning)_14%,white)] text-[color:var(--accent-warning)]'
          : tone === 'danger'
            ? 'bg-[color:color-mix(in_srgb,var(--accent-danger)_12%,white)] text-[color:var(--accent-danger)]'
            : 'bg-[color:var(--surface-muted)] text-fg-secondary';

  const sizeClassName = size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${toneClassName} ${sizeClassName} ${className}`}
    >
      {children}
    </span>
  );
}
