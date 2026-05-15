import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'








}: {open: boolean;onClose: () => void;title: string;description?: string;children: React.ReactNode;footer?: React.ReactNode;size?: 'sm' | 'md' | 'lg';}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  const widthClass =
  size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        style={{
          animation: 'fadeIn 180ms ease-out'
        }}
        onClick={onClose} />
      
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widthClass} bg-white rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-2xl shadow-zinc-950/20 overflow-hidden`}
        style={{
          animation: 'modalIn 220ms cubic-bezier(0.32,0.72,0,1)'
        }}>
        
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
        
        <header className="px-5 py-4 border-b border-zinc-100/80 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              {title}
            </h2>
            {description &&
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            }
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
            
            <XIcon className="h-4 w-4" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer &&
        <footer className="px-5 py-3 border-t border-zinc-100/80 bg-zinc-50/40 flex items-center justify-end gap-2">
            {footer}
          </footer>
        }
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>);

}