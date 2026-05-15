import React from 'react';
import { XIcon, FilterIcon, AlertCircleIcon } from 'lucide-react';

export function FilterBar({
  children,
  onClear,
  hasActive,
  resultSummary,
  error,
}: {
  children: React.ReactNode;
  onClear?: () => void;
  hasActive?: boolean;
  resultSummary?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      
      <div className="p-3 sm:p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap items-end gap-3 flex-1 min-w-0">
          {children}
        </div>
        {onClear &&
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActive}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-600 transition-colors">
            <XIcon className="h-3.5 w-3.5" />
            Xóa lọc
          </button>
        }
      </div>
      {(resultSummary || hasActive || error) &&
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-100/80 bg-zinc-50/40 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-600 flex items-center gap-2">
            {hasActive &&
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-700/15">
                <FilterIcon className="h-2.5 w-2.5" />
                Đang lọc
              </span>
            }
            {error ? (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <AlertCircleIcon className="h-3 w-3" />
                Lỗi tải dữ liệu
              </span>
            ) : resultSummary}
          </div>
        </div>
      }
    </div>
  );
}

export function FilterField({
  label,
  children,
  width = 'w-44'
}: {
  label: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${width}`}>
      <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-[0.06em]">
        {label}
      </label>
      {children}
    </div>
  );
}
