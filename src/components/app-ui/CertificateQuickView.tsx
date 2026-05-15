import React, { useEffect } from 'react';
import {
  XIcon,
  PrinterIcon,
  AwardIcon,
  HashIcon,
  FileTextIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
  HistoryIcon } from
'lucide-react';
import {
  CertificateRecord,
  CERTIFICATE_STATUS_LABEL } from
'../../data/certificateRecords';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { formatDate } from '../../lib/format';
export function CertificateQuickView({
  record,
  onClose,
  onUpdateNumber,
  onPrintTest,
  onPrintFinal






}: {record: CertificateRecord | null;onClose: () => void;onUpdateNumber?: (r: CertificateRecord) => void;onPrintTest?: (r: CertificateRecord) => void;onPrintFinal?: (r: CertificateRecord) => void;}) {
  useEffect(() => {
    if (!record) return;
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
  }, [record, onClose]);
  if (!record) return null;
  const hasNumber = !!record.certificate_no;
  const statusLabel = CERTIFICATE_STATUS_LABEL[record.status];
  const statusTone =
  record.status === 'final_printed' ?
  'success' :
  record.status === 'test_printed' ?
  'warning' :
  'neutral';
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        style={{
          animation: 'fadeIn 180ms ease-out'
        }}
        onClick={onClose} />
      
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết GCN ${record.certificate_no ?? 'chưa cấp số'}`}
        className="absolute right-0 top-0 bottom-0 w-full max-w-[540px] bg-zinc-50 shadow-2xl shadow-zinc-950/40 flex flex-col"
        style={{
          animation: 'slideInR 240ms cubic-bezier(0.32,0.72,0,1)'
        }}>
        
        {/* Header — certificate themed gradient */}
        <header className="relative overflow-hidden text-white">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
              'linear-gradient(135deg, #0a0a1a 0%, #312e81 35%, #6d28d9 100%)'
            }} />
          
          {/* Seal stamp */}
          <svg
            aria-hidden
            viewBox="0 0 200 200"
            className="absolute -bottom-8 -right-8 h-44 w-44 opacity-[0.08] text-white"
            fill="none">
            
            <circle
              cx="100"
              cy="100"
              r="78"
              stroke="currentColor"
              strokeWidth="2" />
            
            <circle
              cx="100"
              cy="100"
              r="62"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3 4" />
            
            <text
              x="100"
              y="106"
              textAnchor="middle"
              fontFamily="serif"
              fontSize="16"
              fill="currentColor"
              fontWeight="600"
              letterSpacing="2">
              
              GCN
            </text>
          </svg>
          <div
            aria-hidden
            className="absolute -top-12 -left-10 h-44 w-44 rounded-full"
            style={{
              background:
              'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 65%)',
              filter: 'blur(20px)'
            }} />
          
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          

          <div className="relative px-5 py-5 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
                Giấy chứng nhận
              </p>
              {hasNumber ?
              <h2 className="mt-1.5 font-mono text-lg sm:text-xl font-semibold text-white tracking-tight break-all leading-tight">
                  {record.certificate_no}
                </h2> :

              <h2 className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-rose-400/15 text-rose-200 ring-1 ring-inset ring-rose-400/30">
                  <HashIcon className="h-3.5 w-3.5" />
                  Chưa cấp số GCN
                </h2>
              }
              <p className="mt-1.5 text-[13px] text-amber-100/85 line-clamp-1">
                {record.organization_name}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${record.status === 'final_printed' ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30' : record.status === 'test_printed' ? 'bg-amber-400/15 text-amber-200 ring-amber-400/30' : 'bg-white/10 text-zinc-300 ring-white/15'}`}>
                  
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${record.status === 'final_printed' ? 'bg-emerald-400' : record.status === 'test_printed' ? 'bg-amber-400' : 'bg-zinc-300'}`} />
                  
                  {statusLabel}
                </span>
                {record.print_count > 0 &&
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-amber-100 ring-1 ring-inset ring-white/15">
                    <PrinterIcon className="h-3 w-3" />
                    Đã in {record.print_count} lần
                  </span>
                }
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-colors shrink-0 ring-1 ring-inset ring-white/10">
              
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
          {/* Mini certificate preview */}
          <div className="relative overflow-hidden rounded-xl ring-1 ring-amber-700/10 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-4">
            <div
              aria-hidden
              className="absolute -top-6 -right-6 h-24 w-24 rounded-full"
              style={{
                background:
                'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)',
                filter: 'blur(8px)'
              }} />
            
            <div className="relative flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 ring-1 ring-amber-700/15 inline-flex items-center justify-center">
                <AwardIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                  Số GCN
                </p>
                <p
                  className={`mt-0.5 font-mono text-base font-semibold leading-tight tracking-tight ${hasNumber ? 'text-zinc-900' : 'text-zinc-400 italic'}`}>
                  
                  {hasNumber ? record.certificate_no : 'Chưa cấp số'}
                </p>
              </div>
            </div>
          </div>

          {/* Thông tin GCN */}
          <SectionCard
            title="Thông tin GCN"
            icon={<AwardIcon className="h-3.5 w-3.5" />}>
            
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Số GCN"
                value={record.certificate_no ?? 'Chưa cấp số'}
                mono
                muted={!hasNumber} />
              
              <Field label="Trạng thái" value={statusLabel} />
              <Field
                label="Ngày tạo"
                value={formatDate(record.created_at.slice(0, 10))}
                mono />
              
              <Field
                label="Ngày in"
                value={
                record.printed_at ?
                formatDate(record.printed_at.slice(0, 10)) :
                '—'
                }
                mono
                muted={!record.printed_at} />
              
            </div>
          </SectionCard>

          {/* Thông tin hợp đồng */}
          <SectionCard
            title="Thông tin hợp đồng"
            icon={<FileTextIcon className="h-3.5 w-3.5" />}>
            
            <div className="space-y-3">
              <Field
                label="Số hợp đồng"
                value={record.contract_no}
                mono
                accent />
              
              <div className="grid grid-cols-1 gap-3">
                <Field label="Đơn vị" value={record.organization_name} />
                {record.business_sign_name &&
                <Field label="Bảng hiệu" value={record.business_sign_name} />
                }
              </div>
            </div>
          </SectionCard>

          {/* Địa chỉ */}
          <SectionCard
            title="Địa chỉ"
            icon={<MapPinIcon className="h-3.5 w-3.5" />}>
            
            <p className="text-sm text-zinc-700 leading-relaxed">
              {record.address}
            </p>
          </SectionCard>

          {/* Hiệu lực */}
          <SectionCard
            title="Hiệu lực"
            icon={<CalendarIcon className="h-3.5 w-3.5" />}>
            
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Từ ngày"
                value={formatDate(record.effective_from)}
                mono />
              
              <Field
                label="Đến ngày"
                value={formatDate(record.effective_to)}
                mono />
              
            </div>
          </SectionCard>

          {/* Lịch sử in */}
          <SectionCard
            title="Lịch sử in"
            icon={<HistoryIcon className="h-3.5 w-3.5" />}>
            
            {record.print_count === 0 ?
            <p className="text-sm text-zinc-500 italic">Chưa in lần nào</p> :

            <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-600/15 inline-flex items-center justify-center">
                  <PrinterIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                    {record.print_count} lần
                  </p>
                  <p className="text-xs text-zinc-500">
                    Lần gần nhất:{' '}
                    {record.printed_at ?
                  formatDate(record.printed_at.slice(0, 10)) :
                  '—'}
                  </p>
                </div>
              </div>
            }
          </SectionCard>
        </div>

        {/* Footer actions — adapt to status */}
        <footer className="px-5 py-3 border-t border-zinc-200 bg-white flex items-center gap-2 flex-wrap">
          {!hasNumber &&
          <Button
            variant="primary"
            leftIcon={<HashIcon className="h-4 w-4" />}
            onClick={() => onUpdateNumber?.(record)}
            disabled={!onUpdateNumber}
            title="GCN-P1 read-only: chua bat cap so GCN">
            
              Cập nhật số GCN
            </Button>
          }
          {hasNumber && record.status === 'draft' &&
          <Button
            variant="primary"
            leftIcon={<PrinterIcon className="h-4 w-4" />}
            onClick={() => onPrintTest?.(record)}
            disabled={!onPrintTest}
            title="GCN-P1 read-only: chua bat in thu">
            
              In thử
            </Button>
          }
          {record.status === 'test_printed' &&
          <Button
            variant="primary"
            leftIcon={<AwardIcon className="h-4 w-4" />}
            onClick={() => onPrintFinal?.(record)}
            disabled={!onPrintFinal}
            title="GCN-P1 read-only: chua bat in chinh thuc">
            
              In chính thức
            </Button>
          }
          {hasNumber && record.status !== 'draft' &&
          <Button
            variant="secondary"
            leftIcon={<HashIcon className="h-4 w-4" />}
            onClick={() => onUpdateNumber?.(record)}
            disabled={!onUpdateNumber}
            title="GCN-P1 read-only: chua bat sua so GCN">
            
              Sửa số GCN
            </Button>
          }
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </footer>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideInR { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </aside>
    </div>);

}
function SectionCard({
  title,
  icon,
  children




}: {title: string;icon?: React.ReactNode;children: React.ReactNode;}) {
  return (
    <section className="relative bg-white rounded-xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.03)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      
      <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">
        {icon && <span className="text-zinc-400">{icon}</span>}
        {title}
      </h3>
      <div>{children}</div>
    </section>);

}
function Field({
  label,
  value,
  mono,
  muted,
  accent






}: {label: string;value: string;mono?: boolean;muted?: boolean;accent?: boolean;}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      <span
        className={`text-sm font-medium break-words leading-snug ${mono ? 'font-mono tabular-nums' : ''} ${muted ? 'text-zinc-400 italic' : accent ? 'text-amber-800' : 'text-zinc-900'}`}>
        
        {value}
      </span>
    </div>);

}
