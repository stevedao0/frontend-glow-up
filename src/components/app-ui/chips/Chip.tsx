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
      ? 'ds-chip ds-chip-tone-info'
      : tone === 'success'
        ? 'ds-chip ds-chip-tone-success'
        : tone === 'warning'
          ? 'ds-chip ds-chip-tone-warning'
          : tone === 'danger'
            ? 'ds-chip ds-chip-tone-danger'
            : 'ds-chip ds-chip-tone-neutral';

  const sizeClassName = size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${toneClassName} ${sizeClassName} ${className}`}
    >
      {children}
    </span>
  );
}
