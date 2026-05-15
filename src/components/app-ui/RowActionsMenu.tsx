import React, { useEffect, useState, useRef, Fragment } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
export type RowAction = {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
  divider?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};
export function RowActionsMenu({
  actions,
  align = 'right'



}: {actions: RowAction[];align?: 'left' | 'right';}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div
      ref={ref}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}>
      
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thao tác"
        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 transition-colors ${open ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}>
        
        <MoreHorizontalIcon className="h-4 w-4" />
      </button>
      {open &&
      <div
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-9 z-30 w-52 rounded-xl bg-white ring-1 ring-zinc-900/5 shadow-2xl shadow-zinc-900/15 py-1.5 origin-top-right`}
        style={{
          animation: 'menuIn 140ms ease-out'
        }}>
        
          {actions.map((a, i) =>
        <Fragment key={i}>
              {a.divider && <div className="my-1 border-t border-zinc-100" />}
              {a.disabled ? (
                <div
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-300 cursor-not-allowed"
                  title={a.disabledReason || 'Khong co hanh dong'}>
                  <span className="h-4 w-4 shrink-0">{a.icon}</span>
                  <span className="flex-1">{a.label}</span>
                  {a.disabledReason && (
                    <span className="text-[10px] text-zinc-300 italic">Disabled</span>
                  )}
                </div>
              ) : (
              <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              a.onClick?.();
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${a.tone === 'danger' ? 'text-rose-600 hover:bg-rose-50' : 'text-zinc-700 hover:bg-zinc-50'}`}>

                {a.icon &&
            <span
              className={`h-4 w-4 shrink-0 ${a.tone === 'danger' ? 'text-rose-500' : 'text-zinc-500'}`}>

                    {a.icon}
                  </span>
            }
                <span className="flex-1">{a.label}</span>
              </button>
              )}
            </Fragment>
        )}
        </div>
      }
      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>);

}