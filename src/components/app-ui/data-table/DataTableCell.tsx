import React from 'react';
import type { DataTableAlign, DataTableDensity, DataTableWrap } from './DataTableTypes';

function alignClassName(align: DataTableAlign) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function wrapClassName(wrap: DataTableWrap) {
  if (wrap === 'nowrap') return 'whitespace-nowrap';
  if (wrap === 'clamp-1') return 'line-clamp-1';
  if (wrap === 'clamp-2') return 'line-clamp-2';
  if (wrap === 'clamp-3') return 'line-clamp-3';
  return 'whitespace-normal break-words';
}

export function DataTableCell({
  as = 'td',
  children,
  align = 'left',
  width,
  minWidth,
  maxWidth,
  wrap = 'normal',
  tooltip = false,
  className = '',
  title,
  sticky = false,
  stickyOffset,
}: {
  as?: 'td' | 'th';
  children: React.ReactNode;
  align?: DataTableAlign;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  wrap?: DataTableWrap;
  tooltip?: boolean;
  className?: string;
  title?: string;
  sticky?: boolean;
  stickyOffset?: string | number;
}) {
  const Tag = as;
  const derivedTitle =
    title ?? (tooltip && typeof children === 'string' ? children : undefined);

  return (
    <Tag
      className={`ds-table-cell px-4 ${alignClassName(align)} ${wrapClassName(wrap)} ${sticky ? 'sticky right-0 z-[1] bg-[color:var(--surface-elevated)]' : ''} ${className}`}
      style={{ width, minWidth, maxWidth, right: sticky ? stickyOffset : undefined }}
      title={derivedTitle}
      scope={as === 'th' ? 'col' : undefined}
    >
      {children}
    </Tag>
  );
}

export function getDensityCellPadding(density: DataTableDensity) {
  if (density === 'compact') return 'py-2';
  if (density === 'detailed') return 'py-4';
  return 'py-3';
}
