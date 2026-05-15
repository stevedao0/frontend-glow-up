import React from 'react';
export function FormSection({
  title,
  description,
  children,
  className = ''





}: {title: string;description?: string;children: React.ReactNode;className?: string;}) {
  return (
    <section
      className={`relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] overflow-hidden ${className}`}>
      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-zinc-50/40" />
      
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="relative">
        <header className="px-5 py-4 border-b border-zinc-100/80">
          <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
            {title}
          </h3>
          {description &&
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          }
        </header>
        <div className="p-5">{children}</div>
      </div>
    </section>);

}