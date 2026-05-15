import React, { useState } from 'react';
import { FileTextIcon, CopyIcon, CheckIcon } from 'lucide-react';
export function ContractNumberPreview({ contractNo }: {contractNo: string;}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(contractNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-amber-700/10 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-4 shadow-[0_1px_2px_rgba(99,102,241,0.05)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full"
        style={{
          background:
          'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',
          filter: 'blur(8px)'
        }} />
      
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 ring-1 ring-amber-700/15 inline-flex items-center justify-center">
            <FileTextIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-900">
            Số hợp đồng
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[22px] leading-none font-semibold text-zinc-900 tracking-tight tabular-nums">
            {contractNo}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="h-8 w-8 rounded-lg bg-white ring-1 ring-amber-700/10 hover:ring-amber-700/20 hover:bg-amber-50/50 transition-all inline-flex items-center justify-center text-amber-800 shrink-0"
            aria-label="Copy số hợp đồng">
            
            {copied ?
            <CheckIcon className="h-3.5 w-3.5" /> :

            <CopyIcon className="h-3.5 w-3.5" />
            }
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-800/70 leading-relaxed">
          Số hợp đồng được ghép tự động từ số, năm, mã vùng, khu vực và mã
          quyền.
        </p>
      </div>
    </div>);

}