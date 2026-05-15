import React from 'react';
export function FormSection({
  title,
  description,
  children,
  className = ''
}: {title: string;description?: string;children: React.ReactNode;className?: string;}) {
  return (
    <section
      className={`group relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] overflow-hidden animate-fade-in transition-all duration-300 hover:ring-[#c89968]/30 hover:shadow-[0_2px_4px_rgba(156,109,62,0.06),0_8px_24px_-8px_rgba(156,109,62,0.14)] ${className}`}>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-[#faf3e2]/30" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c89968]/60 to-transparent transition-all duration-300 group-hover:via-[#9c6d3e]/80" />

      <div className="relative">
        <header className="px-5 py-4 border-b border-[#e3d2b3]/40">
          <h3 className="text-sm font-semibold text-[#2d2419] tracking-tight">
            {title}
          </h3>
          {description &&
          <p className="text-xs text-[#6b756f] mt-0.5">{description}</p>
          }
        </header>
        <div className="p-5">{children}</div>
      </div>
    </section>);

}
