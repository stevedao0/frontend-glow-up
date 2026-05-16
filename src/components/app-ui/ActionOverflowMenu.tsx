import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';

export type OverflowAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  description?: string;
};

export function ActionOverflowMenu({
  actions,
  label = 'Thao tác khác',
}: {
  actions: OverflowAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={label}
        aria-label={label}
        className={`h-9 w-9 inline-flex items-center justify-center rounded-lg ring-1 transition-all ${
          open
            ? 'bg-zinc-900 text-white ring-zinc-900'
            : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300'
        }`}>
        <MoreHorizontalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-10 z-30 w-64 rounded-xl bg-white ring-1 ring-zinc-900/5 shadow-2xl shadow-zinc-900/15 py-1.5 origin-top-right"
          style={{ animation: 'menuIn 140ms ease-out' }}>
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              disabled={a.disabled}
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-start gap-3 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                a.active
                  ? 'bg-amber-50 text-amber-900'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}>
              {a.icon && (
                <span
                  className={`mt-0.5 h-7 w-7 rounded-lg inline-flex items-center justify-center shrink-0 ring-1 ${
                    a.active
                      ? 'bg-amber-100 text-amber-700 ring-amber-200'
                      : 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                  }`}>
                  {a.icon}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-tight">
                  {a.label}
                  {a.active && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider text-amber-700">
                      Đang bật
                    </span>
                  )}
                </span>
                {a.description && (
                  <span className="block text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    {a.description}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
