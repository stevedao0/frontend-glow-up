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
      className={`group/card relative premium-card rounded-2xl overflow-hidden ${className}`}
    >
      {/* Inner top highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent"
      />

      {/* Always-on subtle copper top accent (more visible when accent=true) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c89968]/60 to-transparent ${accent ? 'opacity-100' : 'opacity-50'}`}
      />

      {/* Subtle warm corner aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#c89968]/10 blur-3xl"
      />


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
