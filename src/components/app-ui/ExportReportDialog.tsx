import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  XIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileIcon,
  FileTextIcon,
  CheckIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { formatDate } from '../../lib/format';
import {
  exportContractsExcel,
  exportExpiringContractsExcel,
  exportRevenueExcel,
  exportSignedContractsExcel,
  exportPendingContractsExcel,
  exportFullDataExcel,
  type ExportContractsParams,
  type ExportExpiringParams,
  type ExportRevenueParams,
} from '../../lib/reportsClient';
import { TOKEN_KEY } from '../../lib/authClient';

// Report types that are SUPPORTED for export
type SupportedReportType = 'contracts' | 'expiring' | 'revenue' | 'signed' | 'pending' | 'full_data';

// Full report type enum (includes unsupported types)
type ReportType =
  | 'contracts'
  | 'expiring'
  | 'revenue'
  | 'summary'
  | 'employee'
  | 'signed'
  | 'pending'
  | 'gcn'
  | 'full_data';

type ReportFormat = 'excel' | 'pdf' | 'word';

interface ReportOption {
  value: ReportType;
  label: string;
  supported: boolean;
  disabledReason?: string;
  supportedFormats: ReportFormat[];
}

const REPORT_TYPE_OPTIONS: ReportOption[] = [
  {
    value: 'contracts',
    label: 'Danh sách hợp đồng',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'expiring',
    label: 'Hợp đồng sắp hết hạn',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'revenue',
    label: 'Doanh thu tổng hợp',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'full_data',
    label: 'Xuất dữ liệu đầy đủ',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'summary',
    label: 'Báo cáo tổng hợp',
    supported: false,
    disabledReason: 'Đang phát triển',
    supportedFormats: [],
  },
  {
    value: 'employee',
    label: 'Báo cáo theo nhân viên',
    supported: false,
    disabledReason: 'Chưa có API thống kê nhân viên',
    supportedFormats: [],
  },
  {
    value: 'signed',
    label: 'Hợp đồng đã ký',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'pending',
    label: 'Hợp đồng chưa ký',
    supported: true,
    supportedFormats: ['excel'],
  },
  {
    value: 'gcn',
    label: 'Báo cáo GCN',
    supported: false,
    disabledReason: 'Chờ fix dữ liệu GCN trước khi xuất báo cáo',
    supportedFormats: [],
  },
];

const FORMAT_OPTIONS: {
  value: ReportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'excel',
    label: 'Excel (.xlsx)',
    description: 'Bảng dữ liệu đầy đủ, dễ xử lý',
    icon: <FileSpreadsheetIcon className="h-5 w-5" />,
  },
  {
    value: 'pdf',
    label: 'PDF trình bày',
    description: 'Chưa hỗ trợ',
    icon: <FileIcon className="h-5 w-5" />,
  },
  {
    value: 'word',
    label: 'Word lãnh đạo',
    description: 'Chưa hỗ trợ',
    icon: <FileTextIcon className="h-5 w-5" />,
  },
];

export interface ExportReportDialogProps {
  open: boolean;
  onClose: () => void;
  contractsFilters?: ExportContractsParams;
  expiringFilters?: ExportExpiringParams;
  revenueFilters?: ExportRevenueParams;
  signedFilters?: { scope?: string; year?: number; employee?: string; field?: string };
  pendingFilters?: { year?: number; employee?: string; field?: string };
  fullDataFilters?: { year?: number; domain?: string; date_from?: string; date_to?: string };
  defaultType?: ReportType;
  timeLabel?: string;
}

