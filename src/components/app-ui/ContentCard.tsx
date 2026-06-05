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
      className={`group/card relative bg-surface rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-sm overflow-hidden ${className}`}
    >
      {/* Inner top highlight — gives the card depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
      />

      {/* Subtle inner gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-zinc-50/40"
      />

      {accent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
      )}

      <div className="relative">
        {(title || actions) && (
          <header className="px-5 py-4 border-b border-zinc-100/80 flex items-center justify-between gap-3">
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
        <div className={padded ? 'p-5' : ''}>{children}</div>
      </div>
    </section>
  );
}
