import React from 'react';

export type Tab = {
  value: string;
  label: string;
  count?: number;
};

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Tab[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 rounded-lg bg-[color:var(--surface-muted)] p-1 ring-1 ring-[color:var(--border-subtle)]"
    >
      {tabs.map((t) => {
        const active = t.value === value;

        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`ds-focus-ring relative inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all ${active ? 'bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)] shadow-xs ring-1 ring-[color:var(--border-subtle)]' : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)] hover:text-[color:var(--text-primary)]'}`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${active ? 'bg-[color:var(--accent-primary-soft)] text-[color:var(--accent-primary)]' : 'bg-[color:var(--surface)] text-[color:var(--text-muted)]'}`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
