import React from 'react';
export function Page({ children }: {children: React.ReactNode;}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1440px] mx-auto flex flex-col gap-6">
      {children}
    </div>);

}
export function PageHeader({
  title,
  description,
  actions,
  breadcrumb





}: {title: React.ReactNode;description?: React.ReactNode;actions?: React.ReactNode;breadcrumb?: string;}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb &&
        <p className="text-xs font-medium text-zinc-500 mb-1.5">
            {breadcrumb}
          </p>
        }
        <h1 className="text-2xl sm:text-[28px] font-semibold text-zinc-900 tracking-tight leading-tight">
          {title}
        </h1>
        {description &&
        <p className="text-sm text-zinc-500 mt-1.5">{description}</p>
        }
      </div>
      {actions &&
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
      }
    </div>);

}