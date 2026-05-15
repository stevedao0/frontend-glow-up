import React, { useEffect, useState, useRef } from 'react';
import {
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ChevronDownIcon } from
'lucide-react';
export type ExportItem = {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};
export function ExportMenu({
  label = 'Xuất báo cáo',
  items



}: {label?: string;items: ExportItem[];}) {
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
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-9 px-3.5 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all ring-1 shadow-sm shadow-zinc-900/[0.03] ${open ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 hover:ring-zinc-300'}`}>
        
        <DownloadIcon className="h-4 w-4" />
        {label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        
      </button>
      {open &&
      <div
        className="absolute right-0 top-10 z-30 w-72 rounded-xl bg-white ring-1 ring-zinc-900/5 shadow-2xl shadow-zinc-900/15 py-1.5 origin-top-right"
        style={{
          animation: 'menuIn 140ms ease-out'
        }}>
        
          {items.map((it, i) =>
        <button
          key={i}
          type="button"
          onClick={() => {
            it.onClick?.();
            setOpen(false);
          }}
          className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors">
          
              <span className="mt-0.5 h-7 w-7 rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100 inline-flex items-center justify-center shrink-0">
                {it.icon ?? <FileSpreadsheetIcon className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-900">
                  {it.label}
                </span>
                {it.description &&
            <span className="block text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    {it.description}
                  </span>
            }
              </span>
            </button>
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