export function ExportReportDialog({
  open,
  onClose,
  contractsFilters = {},
  expiringFilters = {},
  revenueFilters = {},
  signedFilters = {},
  pendingFilters = {},
  fullDataFilters = {},
  defaultType = 'contracts',
}: ExportReportDialogProps) {
  const [reportType, setReportType] = useState<ReportType>(defaultType);
  const [format, setFormat] = useState<ReportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setReportType(defaultType);
    setFormat('excel');
    setError(null);
    setIsExporting(false);

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
  }, [open, defaultType, onClose]);

  // Focus trap
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  const currentReport = REPORT_TYPE_OPTIONS.find((r) => r.value === reportType);
  const isSupported = currentReport?.supported ?? false;
  const supportedFormats = currentReport?.supportedFormats ?? [];

  const handleExport = useCallback(async () => {
    if (!isSupported) {
      setError(currentReport?.disabledReason || 'Báo cáo này chưa được hỗ trợ.');
      return;
    }

    if (!supportedFormats.includes(format)) {
      setError(`Định dạng ${format.toUpperCase()} chưa được hỗ trợ cho báo cáo này.`);
      return;
    }

    setIsExporting(true);
    setError(null);

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('Vui lòng đăng nhập lại để xuất báo cáo.');
      setIsExporting(false);
      return;
    }

    try {
      switch (reportType) {
        case 'contracts':
          await exportContractsExcel(token, contractsFilters);
          break;
        case 'expiring':
          await exportExpiringContractsExcel(token, expiringFilters);
          break;
        case 'revenue':
          await exportRevenueExcel(token, revenueFilters);
          break;
        case 'signed':
          await exportSignedContractsExcel(token, signedFilters);
          break;
        case 'pending':
          await exportPendingContractsExcel(token, pendingFilters);
          break;
        case 'full_data':
          await exportFullDataExcel(token, fullDataFilters);
          break;
        default:
          setError('Loại báo cáo chưa được hỗ trợ.');
          return;
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xuất báo cáo.';
      setError(message);
    } finally {
      setIsExporting(false);
    }
  }, [reportType, format, isSupported, supportedFormats, currentReport, contractsFilters, expiringFilters, revenueFilters, signedFilters, pendingFilters, fullDataFilters, onClose]);

  if (!open) return null;

  const today = formatDate(new Date().toISOString().slice(0, 10));
  const reportTitle = currentReport?.label ?? 'Báo cáo';

  const dialogContent = (
    <div
      className="fixed inset-0 z-[100] p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        tabIndex={-1}
        className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-32px),1100px)] max-h-[calc(100dvh-32px)] -translate-x-1/2 -translate-y-1/2 flex flex-col bg-zinc-50 rounded-2xl shadow-2xl shadow-zinc-950/40 overflow-hidden focus:outline-none"
        style={{
          animation: 'modalSlideIn 200ms ease-out',
        }}
      >
        {/* Header */}
        <header className="shrink-0 bg-gradient-to-r from-[#0a0a1a] via-[#1e1b4b] to-[#4c1d95] text-white">
          <div className="px-5 py-4 flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-inset ring-white/20 inline-flex items-center justify-center">
              <DownloadIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
                Xuất báo cáo
              </p>
              <h2 id="export-dialog-title" className="text-base font-semibold tracking-tight">
                Tạo báo cáo Excel
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-colors ring-1 ring-inset ring-white/10"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shrink-0">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr] overflow-hidden">
          {/* Left panel */}
          <aside className="min-h-0 overflow-y-auto p-4 lg:p-5 space-y-5 border-r border-zinc-200 bg-white">
            {/* Report type */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
                1. Loại báo cáo
              </h3>
              <div className="space-y-1">
                {REPORT_TYPE_OPTIONS.map((opt) => {
                  const isActive = reportType === opt.value;
                  const isDisabled = !opt.supported;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) {
                          setReportType(opt.value);
                          setError(null);
                        }
                      }}
                      disabled={isDisabled}
                      title={isDisabled ? opt.disabledReason : undefined}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-700/20'
                          : isDisabled
                          ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span
                        className={`h-3.5 w-3.5 rounded-full inline-flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-amber-700 text-white'
                            : isDisabled
                            ? 'bg-zinc-200'
                            : 'ring-1 ring-zinc-300'
                        }`}
                      >
                        {isActive && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                        {isDisabled && <XIcon className="h-2 w-2" />}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {isDisabled && (
                        <span className="text-[10px] text-zinc-400">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Format */}
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-2">
                2. Định dạng
              </h3>
              <div className="space-y-2">
                {FORMAT_OPTIONS.map((f) => {
                  const isActive = format === f.value;
                  const isSupportedFormat = supportedFormats.includes(f.value) && isSupported;

                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => {
                        if (isSupportedFormat) {
                          setFormat(f.value);
                          setError(null);
                        }
                      }}
                      disabled={!isSupportedFormat}
                      title={!isSupportedFormat && isSupported ? 'Chưa hỗ trợ' : undefined}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ring-1 ${
                        isActive
                          ? 'bg-amber-50/60 ring-amber-700/20'
                          : !isSupportedFormat
                          ? 'bg-zinc-50 ring-zinc-200 opacity-60 cursor-not-allowed'
                          : 'bg-white ring-zinc-200 hover:ring-zinc-300'
                      }`}
                    >
                      <span
                        className={`h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-amber-700 text-white'
                            : !isSupportedFormat
                            ? 'bg-zinc-200 text-zinc-400'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
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
                  );
                })}
              </div>
            </section>

            {/* Info note */}
            {!isSupported && (
              <div className="text-xs text-zinc-500 bg-zinc-50 rounded-lg p-3">
                <p className="font-medium text-zinc-600 mb-1">Lưu ý:</p>
                <p>{currentReport?.disabledReason}</p>
              </div>
            )}
          </aside>

          {/* Right panel - preview */}
          <main className="min-h-0 overflow-y-auto p-4 lg:p-5 bg-zinc-100/50">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500 mb-3">
              3. Xem trước báo cáo
            </h3>
            <div className="bg-white rounded-xl ring-1 ring-zinc-900/[0.06] shadow-sm overflow-hidden">
              {/* Document header */}
              <div className="px-5 py-4 border-b border-zinc-200 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-700">
                  Trung tâm Bảo vệ Quyền tác giả Âm nhạc Việt Nam
                </p>
                <div className="mt-1 mx-auto w-10 h-px bg-zinc-300" />
                <h4 className="mt-2 text-sm font-bold text-zinc-900 uppercase tracking-tight">
                  {reportTitle}
                </h4>
                <p className="mt-0.5 text-[12px] text-zinc-600">
                  {isSupported ? 'Xuất Excel (.xlsx)' : 'Chưa hỗ trợ'}
                </p>
              </div>

              {/* Info panel */}
              <div className="px-5 py-3 border-b border-zinc-100 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <span className="block text-zinc-500">Định dạng</span>
                  <span className="font-semibold text-zinc-900">
                    {isSupported ? 'Excel (.xlsx)' : '—'}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-500">Ngày xuất</span>
                  <span className="font-semibold text-zinc-900">{today}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Trạng thái</span>
                  <span className={`font-semibold ${isSupported ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {isSupported ? 'Sẵn sàng' : 'Chưa hỗ trợ'}
                  </span>
                </div>
              </div>

              {/* Preview content */}
              <div className="px-5 py-4">
                {isSupported ? (
                  <div className="flex items-start gap-3 text-sm text-zinc-600">
                    <FileSpreadsheetIcon className="h-7 w-7 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-zinc-900">File Excel sẽ bao gồm:</p>
                      <ul className="mt-1 text-xs text-zinc-500 space-y-0.5">
                        {reportType === 'contracts' && (
                          <>
                            <li>• Danh sách hợp đồng đầy đủ</li>
                            <li>• Thông tin: Số HĐ, đơn vị, bảng hiệu, lĩnh vực</li>
                            <li>• Trạng thái, ngày hiệu lực, hết hạn</li>
                            <li>• Tiền trước thuế, VAT, tổng tiền</li>
                            <li>• Dòng tổng cộng ở cuối file</li>
                          </>
                        )}
                        {reportType === 'expiring' && (
                          <>
                            <li>• Hợp đồng sắp hết hạn</li>
                            <li>• Số HĐ, đơn vị, lĩnh vực</li>
                            <li>• Ngày hết hạn, số ngày còn lại</li>
                            <li>• Highlight hợp đồng ≤30 ngày</li>
                          </>
                        )}
                        {reportType === 'revenue' && (
                          <>
                            <li>• Sheet Tổng hợp: KPI chính</li>
                            <li>• Sheet Theo lĩnh vực: phân bổ theo domain</li>
                            <li>• Sheet Theo năm: doanh thu theo năm</li>
                          </>
                        )}
                        {reportType === 'signed' && (
                          <>
                            <li>• Danh sách hợp đồng đã ký</li>
                            <li>• Thông tin: Số HĐ, đơn vị, lĩnh vực</li>
                            <li>• Ngày ký, thời hạn, giá trị</li>
                            <li>• Trạng thái GCN, nhân viên phụ trách</li>
                          </>
                        )}
                        {reportType === 'pending' && (
                          <>
                            <li>• Danh sách hợp đồng chưa ký</li>
                            <li>• Thông tin: Số HĐ, đơn vị, lĩnh vực</li>
                            <li>• Phân loại: thiếu tài chính, chờ tái ký</li>
                            <li>• Nhân viên phụ trách, ngày ký</li>
                          </>
                        )}
                          {reportType === 'full_data' && (
                            <>
                              <li>• Toàn bộ dữ liệu hợp đồng</li>
                              <li>• Số HĐ, Năm, Số phụ lục</li>
                              <li>• Tên đơn vị, Địa chỉ, Điện thoại</li>
                              <li>• Người đại diện, Chức vụ, MST, Email</li>
                              <li>• Bảng hiệu, Địa chỉ sử dụng/pháp lý</li>
                              <li>• Lĩnh vực, Ngày lập/bắt đầu/kết thúc</li>
                              <li>• Tiền bản quyền, VAT, Tổng số phòng/box</li>
                              <li>• Người thực hiện, Trạng thái gia hạn</li>
                              <li>• Định dạng giống template import Excel</li>
                            </>
                          )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-zinc-100 flex items-center justify-center">
                      <AlertCircleIcon className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-sm text-zinc-500">
                      Báo cáo này chưa được hỗ trợ xuất.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {currentReport?.disabledReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="shrink-0 px-5 py-3 border-t border-zinc-200 bg-white flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Hủy
          </Button>
          <Button
            variant="primary"
            leftIcon={
              isExporting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )
            }
            onClick={handleExport}
            disabled={!isSupported || isExporting}
            title={!isSupported ? currentReport?.disabledReason : undefined}
          >
            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        </footer>

        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: scale(0.96) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );

  // Render via Portal to document.body
  return createPortal(dialogContent, document.body);
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <Checkbox checked={checked} onChange={() => onChange(!checked)} />
      <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
        {label}
      </span>
    </label>
  );
}
