/**
 * FAB + popup hiện đại (Tactical HUD) mở Bộ tính bản quyền NĐ 17/2023
 * từ bất kỳ trang nào trong app.
 *
 * Ngôn ngữ thiết kế: nền đen sâu, viền emerald neon, mono numbers,
 * tương phản cao, glow nhẹ — "cool, ngầu".
 */
import React, { useEffect, useState } from 'react';
import { CalculatorIcon, XIcon } from 'lucide-react';
import { RoyaltyCalculatorPage } from '../../pages/RoyaltyCalculatorPage';

export function RoyaltyCalculatorFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở bộ tính bản quyền NĐ 17/2023"
        className="group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 pl-3 pr-4 py-3 rounded-2xl bg-zinc-950 text-emerald-300 border border-emerald-500/40 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.55),0_0_0_1px_rgba(16,185,129,0.15)] hover:border-emerald-400 hover:shadow-[0_14px_50px_-8px_rgba(16,185,129,0.75)] hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
      >
        <span className="absolute -inset-px rounded-2xl bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CalculatorIcon className="h-4 w-4" />
          <span className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-ping opacity-0 group-hover:opacity-100" />
        </span>
        <span className="relative flex flex-col items-start leading-none">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-emerald-500/70">NĐ 17 · Tool</span>
          <span className="text-[13px] font-bold tracking-tight text-white mt-0.5">Tính bản quyền</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            style={{ animation: 'rcFabFade 200ms ease-out' }}
          />

          {/* HUD Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bộ tính tiền bản quyền NĐ 17/2023"
            className="relative w-full max-w-7xl h-[92vh] bg-zinc-950 rounded-2xl border-2 border-zinc-800/80 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9),0_0_80px_-30px_rgba(16,185,129,0.35)] overflow-hidden flex flex-col"
            style={{ animation: 'rcFabIn 280ms cubic-bezier(0.32,0.72,0,1)' }}
          >
            {/* Subtle scanline / glow accents */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[60%] rounded-full bg-emerald-500/10 blur-3xl" />

            {/* HUD Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b-2 border-zinc-900 bg-zinc-950/90 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/40 rounded-lg">
                  <CalculatorIcon className="h-5 w-5 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight leading-none">
                    Royalty Compute Engine
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-[0.2em]">
                      NĐ 17/2023 · NĐ 134/2026
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
                      System: Online
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="h-10 w-10 flex items-center justify-center border border-zinc-800 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>

            {/* Body — scroll container; reuse full calculator page */}
            <div className="relative z-10 flex-1 overflow-y-auto rc-fab-scroll">
              <div className="rc-fab-skin">
                <RoyaltyCalculatorPage />
              </div>
            </div>
          </div>

          <style>{`
            @keyframes rcFabFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes rcFabIn {
              from { opacity: 0; transform: translateY(12px) scale(0.985); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
            .rc-fab-scroll::-webkit-scrollbar { width: 8px; }
            .rc-fab-scroll::-webkit-scrollbar-track { background: transparent; }
            .rc-fab-scroll::-webkit-scrollbar-thumb {
              background: rgba(16,185,129,0.18);
              border-radius: 9999px;
            }
            .rc-fab-scroll::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.4); }
          `}</style>
        </div>
      )}
    </>
  );
}
