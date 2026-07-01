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
      className="inline-flex items-center gap-1 rounded-lg bg-zinc-100/80 p-1 ring-1 ring-zinc-200/50 backdrop-blur-sm"
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
            className={`ds-focus-ring relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all ${active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-zinc-200/50' : 'text-zinc-500 hover:bg-white/50 hover:text-zinc-700'}`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-white/80 text-zinc-500 ring-1 ring-zinc-200/50'}`}
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
