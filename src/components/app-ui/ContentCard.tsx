import React from 'react';
export function ContentCard({
  title,
  description,
  actions,
  children,
  padded = true,
  className = '',
  accent = false,
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={`ds-card group/card relative rounded-2xl overflow-hidden ${accent ? 'ds-card-accent' : ''} ${className}`}
    >
      {/* Inner top highlight — gives the card depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
      />

      {/* Subtle inner gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ds-card-panel"
      />

      <div className="relative">
        {(title || actions) && (
          <header className="px-5 py-4 border-b border-[color:var(--border-subtle)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-semibold text-fg-primary tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-fg-muted mt-0.5">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 shrink-0">{actions}</div>
            )}
          </header>
        )}
        <div className={padded ? 'p-[var(--card-padding)]' : ''}>{children}</div>
      </div>
    </section>
  );
}
