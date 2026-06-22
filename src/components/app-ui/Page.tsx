import React from 'react';
export function Page({ children, embedded }: {children: React.ReactNode; embedded?: boolean;}) {
  if (embedded) {
    // Workspace mode: fill the frame, no outer padding/max-width. The page
    // chrome (PageHeader) is suppressed by the caller; here we just give
    // the page a clean full-width surface with sensible inner padding.
    return (
      <div className="vc-page vc-page--embedded flex flex-col gap-6 px-6 py-5 min-h-0">
        {children}
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1440px] mx-auto flex flex-col gap-8 min-h-0 overflow-hidden">
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