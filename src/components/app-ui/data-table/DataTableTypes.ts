import React from 'react';

export type DataTableAlign = 'left' | 'center' | 'right';
export type DataTableWrap = 'nowrap' | 'clamp-1' | 'clamp-2' | 'clamp-3' | 'normal';
export type DataTableDensity = 'compact' | 'comfortable' | 'detailed';

export type DataTableColumn<T> = {
  key: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (row: T, value: React.ReactNode) => React.ReactNode;
  align?: DataTableAlign;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  wrap?: DataTableWrap;
  tooltip?: boolean;
  cellClassName?: string;
  headerClassName?: string;
};

export type DataTablePaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
};

export type DataTableSelectionConfig<T, RowId extends string | number> = {
  selectedIds: RowId[];
  getRowId: (row: T) => RowId;
  onToggleRow: (rowId: RowId) => void;
  onToggleAll: (rowIds: RowId[], nextSelected: boolean) => void;
  isRowDisabled?: (row: T) => boolean;
};

export type DataTableClassNames = {
  shell?: string;
  scroll?: string;
  table?: string;
  header?: string;
  body?: string;
  row?: string;
  cell?: string;
  emptyState?: string;
  loadingState?: string;
  errorState?: string;
  toolbar?: string;
  pagination?: string;
};

export type DataTableStateProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};
