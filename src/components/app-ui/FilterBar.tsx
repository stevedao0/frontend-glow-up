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
    <div className="relative ds-toolbar-surface rounded-2xl ds-toolbar-panel overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap items-end gap-3 flex-1 min-w-0">
          {children}
        </div>
        {onClear &&
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActive}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-muted transition-colors">
            <XIcon className="h-3.5 w-3.5" />
            Xóa lọc
          </button>
        }
      </div>
      {(resultSummary || hasActive || error) &&
        <div className="px-4 sm:px-5 py-2.5 ds-toolbar-summary flex items-center justify-between gap-3">
          <div className="text-xs text-fg-muted flex items-center gap-2">
            {hasActive &&
              <span className="ds-filter-chip">
                <FilterIcon className="h-2.5 w-2.5" />
                Đang lọc
              </span>
            }
            {error ? (
              <span className="inline-flex items-center gap-1 text-accent-danger">
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
      <label className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.06em]">
        {label}
      </label>
      {children}
    </div>
  );
}
