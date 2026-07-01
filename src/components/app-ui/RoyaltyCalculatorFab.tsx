/**
 * FAB + popup — Cream & Marine editorial skin
 * Mở Bộ tính bản quyền NĐ 17/2023 từ bất kỳ trang nào.
 */
import React, { useEffect, useState } from 'react';
import { CalculatorIcon, XIcon } from 'lucide-react';
import { RoyaltyCalculatorPage } from '../../pages/RoyaltyCalculatorPage';

const NAVY = '#00384D';
const CREAM = '#F9F7F2';
const LINE = '#D9D3C7';
const SERIF: React.CSSProperties = { fontFamily: '"Cormorant Garamond", Georgia, serif' };

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
      {/* Floating Action Button — navy + cream */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở bộ tính bản quyền NĐ 17/2023"
        className="group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 pl-3 pr-4 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: NAVY,
          color: '#fff',
          boxShadow: '0 10px 30px -6px rgba(0,56,77,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <span
          className="relative flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}
        >
          <CalculatorIcon className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }} />
        </span>
        <span className="flex flex-col items-start leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            NĐ 17/2023
          </span>
          <span className="text-[13px] font-bold tracking-tight mt-0.5">Tính bản quyền</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(15, 23, 42, 0.45)', animation: 'rcFabFade 200ms ease-out' }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bộ tính tiền bản quyền NĐ 17/2023"
            className="relative w-full max-w-7xl h-[92vh] rounded-xl overflow-hidden flex flex-col"
            style={{
              background: CREAM,
              border: `1px solid ${LINE}`,
              boxShadow: '0 40px 100px -20px rgba(0,56,77,0.35), 0 0 0 1px rgba(0,0,0,0.04)',
              animation: 'rcFabIn 280ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Editorial Header */}
            <header
              className="relative flex items-center justify-between px-6 py-4 shrink-0"
              style={{ background: '#fff', borderBottom: `1px solid ${LINE}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 flex items-center justify-center rounded"
                  style={{ background: NAVY, color: '#fff' }}
                >
                  <CalculatorIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: NAVY }}>
                    VCPMC · Bộ công cụ báo giá
                  </div>
                  <h2 className="text-[18px] font-bold leading-none mt-1" style={{ ...SERIF, color: NAVY }}>
                    Tính tiền bản quyền âm nhạc
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <div className="text-[9.5px] uppercase tracking-widest font-semibold" style={{ color: '#8C877E' }}>
                    Căn cứ pháp lý
                  </div>
                  <div className="text-[12px] font-semibold" style={{ color: NAVY }}>
                    Nghị định 17/2023/NĐ-CP
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="h-9 w-9 flex items-center justify-center rounded transition-colors"
                  style={{ border: `1px solid ${LINE}`, color: '#6B665F' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#B91C1C'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B665F'; e.currentTarget.style.borderColor = LINE; }}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto rc-fab-scroll" style={{ background: CREAM }}>
              <RoyaltyCalculatorPage />
            </div>
          </div>

          <style>{`
            @keyframes rcFabFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes rcFabIn {
              from { opacity: 0; transform: translateY(12px) scale(0.985); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .rc-fab-scroll::-webkit-scrollbar { width: 10px; }
            .rc-fab-scroll::-webkit-scrollbar-track { background: ${CREAM}; }
            .rc-fab-scroll::-webkit-scrollbar-thumb {
              background: ${LINE};
              border-radius: 9999px;
              border: 2px solid ${CREAM};
            }
            .rc-fab-scroll::-webkit-scrollbar-thumb:hover { background: #B8B1A4; }
          `}</style>
        </div>
      )}
    </>
  );
}
