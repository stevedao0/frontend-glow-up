import React, { useEffect, useState } from 'react';
import {
  XIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileIcon,
  CheckIcon } from
'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { formatDate } from '../../lib/format';
type ReportType =
'summary' |
'employee' |
'signed' |
'pending' |
'expiring' |
'gcn' |
'revenue';
type ReportFormat = 'excel' | 'pdf' | 'word';
const REPORT_TYPE_OPTIONS: {
  value: ReportType;
  label: string;
}[] = [
{
  value: 'summary',
  label: 'Báo cáo tổng hợp'
},
{
  value: 'employee',
  label: 'Báo cáo theo nhân viên'
},
{
  value: 'signed',
  label: 'Hợp đồng đã ký'
},
{
  value: 'pending',
  label: 'Hợp đồng chưa ký'
},
{
  value: 'expiring',
  label: 'Hợp đồng sắp hết hạn'
},
{
  value: 'gcn',
  label: 'GCN'
},
{
  value: 'revenue',
  label: 'Doanh thu'
}];

const FORMAT_OPTIONS: {
  value: ReportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
{
  value: 'excel',
  label: 'Excel chi tiết',
  description: 'Bảng dữ liệu đầy đủ, dễ xử lý',
  icon: <FileSpreadsheetIcon className="h-5 w-5" />
},
{
  value: 'pdf',
  label: 'PDF trình bày',
  description: 'Văn bản trình bày, sẵn sàng in',
  icon: <FileIcon className="h-5 w-5" />
},
{
  value: 'word',
  label: 'Word lãnh đạo',
  description: 'Báo cáo hoàn chỉnh để trình lãnh đạo',
  icon: <FileTextIcon className="h-5 w-5" />
}];

