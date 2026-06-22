import React from 'react';
export function FormSection({
  title,
  description,
  children,
  className = ''
}: {title: string;description?: string;children: React.ReactNode;className?: string;}) {
  return (
    <section
      className={`group relative bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_2px_6px_rgba(15,15,25,0.03)] overflow-hidden animate-fade-in transition-all duration-300 hover:-translate-y-[1px] hover:ring-[#c89968]/70 hover:shadow-[0_0_0_4px_rgba(200,153,104,0.08),0_8px_28px_-8px_rgba(156,109,62,0.22)] ${className}`}>

      {/* Gold gradient frame on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(232,196,160,0.55), rgba(156,109,62,0.35) 45%, rgba(232,196,160,0.55))',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          padding: '1.5px',
        }} />

      {/* Subtle highlight on top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

      {/* Soft cream wash background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white to-[#faf3e2]/30" />

      {/* Gold accent bar that brightens on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c89968]/60 to-transparent transition-all duration-300 group-hover:via-[#9c6d3e]/90" />

      {/* Corner gold sparkle on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#e8c4a0]/0 blur-2xl transition-all duration-500 group-hover:bg-[#e8c4a0]/40" />

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
