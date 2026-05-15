import React from 'react';
export type Tab = {
  value: string;
  label: string;
  count?: number;
};
export function Tabs({
  tabs,
  value,
  onChange




}: {tabs: Tab[];value: string;onChange: (v: string) => void;}) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 p-1 bg-zinc-100 rounded-lg">
      
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`relative h-7 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-all ${active ? 'bg-white text-zinc-900 shadow-sm shadow-zinc-900/[0.06] ring-1 ring-zinc-900/[0.04]' : 'text-zinc-600 hover:text-zinc-900'}`}>
            
            {t.label}
            {t.count != null &&
            <span
              className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold tabular-nums ${active ? 'bg-amber-100 text-amber-800' : 'bg-zinc-200/70 text-zinc-600'}`}>
              
                {t.count}
              </span>
            }
          </button>);

      })}
    </div>);

}