export function ExportReportDialog({
  open,
  onClose,
  defaultType = 'summary',
  timeLabel = 'Năm này',
  preparedBy = 'admin@vcpmc.org'






}: {open: boolean;onClose: () => void;defaultType?: ReportType;timeLabel?: string;preparedBy?: string;}) {
  const [reportType, setReportType] = useState<ReportType>(defaultType);
  const [format, setFormat] = useState<ReportFormat>('excel');
  const [includeKpi, setIncludeKpi] = useState(true);
  const [includeChart, setIncludeChart] = useState(true);
  const [includeDetail, setIncludeDetail] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeExportDate, setIncludeExportDate] = useState(true);
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
  const reportTitle =
  REPORT_TYPE_OPTIONS.find((r) => r.value === reportType)?.label ??
  'Báo cáo tổng hợp';
  const today = formatDate(new Date().toISOString().slice(0, 10));
  const handleExport = () => {
    alert(`Đang xuất ${reportTitle} dưới dạng ${format.toUpperCase()}…`);
    onClose();
  };
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
        aria-label="Xuất báo cáo"
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-50 rounded-2xl ring-1 ring-zinc-900/[0.06] shadow-2xl shadow-zinc-950/30 overflow-hidden flex flex-col"
        style={{
          animation: 'modalIn 220ms cubic-bezier(0.32,0.72,0,1)'
        }}>
        
        {/* Premium gradient header */}
        <header className="relative overflow-hidden text-white">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
              'linear-gradient(135deg, #0a0a1a 0%, #1e1b4b 35%, #4c1d95 100%)'
            }} />
          
          <div
            aria-hidden
            className="absolute -top-12 -right-12 h-44 w-44 rounded-full"
            style={{
              background:
              'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 65%)',
              filter: 'blur(20px)'
            }} />
          
          <div className="relative px-5 py-4 flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-inset ring-white/20 inline-flex items-center justify-center">
              <DownloadIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
                Xuất báo cáo
              </p>
              <h2 className="text-base font-semibold tracking-tight">
                Tạo báo cáo trình lãnh đạo
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-colors ring-1 ring-inset ring-white/10">
              
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Left — options */}
          <div className="lg:col-span-2 p-5 space-y-5 lg:border-r lg:border-zinc-200 bg-white">
            {/* Report type */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
                1. Loại báo cáo
              </h3>
              <div className="space-y-1">
                {REPORT_TYPE_OPTIONS.map((opt) =>
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReportType(opt.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${reportType === opt.value ? 'bg-indigo-50 text-indigo-900 ring-1 ring-inset ring-indigo-600/20' : 'text-zinc-700 hover:bg-zinc-50'}`}>
                  
                    <span
                    className={`h-3.5 w-3.5 rounded-full inline-flex items-center justify-center shrink-0 ${reportType === opt.value ? 'bg-indigo-600 text-white' : 'ring-1 ring-zinc-300'}`}>
                    
                      {reportType === opt.value &&
                    <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />
                    }
                    </span>
                    {opt.label}
                  </button>
                )}
              </div>
            </section>

            {/* Format */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
                2. Định dạng
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {FORMAT_OPTIONS.map((f) =>
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ring-1 ${format === f.value ? 'bg-indigo-50/60 ring-indigo-600/20' : 'bg-white ring-zinc-200 hover:ring-zinc-300'}`}>
                  
                    <span
                    className={`h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0 ${format === f.value ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                    
                      {f.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900">
                        {f.label}
                      </span>
                      <span className="block text-[11px] text-zinc-500 mt-0.5 leading-snug">
                        {f.description}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </section>

            {/* Includes */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
                3. Nội dung kèm theo
              </h3>
              <div className="space-y-2">
                <CheckRow
                  label="Kèm KPI tổng quan"
                  checked={includeKpi}
                  onChange={setIncludeKpi} />
                
                <CheckRow
                  label="Kèm biểu đồ"
                  checked={includeChart}
                  onChange={setIncludeChart} />
                
                <CheckRow
                  label="Kèm danh sách chi tiết"
                  checked={includeDetail}
                  onChange={setIncludeDetail} />
                
                <CheckRow
                  label="Kèm chữ ký / người lập"
                  checked={includeSignature}
                  onChange={setIncludeSignature} />
                
                <CheckRow
                  label="Kèm ngày xuất báo cáo"
                  checked={includeExportDate}
                  onChange={setIncludeExportDate} />
                
              </div>
            </section>
          </div>

          {/* Right — preview */}
          <div className="lg:col-span-3 p-5 bg-zinc-100/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
              4. Xem trước báo cáo
            </h3>
            <div className="bg-white rounded-xl ring-1 ring-zinc-900/[0.06] shadow-[0_1px_2px_rgba(15,15,25,0.04),0_8px_24px_rgba(15,15,25,0.06)] overflow-hidden">
              {/* Document header — formal */}
              <div className="px-6 py-5 border-b border-zinc-200 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                  Trung tâm Bảo vệ Quyền tác giả Âm nhạc Việt Nam
                </p>
                <div className="mt-1 mx-auto w-12 h-px bg-zinc-300" />
                <h4 className="mt-3 text-base font-bold text-zinc-900 uppercase tracking-tight">
                  {reportTitle}
                </h4>
                <p className="mt-1 text-[12px] text-zinc-600">
                  Mảng Background
                </p>
              </div>
              {/* Meta */}
              <div className="px-6 py-3 border-b border-zinc-100 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="block text-zinc-500">Thời gian</span>
                  <span className="font-semibold text-zinc-900">
                    {timeLabel}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-500">Người lập</span>
                  <span className="font-semibold text-zinc-900">
                    {includeSignature ? preparedBy : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-500">Ngày xuất</span>
                  <span className="font-semibold text-zinc-900">
                    {includeExportDate ? today : '—'}
                  </span>
                </div>
              </div>
              {/* Body — sample mock content */}
              <div className="px-6 py-5 space-y-4">
                {includeKpi &&
                <section>
                    <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-700 mb-2">
                      I. KPI tổng quan
                    </h5>
                    <table className="w-full text-[12px]">
                      <tbody>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1.5 text-zinc-700">
                            Tổng hợp đồng
                          </td>
                          <td className="py-1.5 text-right font-semibold text-zinc-900 tabular-nums">
                            3.365
                          </td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1.5 text-zinc-700">
                            Đã ký năm 2026
                          </td>
                          <td className="py-1.5 text-right font-semibold text-zinc-900 tabular-nums">
                            42
                          </td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1.5 text-zinc-700">Còn hiệu lực</td>
                          <td className="py-1.5 text-right font-semibold text-zinc-900 tabular-nums">
                            121
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-zinc-700">
                            Doanh thu 2026
                          </td>
                          <td className="py-1.5 text-right font-semibold text-zinc-900 tabular-nums">
                            1.075.536.342 đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                }
                {includeChart &&
                <section>
                    <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-700 mb-2">
                      II. Biểu đồ doanh thu
                    </h5>
                    <div className="h-20 rounded-md bg-gradient-to-r from-zinc-50 via-indigo-50/40 to-violet-50/30 ring-1 ring-zinc-100 flex items-end gap-2 p-2">
                      <span className="flex-1 bg-zinc-300 rounded-sm h-[20%]" />
                      <span className="flex-1 bg-zinc-400 rounded-sm h-[80%]" />
                      <span className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-sm h-[40%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1 px-1">
                      <span>2024</span>
                      <span>2025</span>
                      <span>2026</span>
                    </div>
                  </section>
                }
                {includeDetail &&
                <section>
                    <h5 className="text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-700 mb-2">
                      III. Chi tiết
                    </h5>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="py-1.5 text-left font-semibold text-zinc-700">
                            Số HĐ
                          </th>
                          <th className="py-1.5 text-left font-semibold text-zinc-700">
                            Đơn vị
                          </th>
                          <th className="py-1.5 text-right font-semibold text-zinc-700">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1 font-mono">0645/2026</td>
                          <td className="py-1 text-zinc-700">KARAOKE ICOOL</td>
                          <td className="py-1 text-right tabular-nums">
                            64.696.320 đ
                          </td>
                        </tr>
                        <tr className="border-b border-zinc-100">
                          <td className="py-1 font-mono">0581/2026</td>
                          <td className="py-1 text-zinc-700">
                            KARAOKE NGỌC THANH
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            36.802.097 đ
                          </td>
                        </tr>
                        <tr className="bg-zinc-50">
                          <td
                          className="py-1.5 font-bold text-zinc-900"
                          colSpan={2}>
                          
                            Tổng cộng
                          </td>
                          <td className="py-1.5 text-right font-bold text-zinc-900 tabular-nums">
                            1.075.536.342 đ
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                }
                {includeSignature &&
                <section className="pt-4 grid grid-cols-2 gap-4 text-[11px] text-center">
                    <div>
                      <p className="text-zinc-500">Người lập báo cáo</p>
                      <div className="h-10" />
                      <p className="font-semibold text-zinc-900">
                        {preparedBy}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Lãnh đạo phê duyệt</p>
                      <div className="h-10" />
                      <p className="font-semibold text-zinc-900">……………………………</p>
                    </div>
                  </section>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-zinc-200 bg-white flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            leftIcon={<DownloadIcon className="h-4 w-4" />}
            onClick={handleExport}>
            
            Xuất báo cáo
          </Button>
        </footer>

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
function CheckRow({
  label,
  checked,
  onChange




}: {label: string;checked: boolean;onChange: (v: boolean) => void;}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <Checkbox checked={checked} onChange={() => onChange(!checked)} />
      <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
        {label}
      </span>
    </label>);

}