import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
};
export function DataTable<
  T extends {
    id: string | number;
  }>(
{
  columns,
  rows,
  loading,
  empty,
  onRowClick






}: {columns: Column<T>[];rows: T[];loading?: boolean;empty?: React.ReactNode;onRowClick?: (row: T) => void;}) {
  if (loading) return <LoadingState />;
  if (!rows.length) return empty ?? <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50/80 border-b border-zinc-100">
            {columns.map((c) =>
            <th
              key={c.key}
              className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}
              style={
              c.width ?
              {
                width: c.width
              } :
              undefined
              }>
              
                {c.header}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={`border-b border-zinc-50 last:border-0 transition-colors hover:bg-zinc-50/60 ${onRowClick ? 'cursor-pointer' : ''}`}>
            
              {columns.map((c) =>
            <td
              key={c.key}
              className={`px-5 py-3.5 text-zinc-700 ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}>
              
                  {c.render(row)}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}