import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCwIcon,
  MailIcon,
  PrinterIcon,
  SettingsIcon,
  FileTextIcon,
  Trash2Icon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  FileIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  Edit2Icon,
  RotateCcwIcon,
  EyeIcon,
  FileDownIcon,
  Crosshair,
} from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { Input } from '../components/app-ui/Input';
import { Textarea } from '../components/app-ui/Textarea';
import { Tabs } from '../components/app-ui/Tabs';
import { EmptyState } from '../components/app-ui/EmptyState';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import { Modal } from '../components/app-ui/Modal';
import { RowActionsMenu, type RowAction } from '../components/app-ui/RowActionsMenu';
import { Checkbox } from '../components/app-ui/Checkbox';
import {
  getDispatches,
  getExpiredContracts,
  getEnvelopeLayoutConfig,
  saveEnvelopeLayoutConfig,
  createRenewalBatch,
  createNewKaraokeBatch,
  generateBatchEnvelope,
  generateBatchEnvelopeCalibration,
  createEnvelopeTest230x170,
  createEnvelopeTestCanon,
  createEnvelopeAlignmentTest,
  createEnvelopeAlignmentTest32mm,
  deleteDispatch,
  getDownloadUrl,
  downloadFile,
  getBatches,
  getBatchDetail,
  getTrackingItems,
  updateDispatchStatus,
  updateItemTracking,
  updateBatch,
  deleteBatch,
  restoreBatch,
  updateItem,
  deleteItem,
  restoreItem,
  bulkDeleteBatches,
  bulkDeleteItems,
  type DispatchItem,
  type ExpiredContractItem,
  type EnvelopeLayoutConfig,
  type BatchListItem,
  type BatchDetail,
  type BatchItem,
  type NewKaraokeProspectRow,
  type NewKaraokeIssue,
  type EnvelopeRecipientMode,
  type BulkDeletePayload,
} from '../lib/dispatchesClient';
import type { RouteKey } from '../data/routes';

// =============================================================================
// Types
// =============================================================================

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  processing: 'Đang theo dõi',
  sent: 'Đã gửi',
  closed: 'Hoàn tất',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'zinc',
  processing: 'blue',
  sent: 'amber',
  closed: 'green',
};

// =============================================================================
// Page Component
// =============================================================================

type TabId = 'renewal' | 'new_sign' | 'created' | 'tracking' | 'settings';

export function DispatchesPage({ onNavigate, embedded }: { onNavigate: (route: RouteKey) => void; embedded?: boolean; }) {
  const [activeTab, setActiveTab] = useState<TabId>('renewal');

  return (
    <Page embedded={embedded}>
      {!embedded && (
        <PageHeader
          title="Công văn"
          description="Tạo công văn nhắc tái ký và theo dõi phản hồi từ các đơn vị."
          breadcrumb="Nghiệp vụ"
        />
      )}

      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab(v as TabId)}
        tabs={[
          { value: 'renewal', label: 'Tái ký' },
          { value: 'new_sign', label: 'Ký mới' },
          { value: 'created', label: 'Đã tạo' },
          { value: 'tracking', label: 'Theo dõi' },
          { value: 'settings', label: 'Cài đặt' },
        ]}
      />

      {activeTab === 'renewal' && <RenewalContractsTab onNavigate={() => setActiveTab('created')} />}
      {activeTab === 'new_sign' && <NewSignPlaceholderTab onNavigate={(tab) => tab && setActiveTab(tab as TabId)} />}
      {activeTab === 'created' && <CreatedDispatchesTab onNavigate={onNavigate} />}
      {activeTab === 'tracking' && <TrackingPlaceholderTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </Page>
  );
}

// =============================================================================
// Tab 1: Tái ký — Expired contracts list + checkbox + dispatch number
// =============================================================================

const DISPATCH_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ gửi',
  draft: 'Nháp',
  generated: 'Đã tạo',
  downloaded: 'Đã tải',
  envelope_printed: 'Đã in bìa thư',
  sent: 'Đã gửi',
  responded: 'Đã phản hồi',
  renewed: 'Đã tái ký',
  skipped: 'Bỏ qua',
  canceled: 'Đã hủy',
};

function getDispatchStatusBadge(status: string) {
  const label = DISPATCH_STATUS_LABELS[status] || status;
  switch (status) {
    case 'renewed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-emerald-700 text-white shadow-sm shadow-emerald-900/20">{label}</span>;
    case 'responded': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-teal-700 text-white shadow-sm shadow-teal-900/20">{label}</span>;
    case 'sent': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-blue-700 text-white shadow-sm shadow-blue-900/20">{label}</span>;
    case 'generated': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-teal-600 text-white shadow-sm shadow-teal-900/20">{label}</span>;
    case 'draft': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-stone-600 text-stone-100 shadow-sm shadow-stone-900/20">{label}</span>;
    case 'skipped': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-amber-500 text-white shadow-sm shadow-amber-600/20">{label}</span>;
    case 'canceled': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-rose-700 text-white shadow-sm shadow-rose-900/20">{label}</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-stone-800 text-stone-100 shadow-sm shadow-stone-900/20">{label}</span>;
  }
}

function RenewalContractsTab({ onNavigate }: { onNavigate: () => void }) {
  const [contracts, setContracts] = useState<ExpiredContractItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<string>(''); // '' = all months
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' | 'sent' | 'not_sent'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dispatchNo, setDispatchNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [result, setResult] = useState<{
    merged?: string;
    envelope?: string;
    envelope_filename?: string;
    envelope_generated_at?: string;
    total?: number;
    batch_no?: string;
    ok: boolean;
    error?: string;
  } | null>(null);

  // Summary stats derived from the same data rows that are shown in the table.
  // This avoids contradictions: all cards reflect the same dataset.
  const stats = {
    total: contracts.length,
    sent: contracts.filter(c => c.cong_van_count > 0).length,
    notSent: contracts.filter(c => c.cong_van_count === 0).length,
    selected: selected.size,
  };

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getExpiredContracts({
        filter_mode: 'year',
        filter_year: yearFilter,
        filter_month: monthFilter ? Number(monthFilter) : undefined,
        page,
        page_size: pageSize,
      });
      setContracts(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 0);
      // Reset selection when page changes
      setSelected(new Set());
    } catch (e: any) {
      setError(e.message || 'Lỗi tải danh sách hết hạn');
    } finally {
      setLoading(false);
    }
  }, [yearFilter, monthFilter, page, pageSize]);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [yearFilter, monthFilter, statusFilter]);

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(c => c.contract_id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const filtered = contracts.filter(c => {
    // Status filter
    if (statusFilter === 'sent' && c.cong_van_count === 0) return false;
    if (statusFilter === 'not_sent' && c.cong_van_count > 0) return false;
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.so_hop_dong || '').toLowerCase().includes(q) ||
      (c.don_vi_ten || '').toLowerCase().includes(q) ||
      (c.recipient_address || '').toLowerCase().includes(q) ||
      (c.ten_bang_hieu || '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    if (selected.size === 0) {
      alert('Chọn ít nhất một đơn vị.');
      return;
    }
    if (!dispatchNo.trim()) {
      alert('Nhập số công văn trước khi tạo.');
      return;
    }
    setCreating(true);
    setCreateError('');
    setResult(null);
    try {
      const data = await createRenewalBatch({
        contract_ids: Array.from(selected),
        issue_date: issueDate,
        start_cong_van_no: dispatchNo.trim(),
        merge_output: true,
        create_envelope: true,
      });
      if (data.ok) {
        // Log envelope info for debugging
        if (data.envelope_download_url) {
          console.log('[DEBUG] Renewal Envelope exported:', {
            envelope_filename: data.envelope_filename || data.envelope_download_url?.split('/').pop(),
            envelope_download_url: data.envelope_download_url,
            envelope_generated_at: data.envelope_generated_at || new Date().toISOString(),
          });
        }
        setResult({
          ok: true,
          total: data.total_created,
          batch_no: data.batch_cong_van_no,
          merged: data.merged_download_url,
          envelope: data.envelope_download_url,
          envelope_filename: data.envelope_filename,
          envelope_generated_at: data.envelope_generated_at,
        });
        setSelected(new Set());
        // Auto-download merged file
        if (data.merged_download_url) {
          setTimeout(() => {
            downloadFile(data.merged_download_url).catch(() => {
              // Fallback: open in new tab
              window.open(getDownloadUrl(data.merged_download_url), '_blank');
            });
          }, 200);
        }
      } else {
        setResult({
          ok: false,
          error: data.error || 'Lỗi tạo công văn',
        });
      }
    } catch (e: any) {
      setCreateError(e.message || 'Lỗi tạo công văn');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-zinc-900">{stats.total}</div>
          <div className="text-xs text-zinc-500 mt-1">Tổng nguồn tái ký</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.notSent}</div>
          <div className="text-xs text-zinc-500 mt-1">Chưa gửi công văn</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.sent}</div>
          <div className="text-xs text-zinc-500 mt-1">Đã gửi công văn</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.selected}</div>
          <div className="text-xs text-zinc-500 mt-1">Đã chọn</div>
        </div>
      </div>

      {/* Toolbar */}
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm số HĐ, tên đơn vị, địa chỉ, bảng hiệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<SearchIcon size={15} />}
            onClear={() => setSearch('')}
          />
        </div>
        <Select
          value={String(yearFilter)}
          onChange={v => setYearFilter(Number(v))}
          options={[
            { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
            { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
            { value: String(new Date().getFullYear() - 2), label: String(new Date().getFullYear() - 2) },
          ]}
        />
        <Select
          value={monthFilter}
          onChange={v => setMonthFilter(v)}
          options={[
            { value: '', label: 'Tất cả tháng' },
            { value: '1', label: 'Tháng 1' },
            { value: '2', label: 'Tháng 2' },
            { value: '3', label: 'Tháng 3' },
            { value: '4', label: 'Tháng 4' },
            { value: '5', label: 'Tháng 5' },
            { value: '6', label: 'Tháng 6' },
            { value: '7', label: 'Tháng 7' },
            { value: '8', label: 'Tháng 8' },
            { value: '9', label: 'Tháng 9' },
            { value: '10', label: 'Tháng 10' },
            { value: '11', label: 'Tháng 11' },
            { value: '12', label: 'Tháng 12' },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={v => setStatusFilter(v)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'not_sent', label: 'Chưa gửi' },
            { value: 'sent', label: 'Đã gửi' },
          ]}
        />
        {(monthFilter || statusFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMonthFilter(''); setStatusFilter('all'); setSearch(''); }}
          >
            Đặt lại
          </Button>
        )}
        <Button variant="ghost" onClick={loadContracts} leftIcon={<RefreshCwIcon size={14} />}>
          Làm mới
        </Button>
      </div>

      {/* Result Banner */}
      {result && (
        <ContentCard className={result.ok ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}>
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                <CheckCircle2Icon size={18} />
                Đã tạo {result.total} công văn — Số: {result.batch_no}
              </div>
              <div className="flex gap-2 flex-wrap">
                {result.merged && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadFile(result.merged!).catch(() => window.open(getDownloadUrl(result.merged!), '_blank'))}
                    leftIcon={<FileTextIcon size={13} />}
                  >
                    Tải công văn gộp
                  </Button>
                )}
                {result.envelope && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadFile(result.envelope!).catch(() => window.open(getDownloadUrl(result.envelope!), '_blank'))}
                    leftIcon={<MailIcon size={13} />}
                  >
                    Tải bìa thư
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setResult(null); onNavigate(); }}
                  leftIcon={<FileTextIcon size={13} />}
                >
                  Xem trong Đã tạo
                </Button>
              </div>
              {result.envelope_filename && (
                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 text-xs">
                  <span className="text-blue-600 font-medium">Bìa thư: </span>
                  <span className="font-mono text-blue-800">{result.envelope_filename}</span>
                  {result.envelope_generated_at && (
                    <span className="text-blue-500 ml-2">({new Date(result.envelope_generated_at).toLocaleString('vi-VN')})</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircleIcon size={16} />
              <span>{result.error || 'Lỗi tạo công văn'}</span>
            </div>
          )}
        </ContentCard>
      )}

      {/* Table */}
      <ContentCard padded={false} className="ds-page-table-shell">
        {/* Header row with selection info */}
        <div className="ds-page-table-toolbar">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleAll}
              className="rounded border-zinc-300"
            />
            <span className="font-medium">Chọn tất cả ({filtered.length})</span>
          </label>
          <span className="text-sm text-zinc-400">|</span>
          <span className="text-sm text-zinc-600">{selected.size} đã chọn</span>
          <span className="ds-page-table-toolbar-summary ml-auto">
            Hiển thị <strong>{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}</strong> / <strong>{total}</strong>
          </span>
        </div>

        {/* Table content */}
        {loading ? (
          <TableSkeleton columns={9} rows={8} />
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-red-600">
            <AlertCircleIcon size={16} />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={loadContracts}>Thử lại</Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileIcon size={32} />}
            title={statusFilter !== 'all' ? 'Không có kết quả' : 'Không có hợp đồng hết hạn'}
            description={
              statusFilter === 'sent' ? 'Không có đơn vị nào đã gửi công văn trong danh sách này.' :
              statusFilter === 'not_sent' ? 'Tất cả đơn vị trong danh sách này đều đã được gửi công văn.' :
              search ? `Không tìm thấy kết quả cho "${search}".` :
              `Không có hợp đồng hết hạn trong năm ${yearFilter}${monthFilter ? ` tháng ${monthFilter}` : ''}.`
            }
          />
        ) : (
          <div className="ds-page-table-scroll">
            <table className="ds-page-table">
              <thead className="ds-page-table-header">
                <tr className="ds-page-table-head-row">
                  <th className="ds-page-table-head-cell text-left w-8"></th>
                  <th className="ds-page-table-head-cell text-left">Số HĐ</th>
                  <th className="ds-page-table-head-cell text-left">Đơn vị</th>
                  <th className="ds-page-table-head-cell text-left">Bảng hiệu</th>
                  <th className="ds-page-table-head-cell text-left">Địa chỉ</th>
                  <th className="ds-page-table-head-cell text-left">Ngày ký</th>
                  <th className="ds-page-table-head-cell text-left">Ngày hết hạn</th>
                  <th className="ds-page-table-head-cell text-left">Còn/Hết hạn</th>
                  <th className="ds-page-table-head-cell text-center">Lần gửi</th>
                  <th className="ds-page-table-head-cell text-left">Số CV gần nhất</th>
                  <th className="ds-page-table-head-cell text-left">Ngày CV</th>
                  <th className="ds-page-table-head-cell text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="ds-page-table-body ds-page-table-density-comfortable">
                  {filtered.map(c => {
                    const isExpired = c.days_expired > 0;
                    const isSelected = selected.has(c.contract_id);
                    return (
                  <tr key={c.contract_id} className={`ds-page-table-row ${isSelected ? 'ds-page-table-row-selected' : ''}`}>
                    <td className="ds-page-table-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c.contract_id)}
                        className="rounded border-zinc-300"
                      />
                    </td>
                    <td className="ds-page-table-cell font-mono text-xs font-medium text-zinc-800 whitespace-nowrap">
                      {c.contract_no || '-'}
                    </td>
                    <td className="ds-page-table-cell ds-page-table-cell-strong max-w-[160px]">
                      <span className="ds-page-table-truncate block" title={c.don_vi_ten || ''}>
                        {c.don_vi_ten || '-'}
                      </span>
                    </td>
                    <td className="ds-page-table-cell ds-page-table-cell-muted text-xs max-w-[120px]">
                      <span className="ds-page-table-truncate block" title={c.ten_bang_hieu || ''}>
                        {c.ten_bang_hieu || '-'}
                      </span>
                    </td>
                    <td className="ds-page-table-cell ds-page-table-cell-subtle text-xs max-w-[180px]">
                      <span className="ds-page-table-clamp-2" title={c.recipient_address || ''}>
                        {c.recipient_address || '-'}
                      </span>
                    </td>
                    <td className="ds-page-table-cell ds-page-table-cell-subtle text-xs whitespace-nowrap">
                      {c.ngay_ky_hop_dong || '-'}
                    </td>
                    <td className="ds-page-table-cell ds-page-table-cell-subtle text-xs whitespace-nowrap">
                      {c.ngay_het_hieu_luc_hd || '-'}
                    </td>
                    <td className="ds-page-table-cell whitespace-nowrap">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Đã hết {c.days_expired} ngày
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Còn {c.days_expired} ngày
                        </span>
                      )}
                    </td>
                    <td className="ds-page-table-cell text-center">
                      {c.cong_van_count > 0 ? (
                        <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-medium ${
                          c.cong_van_count >= 3 ? 'bg-red-100 text-red-700' :
                          c.cong_van_count >= 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {c.cong_van_count}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="ds-page-table-cell font-mono text-xs text-zinc-700 whitespace-nowrap">
                      {c.latest_dispatch_no || '-'}
                    </td>
                    <td className="ds-page-table-cell text-xs text-zinc-500 whitespace-nowrap">
                      {c.latest_dispatch_date || '-'}
                    </td>
                    <td className="ds-page-table-cell text-center">
                      {c.latest_dispatch_status ? (
                        getDispatchStatusBadge(c.latest_dispatch_status)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-stone-100 text-stone-600">
                          Chưa gửi
                        </span>
                      )}
                    </td>
                  </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="ds-page-table-footer">
          <div className="text-sm text-zinc-500">
            Đang xem {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} / Tổng {total}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onChange={v => { setPageSize(Number(v)); setPage(1); }}
              options={[
                { value: "30", label: "30 dòng" },
                { value: "50", label: "50 dòng" },
                { value: "100", label: "100 dòng" },
              ]}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ‹ Trước
            </Button>
            <span className="text-sm text-zinc-600">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Sau ›
            </Button>
          </div>
        </div>
      )}

      {/* Empty selection hint */}
      {selected.size === 0 && !loading && filtered.length > 0 && (
        <div className="text-center text-sm text-zinc-400 py-2">
          Chọn đơn vị để tạo công văn nhắc tái ký.
        </div>
      )}

      {/* Action Panel — only show when something selected */}
      {selected.size > 0 && (
        <ContentCard className="border-blue-200 bg-blue-50/30">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2 text-sm text-zinc-600 py-2">
              <CheckCircle2Icon size={16} className="text-blue-600" />
              <span>Đã chọn <strong className="text-zinc-900">{selected.size}</strong> đơn vị</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end mt-4 pt-4 border-t border-zinc-200">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Số công văn <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Ví dụ: CV-123/2026"
                value={dispatchNo}
                onChange={e => setDispatchNo(e.target.value)}
                style={{ minWidth: 200 }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày ban hành</label>
              <Input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Button
                onClick={handleCreate}
                disabled={creating || !dispatchNo.trim() || selected.size === 0}
                leftIcon={creating ? <Loader2Icon size={14} className="animate-spin" /> : <FileTextIcon size={14} />}
              >
                Gộp công văn ({selected.size})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Bỏ chọn
              </Button>
              {createError && (
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircleIcon size={14} />
                  {createError}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            Số công văn do bạn nhập. Cùng số công văn áp dụng cho tất cả {selected.size} đơn vị đã chọn.
          </p>
        </ContentCard>
      )}
    </div>
  );
}

// =============================================================================
// Tab 2: Lịch sử — Batch-level dispatch history
// =============================================================================

const DISPATCH_TYPE_LABELS: Record<string, string> = {
  renewal_reminder: 'Nhắc tái ký',
  overdue_reminder: 'Nhắc quá hạn',
  pending_reminder: 'Nhắc chưa hoàn tất',
};

function CreatedDispatchesTab({ onNavigate }: { onNavigate: (route: RouteKey) => void }) {
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [dispatchTypeFilter, setDispatchTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- Edit / Delete modal states ---
  const [editBatchModal, setEditBatchModal] = useState<BatchListItem | null>(null);
  const [deleteBatchModal, setDeleteBatchModal] = useState<BatchListItem | null>(null);
  const [editItemModal, setEditItemModal] = useState<BatchItem | null>(null);
  const [deleteItemModal, setDeleteItemModal] = useState<{ item: BatchItem; batchId: number } | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Bulk selection state ---
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<number>>(new Set());
  const [allFilteredMode, setAllFilteredMode] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBatches({ year: yearFilter, dispatch_type: dispatchTypeFilter || undefined, page, page_size: pageSize });
      setBatches(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 0);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải danh sách đợt công văn');
    } finally {
      setLoading(false);
    }
  }, [yearFilter, dispatchTypeFilter, page, pageSize]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  useEffect(() => { setPage(1); }, [yearFilter, dispatchTypeFilter]);

  useEffect(() => {
    // Clear selection when filters/search/page change
    setSelectedBatchIds(new Set());
    setAllFilteredMode(false);
  }, [yearFilter, dispatchTypeFilter, search, page]);

  const handleExpandBatch = async (batchId: number) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      setBatchDetail(null);
      return;
    }
    setLoadingDetail(true);
    setExpandedBatch(batchId);
    try {
      const detail = await getBatchDetail(batchId);
      setBatchDetail(detail);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải chi tiết đợt công văn');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownload = (url: string) => {
    if (!url) return;
    downloadFile(url).catch(() => window.open(getDownloadUrl(url), '_blank'));
  };

  const handleUpdateTracking = async (itemId: number, params: Record<string, unknown>) => {
    try {
      await updateItemTracking(itemId, params as any);
      if (expandedBatch) {
        const detail = await getBatchDetail(expandedBatch);
        setBatchDetail(detail);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi cập nhật theo dõi');
    }
  };

  const handleEditBatch = async (params: Record<string, unknown>) => {
    if (!editBatchModal) return;
    setSaving(true);
    try {
      const res = await updateBatch(editBatchModal.id, params as any);
      if (!res.ok) { alert(res.error || 'Lỗi lưu thay đổi'); return; }
      if (res.warning) alert(res.warning);
      setEditBatchModal(null);
      await loadBatches();
      if (expandedBatch === editBatchModal.id) {
        const detail = await getBatchDetail(editBatchModal.id);
        setBatchDetail(detail);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (reason: string) => {
    if (!deleteBatchModal) return;
    setSaving(true);
    try {
      const res = await deleteBatch(deleteBatchModal.id, reason);
      if (!res.ok) { alert(res.error || 'Lỗi xóa đợt công văn'); return; }
      alert(res.message);
      setDeleteBatchModal(null);
      if (expandedBatch === deleteBatchModal.id) {
        setExpandedBatch(null);
        setBatchDetail(null);
      }
      await loadBatches();
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa đợt công văn');
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async (itemId: number, params: Record<string, unknown>) => {
    if (!editItemModal) return;
    setSaving(true);
    try {
      const res = await updateItem(itemId, params as any);
      if (!res.ok) { alert(res.error || 'Lỗi lưu thay đổi'); return; }
      if (res.warning) alert(res.warning);
      setEditItemModal(null);
      if (expandedBatch) {
        const detail = await getBatchDetail(expandedBatch);
        setBatchDetail(detail);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (reason: string) => {
    if (!deleteItemModal) return;
    setSaving(true);
    try {
      const res = await deleteItem(deleteItemModal.item.id, reason);
      if (!res.ok) { alert(res.error || 'Lỗi xóa dòng theo dõi'); return; }
      alert(res.message);
      setDeleteItemModal(null);
      if (deleteItemModal.batchId && expandedBatch === deleteItemModal.batchId) {
        const detail = await getBatchDetail(deleteItemModal.batchId);
        setBatchDetail(detail);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa dòng theo dõi');
    } finally {
      setSaving(false);
    }
  };

  // --- Bulk delete handlers ---
  const handleBulkDeleteBatches = async (reason: string) => {
    if (selectedBatchIds.size === 0 && !allFilteredMode) {
      alert('Chưa chọn đợt công văn nào');
      return;
    }
    setSaving(true);
    try {
      let res;
      if (allFilteredMode) {
        res = await bulkDeleteBatches({
          scope: "all_filtered",
          filters: {
            year: yearFilter,
            dispatch_type: dispatchTypeFilter || undefined,
            include_deleted: false,
          },
          confirm_text: "XOA TOAN BO",
          delete_reason: reason,
        });
      } else {
        res = await bulkDeleteBatches({
          ids: Array.from(selectedBatchIds),
          delete_reason: reason,
        });
      }
      if (!res.ok) {
        alert(res.error || 'Lỗi xóa hàng loạt'); return;
      }
      alert(res.message);
      setBulkDeleteModal(false);
      setSelectedBatchIds(new Set());
      setAllFilteredMode(false);
      // Collapse expanded batch if it was deleted
      if (expandedBatch) {
        const wasExpanded = allFilteredMode
          ? (res.deleted_ids || []).includes(expandedBatch)
          : selectedBatchIds.has(expandedBatch);
        if (wasExpanded) {
          setExpandedBatch(null);
          setBatchDetail(null);
        }
      }
      await loadBatches();
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa hàng loạt');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllFiltered = () => {
    if (total === 0) return;
    setAllFilteredMode(true);
    setSelectedBatchIds(new Set());
  };

  const filtered = batches.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.cong_van_no || '').toLowerCase().includes(q) ||
      (b.note || '').toLowerCase().includes(q) ||
      (b.created_by || '').toLowerCase().includes(q)
    );
  });

  const dispatchTypeOptions = [
    { value: '', label: 'Tất cả loại công văn' },
    { value: 'new_karaoke', label: 'Ký mới Karaoke' },
    { value: 'renewal_reminder', label: 'Nhắc tái ký' },
    { value: 'overdue_reminder', label: 'Nhắc quá hạn' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Tìm số công văn, ghi chú, người tạo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<SearchIcon size={15} />}
            onClear={() => setSearch('')}
          />
        </div>
        <Select
          value={String(yearFilter)}
          onChange={v => setYearFilter(Number(v))}
          options={[
            { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
            { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
            { value: String(new Date().getFullYear() - 2), label: String(new Date().getFullYear() - 2) },
          ]}
        />
        <Select
          value={dispatchTypeFilter}
          onChange={v => setDispatchTypeFilter(v)}
          options={dispatchTypeOptions}
        />
        <Button variant="ghost" onClick={loadBatches} leftIcon={<RefreshCwIcon size={14} />}>
          Làm mới
        </Button>
      </div>

      {/* Bulk action bar */}
      {(selectedBatchIds.size > 0 || allFilteredMode) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
          <span className="text-sm font-semibold text-amber-900">
            {allFilteredMode
              ? `Đã chọn tất cả ${total} đợt theo bộ lọc hiện tại`
              : `Đã chọn ${selectedBatchIds.size} đợt công văn`}
          </span>
          {selectedBatchIds.size > 0 && selectedBatchIds.size < filtered.length && !allFilteredMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allVisible = new Set(filtered.map(b => b.id));
                setSelectedBatchIds(allVisible);
              }}
            >
              Chọn tất cả {filtered.length} đợt trên trang này
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2Icon size={13} />}
            onClick={() => setBulkDeleteModal(true)}
          >
            {allFilteredMode ? 'Xóa toàn bộ theo bộ lọc' : 'Xóa đợt đã chọn'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedBatchIds(new Set()); setAllFilteredMode(false); }}>
            Bỏ chọn
          </Button>
          {!allFilteredMode && selectedBatchIds.size < total && (
            <span className="text-xs text-amber-700 ml-auto">
              Chỉ đang chọn {selectedBatchIds.size} đợt trên trang này.{' '}
              <button
                type="button"
                className="underline hover:no-underline font-medium"
                onClick={handleSelectAllFiltered}
              >
                Chọn tất cả {total} đợt theo bộ lọc hiện tại
              </button>
            </span>
          )}
        </div>
      )}

      <ContentCard padded={false}>
        {loading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-red-600">
            <AlertCircleIcon size={16} /><span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MailIcon size={32} />}
            title="Chưa có đợt công văn nào"
            description="Tạo công văn từ tab Nguồn cần xử lý."
          />
        ) : (
          <div className="divide-y divide-zinc-100">
            {filtered.map(batch => (
              <div key={batch.id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  onClick={() => handleExpandBatch(batch.id)}
                >
                  <Checkbox
                    checked={selectedBatchIds.has(batch.id)}
                    onChange={(v) => {
                      const next = new Set(selectedBatchIds);
                      v ? next.add(batch.id) : next.delete(batch.id);
                      setSelectedBatchIds(next);
                    }}
                  />
                  <span className={`shrink-0 text-zinc-400 transform transition-transform ${expandedBatch === batch.id ? 'rotate-90' : ''}`}>
                    <ChevronRightIcon size={14} />
                  </span>
                  <div className="flex-1 grid grid-cols-7 gap-4 items-center text-sm">
                    <div className="col-span-2">
                      <div className="font-semibold text-zinc-900">{batch.cong_van_no}</div>
                      <div className="text-xs text-zinc-400">
                        {dispatchTypeOptions.find(o => o.value === batch.dispatch_type)?.label || batch.dispatch_type}
                      </div>
                    </div>
                    <div className="text-zinc-600 text-xs">{batch.issue_date}</div>
                    <div className="text-zinc-600 text-xs">
                      <span className="font-medium">{batch.total_items}</span> đơn vị
                      {batch.missing_items > 0 && <span className="text-amber-500 ml-1">({batch.missing_items} thiếu)</span>}
                    </div>
                    <div className="text-zinc-400 text-xs flex items-center gap-1">
                      {batch.create_envelope ? (
                        <span className="inline-flex items-center gap-1 text-blue-600" title="Có bìa thư">
                          <MailIcon size={11} /> Bìa thư
                        </span>
                      ) : (
                        <span className="text-zinc-300" title="Không có bìa thư">—</span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-xs truncate" title={batch.note}>{batch.note || '—'}</div>
                    <div className="text-zinc-400 text-xs">{batch.created_by}</div>
                    <div className="flex items-center gap-1 justify-end">
                      {batch.merged_download_url && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(batch.merged_download_url); }}
                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Tải công văn gộp"
                        >
                          <FileTextIcon size={13} />
                        </button>
                      )}
                      {batch.envelope_download_url && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(batch.envelope_download_url); }}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Tải bìa thư"
                        >
                          <MailIcon size={13} />
                        </button>
                      )}
                      <RowActionsMenu actions={[
                        {
                          label: 'Chỉnh sửa thông tin',
                          icon: <Edit2Icon size={14} />,
                          onClick: () => setEditBatchModal(batch),
                        },
                        {
                          label: 'Theo dõi đơn vị',
                          icon: <SearchIcon size={14} />,
                          onClick: () => onNavigate('tracking'),
                        },
                        { divider: true, label: '' },
                        {
                          label: 'Xóa đợt công văn',
                          icon: <Trash2Icon size={14} />,
                          tone: 'danger',
                          onClick: () => setDeleteBatchModal(batch),
                        },
                      ]} />
                    </div>
                  </div>
                </div>

                {expandedBatch === batch.id && (
                  <div className="px-6 pb-4 bg-zinc-50/30">
                    {loadingDetail ? (
                      <div className="flex items-center gap-2 py-4 text-zinc-400 text-sm">
                        <Loader2Icon size={14} className="animate-spin" /> Đang tải chi tiết...
                      </div>
                    ) : batchDetail ? (
                      <div className="pt-3">
                        <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500">
                          <span>Ngày tạo: <strong>{batchDetail.created_at ? new Date(batchDetail.created_at).toLocaleString('vi-VN') : '—'}</strong></span>
                          <span>Template: <strong>{batchDetail.template_name || '—'}</strong></span>
                          <span>Có bìa thư: <strong>{batchDetail.create_envelope ? 'Có' : 'Không'}</strong></span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs bg-white rounded border border-zinc-100">
                            <thead>
                              <tr className="border-b border-zinc-100 bg-zinc-50">
                                <th className="text-left px-2 py-2 font-medium text-zinc-500">Đơn vị</th>
                                <th className="text-left px-2 py-2 font-medium text-zinc-500">Địa chỉ</th>
                                <th className="text-center px-2 py-2 font-medium text-zinc-500">Lần gửi</th>
                                <th className="text-left px-2 py-2 font-medium text-zinc-500">Liên hệ</th>
                                <th className="text-left px-2 py-2 font-medium text-zinc-500">Hợp đồng</th>
                                <th className="text-right px-2 py-2 font-medium text-zinc-500">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                              {batchDetail.items.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50/50">
                                  <td className="px-2 py-2 font-medium text-zinc-800 max-w-[180px] truncate" title={item.recipient_unit}>{item.recipient_unit || '-'}</td>
                                  <td className="px-2 py-2 text-zinc-500 max-w-[200px] truncate" title={item.recipient_address}>{item.recipient_address || '-'}</td>
                                  <td className="px-2 py-2 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-medium ${
                                      (item.lan_gui || 1) >= 3 ? 'bg-red-100 text-red-700' :
                                      (item.lan_gui || 1) >= 2 ? 'bg-amber-100 text-amber-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {item.lan_gui || 1}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={item.trang_thai_lien_he || 'DA_GUI_CONG_VAN'}
                                      onChange={e => handleUpdateTracking(item.id, { trang_thai_lien_he: e.target.value })}
                                      className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white max-w-[160px]"
                                    >
                                      <option value="CHUA_LIEN_HE">Chưa liên hệ</option>
                                      <option value="DA_LIEN_HE">Đã liên hệ</option>
                                      <option value="DA_GUI_CONG_VAN">Đã gửi công văn</option>
                                      <option value="DA_PHAN_HOI">Đã phản hồi</option>
                                      <option value="DANG_THUONG_LUONG">Đang thương lượng</option>
                                      <option value="NGUNG_HOAT_DONG">Ngưng hoạt động</option>
                                      <option value="KHONG_HOP_TAC">Không hợp tác</option>
                                      <option value="SAI_THONG_TIN">Sai thông tin</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={item.trang_thai_hop_dong || 'CHUA_KY_HOP_DONG'}
                                      onChange={e => handleUpdateTracking(item.id, { trang_thai_hop_dong: e.target.value })}
                                      className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white max-w-[160px]"
                                    >
                                      <option value="CHUA_KY_HOP_DONG">Chưa ký hợp đồng</option>
                                      <option value="DANG_XU_LY_HOP_DONG">Đang xử lý</option>
                                      <option value="DA_KY_HOP_DONG">Đã ký hợp đồng</option>
                                      <option value="TU_CHOI_KY">Từ chối ký</option>
                                      <option value="KHONG_DU_DIEU_KIEN">Không đủ điều kiện</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {item.download_url && (
                                        <button
                                          onClick={() => handleDownload(item.download_url)}
                                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                                          title="Tải công văn"
                                        >
                                          <FileTextIcon size={13} />
                                        </button>
                                      )}
                                      <RowActionsMenu actions={[
                                        {
                                          label: 'Sửa',
                                          icon: <Edit2Icon size={14} />,
                                          onClick: () => setEditItemModal(item),
                                        },
                                        {
                                          label: 'Đánh dấu đã liên hệ',
                                          icon: <CheckCircle2Icon size={14} />,
                                          onClick: () => handleUpdateTracking(item.id, { trang_thai_lien_he: 'DA_LIEN_HE' }),
                                        },
                                        {
                                          label: 'Đánh dấu ngưng hoạt động',
                                          icon: <AlertCircleIcon size={14} />,
                                          onClick: () => handleUpdateTracking(item.id, { trang_thai_lien_he: 'NGUNG_HOAT_DONG' }),
                                        },
                                        {
                                          label: 'Đánh dấu đã ký hợp đồng',
                                          icon: <CheckCircle2Icon size={14} />,
                                          onClick: () => handleUpdateTracking(item.id, { trang_thai_hop_dong: 'DA_KY_HOP_DONG' }),
                                        },
                                        { divider: true, label: '' },
                                        {
                                          label: 'Xóa dòng theo dõi',
                                          icon: <Trash2Icon size={14} />,
                                          tone: 'danger',
                                          onClick: () => setDeleteItemModal({ item, batchId: batch.id }),
                                        },
                                      ]} />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-zinc-500">
            Đang xem {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} / Tổng {total} đợt
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onChange={v => { setPageSize(Number(v)); setPage(1); }}
              options={[
                { value: "10", label: "10 dòng" },
                { value: "20", label: "20 dòng" },
                { value: "50", label: "50 dòng" },
              ]}
            />
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹ Trước</Button>
            <span className="text-sm text-zinc-600">Trang {page} / {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau ›</Button>
          </div>
        </div>
      )}

      {/* ===== Edit Batch Modal ===== */}
      <EditBatchModal
        batch={editBatchModal}
        onClose={() => setEditBatchModal(null)}
        onSave={handleEditBatch}
        saving={saving}
      />

      {/* ===== Delete Batch Modal ===== */}
      <DeleteBatchModal
        batch={deleteBatchModal}
        onClose={() => setDeleteBatchModal(null)}
        onConfirm={handleDeleteBatch}
        saving={saving}
      />

      {/* ===== Edit Item Modal ===== */}
      <EditItemModal
        item={editItemModal}
        onClose={() => setEditItemModal(null)}
        onSave={handleEditItem}
        saving={saving}
      />

      {/* ===== Bulk Delete Batch Modal ===== */}
      {bulkDeleteModal && (
      <BulkDeleteBatchModal
        selectedCount={selectedBatchIds.size}
        totalFiltered={total}
        allFilteredMode={allFilteredMode}
        yearFilter={yearFilter}
        dispatchTypeFilter={dispatchTypeFilter}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteBatches}
        saving={saving}
      />
      )}

      {/* ===== Delete Item Modal ===== */}
      <DeleteItemModal
        data={deleteItemModal}
        onClose={() => setDeleteItemModal(null)}
        onConfirm={handleDeleteItem}
        saving={saving}
      />
    </div>
  );
}

// =============================================================================
// Batch & Item Edit / Delete Modals (used by CreatedDispatchesTab)
// =============================================================================

function EditBatchModal({
  batch,
  onClose,
  onSave,
  saving,
}: {
  batch: BatchListItem | null;
  onClose: () => void;
  onSave: (params: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [congVanNo, setCongVanNo] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [note, setNote] = useState('');
  const [envelopeMode, setEnvelopeMode] = useState('');
  const [envelopePrefix, setEnvelopePrefix] = useState('');

  useEffect(() => {
    if (batch) {
      setCongVanNo(batch.cong_van_no || '');
      setIssueDate(batch.issue_date || '');
      setNote(batch.note || '');
      setEnvelopeMode('');
      setEnvelopePrefix('');
    }
  }, [batch]);

  if (!batch) return null;

  const handleSave = () => {
    onSave({
      cong_van_no: congVanNo,
      issue_date: issueDate,
      note,
      envelope_recipient_mode: envelopeMode || undefined,
      envelope_custom_prefix: envelopePrefix || undefined,
    });
  };

  const envelopeModeOptions = [
    { value: '', label: 'Giữ nguyên' },
    { value: 'keep', label: 'Giữ nguyên tên đơn vị' },
    { value: 'co_so', label: 'Cơ sở kinh doanh' },
    { value: 'chu_co_so', label: 'Chủ cơ sở kinh doanh' },
    { value: 'cong_ty', label: 'Công ty' },
    { value: 'ho_kinh_doanh', label: 'Hộ kinh doanh' },
    { value: 'custom', label: 'Tùy chỉnh tiền tố' },
  ];

  return (
    <Modal
      open={!!batch}
      onClose={onClose}
      title="Chỉnh sửa thông tin đợt công văn"
      description="Thay đổi thông tin theo dõi. File đã tạo trước đó sẽ không bị ảnh hưởng."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} loading={saving}>Lưu thay đổi</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Số công văn</label>
          <Input
            value={congVanNo}
            onChange={e => setCongVanNo(e.target.value)}
            placeholder="VD: 81227476/2026"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày ký công văn</label>
          <Input
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Ghi chú</label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Ghi chú..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Cách ghi người nhận bìa thư</label>
          <Select
            value={envelopeMode}
            onChange={v => setEnvelopeMode(v)}
            options={envelopeModeOptions}
          />
        </div>
        {envelopeMode === 'custom' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tiền tố người nhận</label>
            <Input
              value={envelopePrefix}
              onChange={e => setEnvelopePrefix(e.target.value)}
              placeholder="VD: BQL"
            />
          </div>
        )}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Chỉnh sửa chỉ cập nhật dữ liệu theo dõi. File công văn/bìa thư đã tạo trước đó sẽ không tự thay đổi. Nếu cần file mới, hãy dùng chức năng tạo lại file.
        </div>
      </div>
    </Modal>
  );
}

function DeleteBatchModal({
  batch,
  onClose,
  onConfirm,
  saving,
}: {
  batch: BatchListItem | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (batch) { setReason(''); setConfirmText(''); }
  }, [batch]);

  if (!batch) return null;

  const canDelete = confirmText === batch.cong_van_no;

  return (
    <Modal
      open={!!batch}
      onClose={onClose}
      title="Xóa đợt công văn?"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason)}
            disabled={!canDelete || saving}
            loading={saving}
          >
            Xóa đợt công văn
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1 text-sm">
          <div><span className="text-zinc-500">Số công văn:</span> <strong>{batch.cong_van_no}</strong></div>
          <div><span className="text-zinc-500">Ngày ký:</span> <strong>{batch.issue_date || '—'}</strong></div>
          <div><span className="text-zinc-500">Tổng đơn vị:</span> <strong>{batch.total_items}</strong></div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Đây là xóa mềm — bản ghi và file sẽ được giữ lại. Bạn có thể khôi phục sau.
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Xác nhận xóa (gõ chính xác số công văn):</label>
          <Input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder={batch.cong_van_no}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lý do xóa (tùy chọn)</label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="VD: Trùng lặp, nhầm lẫn..."
          />
        </div>
      </div>
    </Modal>
  );
}

function EditItemModal({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: BatchItem | null;
  onClose: () => void;
  onSave: (itemId: number, params: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [recipientUnit, setRecipientUnit] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [trangThaiLienHe, setTrangThaiLienHe] = useState('');
  const [ngayLienHe, setNgayLienHe] = useState('');
  const [ghiChuLienHe, setGhiChuLienHe] = useState('');
  const [trangThaiHopDong, setTrangThaiHopDong] = useState('');
  const [soHopDong, setSoHopDong] = useState('');
  const [ngayKyHopDong, setNgayKyHopDong] = useState('');

  useEffect(() => {
    if (item) {
      setRecipientUnit(item.recipient_unit || '');
      setRecipientAddress(item.recipient_address || '');
      setRecipientPhone(item.recipient_phone || '');
      setRecipientContact(item.dong_nguoi_nhan_bia_thu || '');
      setTrangThaiLienHe(item.trang_thai_lien_he || 'DA_GUI_CONG_VAN');
      setNgayLienHe(item.ngay_lien_he_gan_nhat ? String(item.ngay_lien_he_gan_nhat).substring(0, 10) : '');
      setGhiChuLienHe(item.ghi_chu_lien_he || '');
      setTrangThaiHopDong(item.trang_thai_hop_dong || 'CHUA_KY_HOP_DONG');
      setSoHopDong(item.contract_no || '');
      setNgayKyHopDong(item.ngay_ky_hop_dong ? String(item.ngay_ky_hop_dong).substring(0, 10) : '');
    }
  }, [item]);

  if (!item) return null;

  const contactOptions = [
    { value: 'CHUA_LIEN_HE', label: 'Chưa liên hệ' },
    { value: 'DA_LIEN_HE', label: 'Đã liên hệ' },
    { value: 'DA_GUI_CONG_VAN', label: 'Đã gửi công văn' },
    { value: 'DA_PHAN_HOI', label: 'Đã phản hồi' },
    { value: 'DANG_THUONG_LUONG', label: 'Đang thương lượng' },
    { value: 'NGUNG_HOAT_DONG', label: 'Ngưng hoạt động' },
    { value: 'KHONG_HOP_TAC', label: 'Không hợp tác' },
    { value: 'SAI_THONG_TIN', label: 'Sai thông tin' },
  ];

  const contractOptions = [
    { value: 'CHUA_KY_HOP_DONG', label: 'Chưa ký hợp đồng' },
    { value: 'DANG_XU_LY_HOP_DONG', label: 'Đang xử lý' },
    { value: 'DA_KY_HOP_DONG', label: 'Đã ký hợp đồng' },
    { value: 'TU_CHOI_KY', label: 'Từ chối ký' },
    { value: 'KHONG_DU_DIEU_KIEN', label: 'Không đủ điều kiện' },
  ];

  const handleSave = () => {
    onSave(item.id, {
      recipient_unit: recipientUnit,
      recipient_address: recipientAddress,
      recipient_phone: recipientPhone,
      recipient_contact: recipientContact,
      trang_thai_lien_he: trangThaiLienHe,
      ngay_lien_he_gan_nhat: ngayLienHe || undefined,
      ghi_chu_lien_he: ghiChuLienHe,
      trang_thai_hop_dong: trangThaiHopDong,
      contract_no: soHopDong,
      ngay_ky_hop_dong: ngayKyHopDong || undefined,
    });
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Chỉnh sửa dòng theo dõi"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} loading={saving}>Lưu thay đổi</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tên đơn vị</label>
            <Input value={recipientUnit} onChange={e => setRecipientUnit(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-zinc-500 mb-1">Địa chỉ</label>
            <Input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Số điện thoại</label>
            <Input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Người nhận bìa thư</label>
            <Input value={recipientContact} onChange={e => setRecipientContact(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái liên hệ</label>
            <Select value={trangThaiLienHe} onChange={v => setTrangThaiLienHe(v)} options={contactOptions} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày liên hệ gần nhất</label>
            <Input type="date" value={ngayLienHe} onChange={e => setNgayLienHe(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái hợp đồng</label>
            <Select value={trangThaiHopDong} onChange={v => setTrangThaiHopDong(v)} options={contractOptions} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Số hợp đồng</label>
            <Input value={soHopDong} onChange={e => setSoHopDong(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày ký hợp đồng</label>
            <Input type="date" value={ngayKyHopDong} onChange={e => setNgayKyHopDong(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Ghi chú liên hệ</label>
          <Textarea value={ghiChuLienHe} onChange={e => setGhiChuLienHe(e.target.value)} rows={2} />
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Chỉnh sửa chỉ cập nhật dữ liệu theo dõi. File công văn/bìa thư đã tạo trước đó sẽ không tự thay đổi.
        </div>
      </div>
    </Modal>
  );
}

function DeleteItemModal({
  data,
  onClose,
  onConfirm,
  saving,
}: {
  data: { item: BatchItem; batchId: number } | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (data) setReason('');
  }, [data]);

  if (!data) return null;
  const { item } = data;

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title="Xóa dòng theo dõi?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} loading={saving}>Xóa dòng</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1 text-sm">
          <div><span className="text-zinc-500">Tên đơn vị:</span> <strong>{item.recipient_unit || '—'}</strong></div>
          <div><span className="text-zinc-500">Địa chỉ:</span> <strong>{item.recipient_address || '—'}</strong></div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Đây là xóa mềm — bản ghi và batch không bị xóa. Có thể khôi phục sau.
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lý do xóa (tùy chọn)</label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Bulk Delete Batch Modal (explicit IDs or all_filtered mode)
// =============================================================================

function BulkDeleteBatchModal({
  selectedCount,
  totalFiltered,
  allFilteredMode,
  yearFilter,
  dispatchTypeFilter,
  onClose,
  onConfirm,
  saving,
}: {
  selectedCount: number;
  totalFiltered: number;
  allFilteredMode: boolean;
  yearFilter: number;
  dispatchTypeFilter: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');

  const requireTextConfirm = allFilteredMode;

  const dispatchTypeLabel = {
    '': 'tất cả loại',
    'new_karaoke': 'ký mới Karaoke',
    'renewal_reminder': 'nhắc tái ký',
    'overdue_reminder': 'nhắc quá hạn',
  }[dispatchTypeFilter] || dispatchTypeFilter;

  const handleSubmit = () => {
    onConfirm(reason);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={allFilteredMode ? "Xóa toàn bộ đợt công văn theo bộ lọc?" : "Xóa các đợt công văn đã chọn?"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={requireTextConfirm && confirmText.trim().toUpperCase() !== 'XOA TOAN BO'}
            loading={saving}
          >
            Xóa mềm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {allFilteredMode ? (
          <>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              Hành động này sẽ xóa mềm <strong>tất cả {totalFiltered} đợt công văn</strong> phù hợp với bộ lọc hiện tại:
              <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
                <li>Năm: <strong>{yearFilter}</strong></li>
                <li>Loại công văn: <strong>{dispatchTypeLabel}</strong></li>
              </ul>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Đây là xóa mềm — file công văn không bị xóa. Có thể khôi phục sau.
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Gõ <strong>XOA TOAN BO</strong> để xác nhận:
              </label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="XOA TOAN BO"
              />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-700">
              Sẽ xóa mềm <strong>{selectedCount} đợt công văn</strong> và tất cả công văn bên trong.
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Đây là xóa mềm — file công văn không bị xóa. Có thể khôi phục sau.
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lý do xóa (tùy chọn)</label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Tab 2: Ký mới — Placeholder (dùng import Excel sau này)
// =============================================================================

function NewSignPlaceholderTab({ onNavigate }: { onNavigate?: (tab?: string) => void }) {
  const [pasteValue, setPasteValue] = useState('');
  const [rows, setRows] = useState<NewKaraokeProspectRow[]>([]);
  const [issues, setIssues] = useState<NewKaraokeIssue[]>([]);
  const [dispatchNo, setDispatchNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [mergeOutput, setMergeOutput] = useState(true);
  const [createEnvelope, setCreateEnvelope] = useState(true);
  const [envelopeRecipientMode, setEnvelopeRecipientMode] = useState<EnvelopeRecipientMode>('keep');
  const [envelopeCustomPrefix, setEnvelopeCustomPrefix] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<null | {
    merged?: string;
    envelope?: string;
    envelope_filename?: string;
    envelope_generated_at?: string;
    total?: number;
    total_files?: number;
    batch_no?: string;
    batch_id?: number;
    ready_count?: number;
    total_input?: number;
    rows?: Array<{
      id: number;
      ten_don_vi: string;
      dia_chi: string;
      so_dien_thoai?: string;
      nguoi_nhan_bia_thu?: string;
      dong_nguoi_nhan_bia_thu?: string;
      lan_gui?: number;
      trang_thai_lien_he?: string;
      trang_thai_hop_dong?: string;
      download_url?: string;
    }>;
    ok: boolean;
    error?: string;
  }>(null);

  const normalizedPlaceholders = ['{{TEN_DON_VI}}', '{{DIA_CHI}}', '{{SO_CONG_VAN}}', '{{NGAY_KY_CONG_VAN}}', '{{THANG_KY_CONG_VAN}}', '{{NAM_KY_CONG_VAN}}'];
  const legacyPlaceholders = ['{{so_cong_van}}', '{{ngay_ky_cong_van}}', '{{thang_ky_cong_van }}', '{{thang_ky_cong_van}}', '{{nam_ky_cong_van}}'];
  const hasLegacyPlaceholderWarning = false;

  const parseRows = useCallback((value: string): NewKaraokeProspectRow[] => {
    const lines = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 1) return [];

    // Detect if the first line is a header row (contains known column names)
    // or raw data (no column headers).
    const firstLine = lines[0].split('\t').map((cell) => cell.trim());
    const headerUpper = firstLine.map((c) => c.toUpperCase());
    const hasHeader = ['TEN_DON_VI', 'TÊN ĐƠN VỊ', 'DIA_CHI', 'ĐỊA CHỈ', 'SO_DIEN_THOAI', 'SDT', 'NGAY KY CONG VAN', 'NGAY_KY_CONG_VAN'].some((h) =>
      headerUpper.includes(h),
    );
    const dataStart = hasHeader ? 1 : 0;

    let header: string[] = [];
    if (hasHeader) {
      header = headerUpper;
    } else if (lines.length >= 1) {
      // Build synthetic column count from the longest row
      const maxCols = Math.max(...lines.map((l) => l.split('\t').length));
      header = Array.from({ length: maxCols }, (_, i) => `COL${i}`);
    }

    const rowsParsed: NewKaraokeProspectRow[] = [];
    const indexOf = (names: string[]) => header.findIndex((cell) => names.includes(cell));
    const idxStt = indexOf(['STT', 'COL0']);
    const idxTen = indexOf(['TEN_DON_VI', 'TÊN ĐƠN VỊ', 'COL0']);
    const idxDiaChi = indexOf(['DIA_CHI', 'ĐỊA CHỈ', 'COL1']);
    const idxSoCongVan = indexOf(['SO_CONG_VAN', 'COL1', 'COL2', 'COL3']);
    const idxNgay = indexOf(['NGAY_KY_CONG_VAN', 'NGAY KY CONG VAN', 'COL2', 'COL3', 'COL4']);
    const idxThang = indexOf(['THANG_KY_CONG_VAN', 'THANG KY CONG VAN', 'COL3', 'COL4', 'COL5']);
    const idxNam = indexOf(['NAM_KY_CONG_VAN', 'NAM KY CONG VAN', 'COL4', 'COL5', 'COL6']);
    // optional envelope-only columns
    const idxSdt = indexOf(['SO_DIEN_THOAI', 'SDT', 'DIEN_THOAI', 'PHONE', 'MOBILE', 'TEL', 'COL2', 'COL3', 'COL4', 'COL5']);
    const idxNguoiNhan = indexOf(['NGUOI_NHAN_BIA_THU', 'NGƯỜI NHẬN BÌA THƯ', 'NGUOI_NHAN', 'COL3', 'COL4', 'COL5', 'COL6']);

    for (const line of lines.slice(dataStart)) {
      const cells = line.split('\t').map((cell) => cell.trim());
      let so_dien_thoai = '';
      let nguoi_nhan_bia_thu = '';
      let ten_don_vi = idxTen >= 0 ? cells[idxTen] || '' : '';
      let dia_chi = idxDiaChi >= 0 ? cells[idxDiaChi] || '' : '';

      if (hasHeader) {
        // Standard header-based mapping
        so_dien_thoai = idxSdt >= 0 ? cells[idxSdt] || '' : '';
        nguoi_nhan_bia_thu = idxNguoiNhan >= 0 ? cells[idxNguoiNhan] || '' : '';
      } else {
        // No header — raw pasted data. Auto-detect phone and split name/address.
        if (cells.length === 1 && cells[0]) {
          // Single-cell raw line — split into name + address + phone
          const split = _splitRawLineIntoAddressAndPhone(cells[0]);
          ten_don_vi = split.ten_don_vi;
          dia_chi = split.dia_chi;
          so_dien_thoai = split.so_dien_thoai;
        } else {
          // Multi-cell — use last cell as phone (typical tab-separated paste)
          so_dien_thoai = _autoDetectPhone(cells);
          if (!ten_don_vi && cells.length >= 1) ten_don_vi = cells[0] || '';
          if (!dia_chi && cells.length >= 2) dia_chi = cells[1] || '';
        }
        nguoi_nhan_bia_thu = '';
      }

      rowsParsed.push({
        stt: idxStt >= 0 ? cells[idxStt] || '' : '',
        ten_don_vi,
        dia_chi,
        so_cong_van: idxSoCongVan >= 0 ? cells[idxSoCongVan] || '' : '',
        ngay_ky_cong_van: idxNgay >= 0 ? cells[idxNgay] || '' : '',
        thang_ky_cong_van: idxThang >= 0 ? cells[idxThang] || '' : '',
        nam_ky_cong_van: idxNam >= 0 ? cells[idxNam] || '' : '',
        so_dien_thoai,
        nguoi_nhan_bia_thu,
      });
    }
    return rowsParsed;
  }, []);

  /** Detect Vietnamese phone number from a list of cells (no header).
   *  Supports both:
   *   - Multi-cell paste where last cell IS the phone (e.g. tab-separated)
   *   - Single-cell paste where the phone is embedded at the END of the line
   *     (e.g. "Nhà hàng Kazan 187, ... Đồng Tháp 0946 915 931")
   */
  function _autoDetectPhone(cells: string[]): string {
    // Patterns for Vietnamese phone numbers (normalized to digits only for check)
    // Mobile: 9-10 digits starting 09, 01, 07
    // Landline: area code (02-08) + 7-8 digits
    // International: +84 prefix + 9-10 digits
    const mobilePattern = /^(0?)(9[0-9]|1[2689])\d[\s.\-]*\d{3}[\s.\-]*\d{3}$/;
    const landlinePattern = /^(0?\d{2,3})[\s.\-]*\d[\s.\-]*\d{3}[\s.\-]*\d{4}$/;
    const intlPattern = /^(\+84)[\s.\-]*\d{3}[\s.\-]*\d{3}[\s.\-]*\d{3}$/;
    // Embedded phone regex — matches phones inside arbitrary text
    // Accepts: 0xx xxx xxx, 0xx xxx xxxx, 0x xxx xxxx, 02x xxx xxxx, +84 ...
    const embeddedPattern = /(?:\+?84[\s.\-]?|0)(?:\d[\s.\-]?){8,11}\d/g;

    // Check from the last cell backward for the first phone-like value
    for (let i = cells.length - 1; i >= 0; i--) {
      const cell = (cells[i] || '').trim();
      if (!cell) continue;
      const normalized = cell.replace(/[\s.\-]/g, '');
      // Quick length check: valid phone is 9-11 digits after normalization
      if (!/^\+?\d{9,11}$/.test(normalized)) {
        // Not a pure phone cell — try to extract embedded phones
        if (i === cells.length - 1 && cells.length === 1) {
          // Single-cell raw line: extract phones from end of line
          const embedded = cell.match(embeddedPattern);
          if (embedded && embedded.length > 0) {
            return embedded.map((p) => p.trim()).join(' / ');
          }
        }
        continue;
      }
      // Check against known patterns
      const clean = cell.replace(/\s+/g, ' ').trim();
      if (mobilePattern.test(clean) || landlinePattern.test(clean) || intlPattern.test(clean)) {
        return cell; // return original formatting
      }
      // Fallback: if stripped string is 9-11 digits starting with 0, treat as phone
      if (/^0\d{8,10}$/.test(normalized)) {
        return cell;
      }
    }
    return '';
  }

  /** Split a raw single-cell line into { ten_don_vi, dia_chi, phone }
   *  Strategy: phone lives at end of line. Everything before the phone (minus trailing
   *  commas/spaces) becomes ten_don_vi + dia_chi. The first token(s) form ten_don_vi;
   *  the rest (after the first numeric address segment) form dia_chi.
   */
  function _splitRawLineIntoAddressAndPhone(line: string): {
    ten_don_vi: string;
    dia_chi: string;
    so_dien_thoai: string;
  } {
    const embeddedPattern = /(?:\+?84[\s.\-]?|0)(?:\d[\s.\-]?){8,11}\d/g;
    const matches = line.match(embeddedPattern);
    if (!matches || matches.length === 0) {
      // No phone detected — fall back: entire line is ten_don_vi, no dia_chi/phone
      return { ten_don_vi: line.trim(), dia_chi: '', so_dien_thoai: '' };
    }
    const phone = matches.map((m) => m.trim()).join(' / ');
    // Remove matched phone substrings
    let rest = line;
    for (const m of matches) {
      rest = rest.replace(m, ' ');
    }
    // Strip trailing punctuation/whitespace
    rest = rest.replace(/[\s,;.\-]+$/, '').replace(/^[\s,;.\-]+/, '').trim();
    // Heuristic: first whitespace-bounded run that does NOT start with a digit forms ten_don_vi;
    // everything else (including runs starting with a digit) forms dia_chi.
    // For pasted Karaoke data: "Nhà hàng Kazan 187, Lê Hồng Phong, ..."
    //   → ten_don_vi = "Nhà hàng Kazan", dia_chi = "187, Lê Hồng Phong, ..."
    const m = rest.match(/^(\S+(?:\s+\S+)*?)\s+(\d.*)$/);
    if (m) {
      return { ten_don_vi: m[1].trim(), dia_chi: m[2].trim(), so_dien_thoai: phone };
    }
    // Couldn't split into name+address — keep all as ten_don_vi
    return { ten_don_vi: rest, dia_chi: '', so_dien_thoai: phone };
  }

  useEffect(() => {
    setRows(parseRows(pasteValue));
  }, [pasteValue, parseRows]);

  const pageDate = useMemo(() => {
    const raw = String(issueDate || '').trim();
    let parsed = { ngay: '', thang: '', nam: '' };
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [nam, thang, ngay] = raw.split('-');
      parsed = { ngay: ngay || '', thang: thang || '', nam: nam || '' };
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const [ngay, thang, nam] = raw.split('/');
      parsed = { ngay: ngay || '', thang: thang || '', nam: nam || '' };
    }
    return parsed;
  }, [issueDate]);

  const resolvedRows = useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows : [];
    return safeRows.map((row) => ({
      ...row,
      so_cong_van: dispatchNo.trim() || row.so_cong_van || '',
      ngay_ky_cong_van: pageDate.ngay || row.ngay_ky_cong_van || '',
      thang_ky_cong_van: pageDate.thang || row.thang_ky_cong_van || '',
      nam_ky_cong_van: pageDate.nam || row.nam_ky_cong_van || '',
    }));
  }, [rows, dispatchNo, pageDate]);

  useEffect(() => {
    const nextIssues: NewKaraokeIssue[] = [];
    resolvedRows.forEach((row, index) => {
      const missing_fields: string[] = [];
      if (!row.ten_don_vi?.trim()) missing_fields.push('TEN_DON_VI');
      if (!row.dia_chi?.trim()) missing_fields.push('DIA_CHI');
      if (!row.so_cong_van?.trim()) missing_fields.push('SO_CONG_VAN');
      if (!row.ngay_ky_cong_van?.trim() || !row.thang_ky_cong_van?.trim() || !row.nam_ky_cong_van?.trim()) {
        missing_fields.push('NGAY_KY_CONG_VAN');
      }
      if (missing_fields.length > 0) {
        nextIssues.push({
          row_index: index + 1,
          missing_fields,
          message: 'Thiếu dữ liệu bắt buộc theo template ký mới Karaoke',
        });
      }
    });
    setIssues(nextIssues);
  }, [resolvedRows]);

  const readyCount = resolvedRows.length - issues.length;

  const buildExcelTemplateHtml = () => {
    const sampleRows = [
      ['Karaoke Song Nghi', '123 Đường ABC, Phường/Xã ..., tỉnh Đồng Tháp', '0909000000', 'Mr. Minh'],
      ['Nhà Hàng Phương Nam', 'Ấp Mỹ An 1, Xã Tháp Mười, tỉnh Đồng Tháp', '', ''],
    ];
    return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta http-equiv="Content-Type" content="application/vnd.ms-excel; charset=utf-8" /><title>Mẫu Danh Sách Ký Mới Karaoke</title><style>body{font-family:Arial,sans-serif;}table{border-collapse:collapse;}th,td{border:1px solid #ccc;padding:6px 8px;}th{background:#f3f4f6;font-weight:700;}th.opt{background:#f0f9ff;color:#0369a1;}</style></head><body><table><thead><tr><th>TEN_DON_VI</th><th>DIA_CHI</th><th class="opt">SO_DIEN_THOAI</th><th class="opt">NGUOI_NHAN_BIA_THU</th></tr></thead><tbody>${sampleRows.map(r => `<tr>${r.map((c,i) => `<td${i>=2?' style="color:#64748b"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  };

  const downloadExcelTemplate = () => {
    const blob = new Blob(['\uFEFF' + buildExcelTemplateHtml()], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Danh_Sach_Ky_Moi_Karaoke.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (resolvedRows.length === 0) {
      setError('Nạp danh sách ký mới trước khi xuất.');
      return;
    }
    if (issues.length > 0) {
      setError('Còn dòng chưa đủ dữ liệu để xuất công văn.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await createNewKaraokeBatch({
        rows: resolvedRows,
        issue_date: issueDate,
        start_cong_van_no: dispatchNo.trim(),
        merge_output: mergeOutput,
        create_envelope: createEnvelope,
        skip_invalid: false,
        ...(createEnvelope ? {
          envelope_recipient_mode: envelopeRecipientMode,
          ...(envelopeRecipientMode === 'custom' && envelopeCustomPrefix.trim() ? { envelope_custom_prefix: envelopeCustomPrefix.trim() } : {}),
        } : {}),
      });
      const hasDispatchUrl = Boolean(data.merged_download_url || (data.rows && data.rows.length > 0 && data.rows[0].download_url));
      const hasEnvelopeUrl = Boolean(data.envelope_download_url);
      const fileCount = (hasDispatchUrl ? 1 : 0) + (hasEnvelopeUrl ? 1 : 0);

      // Log envelope info to console for debugging
      if (hasEnvelopeUrl) {
        console.log('[DEBUG] Envelope exported:', {
          envelope_filename: data.envelope_filename || data.envelope_download_url?.split('/').pop(),
          envelope_download_url: data.envelope_download_url,
          envelope_generated_at: data.envelope_generated_at || new Date().toISOString(),
        });
      }

      setResult({
        ok: true,
        total: data.total_created,
        total_files: fileCount,
        batch_no: data.batch_cong_van_no,
        batch_id: data.batch_id,
        merged: data.merged_download_url,
        envelope: data.envelope_download_url,
        envelope_filename: data.envelope_filename,
        envelope_generated_at: data.envelope_generated_at,
        ready_count: data.ready_count,
        total_input: data.total_input,
        rows: data.rows?.map((r: any) => ({
          id: r.id,
          ten_don_vi: r.recipient_unit,
          dia_chi: r.recipient_address,
          so_dien_thoai: r.so_dien_thoai,
          nguoi_nhan_bia_thu: r.nguoi_nhan_bia_thu,
          dong_nguoi_nhan_bia_thu: r.dong_nguoi_nhan_bia_thu,
          lan_gui: r.lan_gui,
          trang_thai_lien_he: r.trang_thai_lien_he,
          trang_thai_hop_dong: r.trang_thai_hop_dong,
          download_url: r.download_url,
        })) ?? [],
      });
      if (hasEnvelopeUrl) {
        setTimeout(() => { downloadFile(data.envelope_download_url).catch(() => window.open(getDownloadUrl(data.envelope_download_url), '_blank')); }, 250);
      } else if (data.merged_download_url) {
        setTimeout(() => { downloadFile(data.merged_download_url).catch(() => window.open(getDownloadUrl(data.merged_download_url), '_blank')); }, 250);
      } else if (data.rows && data.rows.length > 0 && data.rows[0].download_url) {
        setTimeout(() => { downloadFile(data.rows[0].download_url).catch(() => window.open(getDownloadUrl(data.rows[0].download_url), '_blank')); }, 250);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể xuất công văn ký mới Karaoke.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ContentCard>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h3 className="text-lg font-medium text-zinc-900">Công văn ký mới Karaoke</h3>
              <p className="text-sm text-zinc-500">Chỉ dùng tên đơn vị và địa chỉ từ danh sách ngoài hệ thống.</p>
            </div>
            <div className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Đã nhận diện {normalizedPlaceholders.length} placeholder
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 space-y-2">
            <div><span className="font-medium">Template:</span> cong van_ky moi_karaoke.docx</div>
            <div className="flex flex-wrap gap-2">
              {normalizedPlaceholders.map((p) => (
                <code key={p} className="rounded bg-white px-2 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200">{p}</code>
              ))}
            </div>
            {hasLegacyPlaceholderWarning && (
              <div className="rounded-md bg-amber-100 px-3 py-2 text-amber-800">Template còn placeholder cũ/chưa chuẩn hóa. Vui lòng cập nhật mẫu Word.</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Số công văn" value={dispatchNo} onChange={(e) => setDispatchNo(e.target.value)} placeholder="Ví dụ: 123/2026" />
            <Input label="Ngày ký công văn" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            <div className="flex flex-col justify-end gap-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tùy chọn xuất</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mergeOutput}
                    onChange={(e) => setMergeOutput(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Gộp công văn thành 1 file
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createEnvelope}
                    onChange={(e) => setCreateEnvelope(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  Tạo bìa thư kèm theo
                </label>
              </div>
            </div>
          </div>

          {createEnvelope && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MailIcon size={15} className="text-blue-600 shrink-0" />
                <h4 className="text-sm font-semibold text-blue-800">Bìa thư</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Cách ghi người nhận</label>
                  <select
                    value={envelopeRecipientMode}
                    onChange={(e) => setEnvelopeRecipientMode(e.target.value as EnvelopeRecipientMode)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="keep">Giữ nguyên tên đơn vị</option>
                    <option value="co_so">Cơ sở kinh doanh + tên đơn vị</option>
                    <option value="chu_co_so">Chủ cơ sở kinh doanh + tên đơn vị</option>
                    <option value="cong_ty">Công ty + tên đơn vị</option>
                    <option value="ho_kinh_doanh">Hộ kinh doanh + tên đơn vị</option>
                    <option value="custom">Tùy chỉnh tiền tố…</option>
                  </select>
                </div>
                {envelopeRecipientMode === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 mb-1">Tiền tố người nhận</label>
                    <Input
                      value={envelopeCustomPrefix}
                      onChange={(e) => setEnvelopeCustomPrefix(e.target.value)}
                      placeholder="Ví dụ: Ban quản lý, Ông/Bà, Mr., Ms."
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Có thể thêm cột <code className="bg-white px-1 py-0.5 rounded text-zinc-700 font-mono">NGUOI_NHAN_BIA_THU</code> trong Excel để ghi người nhận riêng từng dòng. Nếu có cột này, hệ thống sẽ ưu tiên dùng đúng nội dung đó.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" onClick={downloadExcelTemplate} leftIcon={<DownloadIcon size={13} />}>
              Tải mẫu Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRows(parseRows(pasteValue))} leftIcon={<SearchIcon size={13} />}>
              Kiểm tra dữ liệu
            </Button>
            <div className="ml-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                disabled={loading || issues.length > 0 || resolvedRows.length === 0}
                leftIcon={loading ? <Loader2Icon size={14} className="animate-spin" /> : <FileTextIcon size={14} />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
              >
                {createEnvelope ? 'Xuất công văn + bìa thư' : 'Xuất công văn'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Nạp danh sách ký mới</label>
            <textarea
              className="min-h-[180px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder="Copy dữ liệu từ Excel mẫu rồi dán vào đây, gồm cả dòng tiêu đề TEN_DON_VI và DIA_CHI."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-zinc-50 p-4 text-sm"><div className="text-zinc-500">Tổng số dòng</div><div className="mt-1 text-xl font-semibold text-zinc-900">{resolvedRows.length}</div></div>
            <div className="rounded-lg bg-emerald-50 p-4 text-sm"><div className="text-emerald-700">Sẵn sàng xuất</div><div className="mt-1 text-xl font-semibold text-emerald-800">{readyCount}</div></div>
            <div className="rounded-lg bg-amber-50 p-4 text-sm"><div className="text-amber-700">Thiếu dữ liệu</div><div className="mt-1 text-xl font-semibold text-amber-800">{issues.length}</div></div>
          </div>

          {issues.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="font-medium mb-2">Các dòng cần bổ sung dữ liệu</div>
              <ul className="space-y-1 list-disc pl-5">
                {issues.map((issue) => (
                  <li key={issue.row_index}>Dòng {issue.row_index}: thiếu {issue.missing_fields.join(', ')}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          {result?.ok && (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle2Icon size={22} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h4 className="text-base font-semibold text-emerald-800">
                      {result.envelope
                        ? 'Xuất công văn và bìa thư thành công'
                        : 'Xuất công văn thành công'}
                    </h4>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {result.batch_no}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-sm mb-4">
                    <div>
                      <dt className="text-zinc-400 text-xs">Số công văn</dt>
                      <dd className="font-mono font-medium text-zinc-800">{result.batch_no}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400 text-xs">Ngày ký</dt>
                      <dd className="font-medium text-zinc-800">{issueDate ? new Date(issueDate + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400 text-xs">Tổng đơn vị</dt>
                      <dd className="font-semibold text-zinc-800">{result.ready_count ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-400 text-xs">Tổng file tạo</dt>
                      <dd className="font-semibold text-emerald-700">{result.total_files ?? result.total ?? 1} file</dd>
                    </div>
                    <div className="sm:col-span-4 mt-1">
                      <dt className="text-zinc-400 text-xs">Đã lưu theo dõi</dt>
                      <dd className="font-medium text-blue-700">{result.ready_count ?? 0} đơn vị</dd>
                    </div>
                    {result.envelope_filename && (
                      <div className="sm:col-span-4 mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                        <dt className="text-blue-600 text-xs font-medium">Bìa thư</dt>
                        <dd className="font-mono text-xs text-blue-800 truncate" title={result.envelope_filename}>
                          {result.envelope_filename}
                        </dd>
                        <dd className="text-xs text-blue-500 mt-0.5">
                          URL: <span className="font-mono">{result.envelope}</span>
                        </dd>
                        {result.envelope_generated_at && (
                          <dd className="text-xs text-blue-500">
                            Tạo lúc: {new Date(result.envelope_generated_at).toLocaleString('vi-VN')}
                          </dd>
                        )}
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {(result.merged || (result.total ?? 0) > 0) && (
                      <button
                        onClick={() => {
                          const url = result.merged || '';
                          downloadFile(url).catch(() => window.open(getDownloadUrl(url), '_blank'));
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <FileTextIcon size={15} />
                        Tải công văn
                      </button>
                    )}
                    {result.envelope ? (
                      <button
                        onClick={() => downloadFile(result.envelope!).catch(() => window.open(getDownloadUrl(result.envelope!), '_blank'))}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                      >
                        <MailIcon size={15} />
                        Tải bìa thư
                      </button>
                    ) : null}
                    <button
                      onClick={() => { onNavigate?.('created'); }}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
                    >
                      <FileTextIcon size={15} />
                      Xem trong Đã tạo
                    </button>
                    <button
                      onClick={() => { onNavigate?.('tracking'); }}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors"
                    >
                      <SearchIcon size={15} />
                      Theo dõi liên hệ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-3 py-2 text-left">STT</th>
                  <th className="px-3 py-2 text-left">Tên đơn vị</th>
                  <th className="px-3 py-2 text-left">Địa chỉ</th>
                  <th className="px-3 py-2 text-left">SĐT</th>
                  <th className="px-3 py-2 text-left">Số công văn</th>
                  <th className="px-3 py-2 text-left">Ngày ký</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {resolvedRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Chưa có dữ liệu ký mới Karaoke.</td></tr>
                ) : resolvedRows.map((row, index) => {
                  const issue = issues.find((item) => item.row_index === index + 1);
                  return (
                    <tr key={`${row.ten_don_vi}-${index}`} className="border-t border-zinc-100">
                      <td className="px-3 py-2">{row.stt || index + 1}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900">{row.ten_don_vi || '—'}</td>
                      <td className="px-3 py-2">{row.dia_chi || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-700">{row.so_dien_thoai || <span className="text-zinc-400">—</span>}</td>
                      <td className="px-3 py-2">{row.so_cong_van || '—'}</td>
                      <td className="px-3 py-2">{row.ngay_ky_cong_van && row.thang_ky_cong_van && row.nam_ky_cong_van ? `${row.ngay_ky_cong_van}/${row.thang_ky_cong_van}/${row.nam_ky_cong_van}` : '—'}</td>
                      <td className="px-3 py-2">
                        {issue ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Thiếu dữ liệu</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Sẵn sàng xuất</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}

// =============================================================================
// Tab 4: Theo dõi — Placeholder (dùng dữ liệu từ Đã tạo sau)
// =============================================================================

function TrackingPlaceholderTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [dispatchTypeFilter, setDispatchTypeFilter] = useState('new_karaoke');
  const [contactStatusFilter, setContactStatusFilter] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // --- Edit / Delete item modal states ---
  const [editItemModal, setEditItemModal] = useState<any | null>(null);
  const [deleteItemModal, setDeleteItemModal] = useState<any | null>(null);
  const [savingTracking, setSavingTracking] = useState(false);

  // --- Bulk selection state ---
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [allFilteredModeItems, setAllFilteredModeItems] = useState(false);
  const [bulkDeleteItemModal, setBulkDeleteItemModal] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTrackingItems({
        year: yearFilter,
        dispatch_type: dispatchTypeFilter || undefined,
        trang_thai_lien_he: contactStatusFilter || undefined,
        trang_thai_hop_dong: contractStatusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setItems(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 0);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải danh sách theo dõi');
    } finally {
      setLoading(false);
    }
  }, [yearFilter, dispatchTypeFilter, contactStatusFilter, contractStatusFilter, page, pageSize]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { setPage(1); }, [yearFilter, dispatchTypeFilter, contactStatusFilter, contractStatusFilter]);

  useEffect(() => {
    // Clear selection when filters/search/page change
    setSelectedItemIds(new Set());
    setAllFilteredModeItems(false);
  }, [yearFilter, dispatchTypeFilter, contactStatusFilter, contractStatusFilter, page]);

  const handleUpdate = async (itemId: number, params: Record<string, unknown>) => {
    try {
      await updateItemTracking(itemId, params as any);
      await loadItems();
    } catch (e: any) {
      alert(e.message || 'Lỗi cập nhật');
    }
  };

  const handleDownload = (url: string) => {
    if (!url) return;
    downloadFile(url).catch(() => window.open(getDownloadUrl(url), '_blank'));
  };

  const handleEditItem = async (itemId: number, params: Record<string, unknown>) => {
    if (!editItemModal) return;
    setSavingTracking(true);
    try {
      const res = await updateItem(itemId, params as any);
      if (!res.ok) { alert(res.error || 'Lỗi lưu thay đổi'); return; }
      if (res.warning) alert(res.warning);
      setEditItemModal(null);
      await loadItems();
    } catch (e: any) {
      alert(e.message || 'Lỗi lưu thay đổi');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleDeleteItemTracking = async (reason: string) => {
    if (!deleteItemModal) return;
    setSavingTracking(true);
    try {
      const res = await deleteItem(deleteItemModal.id, reason);
      if (!res.ok) { alert(res.error || 'Lỗi xóa dòng theo dõi'); return; }
      alert(res.message);
      setDeleteItemModal(null);
      await loadItems();
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa dòng theo dõi');
    } finally {
      setSavingTracking(false);
    }
  };

  // --- Bulk delete tracking items ---
  const handleBulkDeleteItems = async (reason: string) => {
    if (selectedItemIds.size === 0 && !allFilteredModeItems) {
      alert('Chưa chọn dòng nào');
      return;
    }
    setSavingTracking(true);
    try {
      let res;
      if (allFilteredModeItems) {
        res = await bulkDeleteItems({
          scope: "all_filtered",
          filters: {
            year: yearFilter,
            dispatch_type: dispatchTypeFilter || undefined,
            trang_thai_lien_he: contactStatusFilter || undefined,
            trang_thai_hop_dong: contractStatusFilter || undefined,
            include_deleted: false,
          },
          confirm_text: "XOA TOAN BO",
          delete_reason: reason,
        });
      } else {
        res = await bulkDeleteItems({
          ids: Array.from(selectedItemIds),
          delete_reason: reason,
        });
      }
      if (!res.ok) {
        alert(res.error || 'Lỗi xóa hàng loạt'); return;
      }
      alert(res.message);
      setBulkDeleteItemModal(false);
      setSelectedItemIds(new Set());
      setAllFilteredModeItems(false);
      await loadItems();
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa hàng loạt');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleSelectAllFilteredItems = () => {
    if (total === 0) return;
    setAllFilteredModeItems(true);
    setSelectedItemIds(new Set());
  };

  const contactStatusOptions = [
    { value: '', label: 'Tất cả trạng thái liên hệ' },
    { value: 'CHUA_LIEN_HE', label: 'Chưa liên hệ' },
    { value: 'DA_LIEN_HE', label: 'Đã liên hệ' },
    { value: 'DA_GUI_CONG_VAN', label: 'Đã gửi công văn' },
    { value: 'DA_PHAN_HOI', label: 'Đã phản hồi' },
    { value: 'DANG_THUONG_LUONG', label: 'Đang thương lượng' },
    { value: 'NGUNG_HOAT_DONG', label: 'Ngưng hoạt động' },
    { value: 'KHONG_HOP_TAC', label: 'Không hợp tác' },
    { value: 'SAI_THONG_TIN', label: 'Sai thông tin' },
  ];

  const contractStatusOptions = [
    { value: '', label: 'Tất cả trạng thái hợp đồng' },
    { value: 'CHUA_KY_HOP_DONG', label: 'Chưa ký hợp đồng' },
    { value: 'DANG_XU_LY_HOP_DONG', label: 'Đang xử lý' },
    { value: 'DA_KY_HOP_DONG', label: 'Đã ký hợp đồng' },
    { value: 'TU_CHOI_KY', label: 'Từ chối ký' },
    { value: 'KHONG_DU_DIEU_KIEN', label: 'Không đủ điều kiện' },
  ];

  const dispatchTypeOptions = [
    { value: '', label: 'Tất cả loại' },
    { value: 'new_karaoke', label: 'Ký mới Karaoke' },
    { value: 'renewal_reminder', label: 'Nhắc tái ký' },
  ];

  const yearOptions = [
    { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
    { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
    { value: String(new Date().getFullYear() - 2), label: String(new Date().getFullYear() - 2) },
  ];

  const contactStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      CHUA_LIEN_HE: 'bg-zinc-100 text-zinc-600',
      DA_LIEN_HE: 'bg-blue-100 text-blue-700',
      DA_GUI_CONG_VAN: 'bg-emerald-100 text-emerald-700',
      DA_PHAN_HOI: 'bg-violet-100 text-violet-700',
      DANG_THUONG_LUONG: 'bg-amber-100 text-amber-700',
      NGUNG_HOAT_DONG: 'bg-red-100 text-red-700',
      KHONG_HOP_TAC: 'bg-red-100 text-red-700',
      SAI_THONG_TIN: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
      CHUA_LIEN_HE: 'Chưa liên hệ',
      DA_LIEN_HE: 'Đã liên hệ',
      DA_GUI_CONG_VAN: 'Đã gửi công văn',
      DA_PHAN_HOI: 'Đã phản hồi',
      DANG_THUONG_LUONG: 'Đang thương lượng',
      NGUNG_HOAT_DONG: 'Ngưng hoạt động',
      KHONG_HOP_TAC: 'Không hợp tác',
      SAI_THONG_TIN: 'Sai thông tin',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-zinc-100 text-zinc-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const contractStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      CHUA_KY_HOP_DONG: 'bg-zinc-100 text-zinc-600',
      DANG_XU_LY_HOP_DONG: 'bg-amber-100 text-amber-700',
      DA_KY_HOP_DONG: 'bg-green-100 text-green-700',
      TU_CHOI_KY: 'bg-red-100 text-red-700',
      KHONG_DU_DIEU_KIEN: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
      CHUA_KY_HOP_DONG: 'Chưa ký Đ',
      DANG_XU_LY_HOP_DONG: 'Đang xử lý',
      DA_KY_HOP_DONG: 'Đã ký Đ',
      TU_CHOI_KY: 'Từ chối ký',
      KHONG_DU_DIEU_KIEN: 'K đủ điều kiện',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-zinc-100 text-zinc-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Năm</label>
          <Select
            value={String(yearFilter)}
            onChange={v => setYearFilter(Number(v))}
            options={yearOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Loại công văn</label>
          <Select
            value={dispatchTypeFilter}
            onChange={v => setDispatchTypeFilter(v)}
            options={dispatchTypeOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái liên hệ</label>
          <Select
            value={contactStatusFilter}
            onChange={v => setContactStatusFilter(v)}
            options={contactStatusOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái hợp đồng</label>
          <Select
            value={contractStatusFilter}
            onChange={v => setContractStatusFilter(v)}
            options={contractStatusOptions}
          />
        </div>
        <Button variant="ghost" onClick={loadItems} leftIcon={<RefreshCwIcon size={14} />}>
          Làm mới
        </Button>
        <div className="ml-auto text-sm text-zinc-500">
          {total} đơn vị
        </div>
      </div>

      {/* Bulk action bar */}
      {(selectedItemIds.size > 0 || allFilteredModeItems) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
          <span className="text-sm font-semibold text-amber-900">
            {allFilteredModeItems
              ? `Đã chọn tất cả ${total} đơn vị theo bộ lọc hiện tại`
              : `Đã chọn ${selectedItemIds.size} đơn vị`}
          </span>
          {selectedItemIds.size > 0 && selectedItemIds.size < (items?.length || 0) && !allFilteredModeItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allVisible = new Set((items || []).map((item: any) => item.id));
                setSelectedItemIds(allVisible);
              }}
            >
              Chọn tất cả {(items || []).length} đơn vị trên trang này
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2Icon size={13} />}
            onClick={() => setBulkDeleteItemModal(true)}
          >
            {allFilteredModeItems ? 'Xóa toàn bộ theo bộ lọc' : 'Xóa dòng đã chọn'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedItemIds(new Set()); setAllFilteredModeItems(false); }}>
            Bỏ chọn
          </Button>
          {!allFilteredModeItems && selectedItemIds.size < total && (
            <span className="text-xs text-amber-700 ml-auto">
              Chỉ đang chọn {selectedItemIds.size} đơn vị trên trang này.{' '}
              <button
                type="button"
                className="underline hover:no-underline font-medium"
                onClick={handleSelectAllFilteredItems}
              >
                Chọn tất cả {total} đơn vị theo bộ lọc hiện tại
              </button>
            </span>
          )}
        </div>
      )}

      <ContentCard padded={false}>
        {loading ? (
          <TableSkeleton columns={9} rows={10} />
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-red-600">
            <AlertCircleIcon size={16} /><span>{error}</span>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={32} />}
            title="Chưa có đơn vị nào trong theo dõi"
            description="Xuất công văn ký mới Karaoke để bắt đầu theo dõi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="w-8 px-3 py-2"></th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Đơn vị</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Địa chỉ</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Số công văn</th>
                  <th className="px-3 py-2 text-center font-medium text-zinc-500">Lần</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Liên hệ</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Hợp đồng</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Ngày LH gần nhất</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Ghi chú</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selectedItemIds.has(item.id)}
                        onChange={(v) => {
                          const next = new Set(selectedItemIds);
                          v ? next.add(item.id) : next.delete(item.id);
                          setSelectedItemIds(next);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 max-w-[180px]">
                      <div className="font-medium text-zinc-800 truncate" title={item.recipient_unit}>{item.recipient_unit || '-'}</div>
                      {item.so_dien_thoai && (
                        <div className="text-zinc-400 text-xs truncate" title={item.so_dien_thoai}>📞 {item.so_dien_thoai}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[180px] text-zinc-500 truncate" title={item.recipient_address}>{item.recipient_address || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono font-medium text-zinc-700">{item.cong_van_no || '-'}</div>
                      <div className="text-zinc-400 text-xs">{item.issue_date}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-medium ${
                        (item.lan_gui || 1) >= 3 ? 'bg-red-100 text-red-700' :
                        (item.lan_gui || 1) >= 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.lan_gui || 1}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.trang_thai_lien_he || 'CHUA_LIEN_HE'}
                        onChange={e => handleUpdate(item.id, { trang_thai_lien_he: e.target.value })}
                        className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white max-w-[160px]"
                      >
                        <option value="CHUA_LIEN_HE">Chưa liên hệ</option>
                        <option value="DA_LIEN_HE">Đã liên hệ</option>
                        <option value="DA_GUI_CONG_VAN">Đã gửi công văn</option>
                        <option value="DA_PHAN_HOI">Đã phản hồi</option>
                        <option value="DANG_THUONG_LUONG">Đang thương lượng</option>
                        <option value="NGUNG_HOAT_DONG">Ngưng hoạt động</option>
                        <option value="KHONG_HOP_TAC">Không hợp tác</option>
                        <option value="SAI_THONG_TIN">Sai thông tin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.trang_thai_hop_dong || 'CHUA_KY_HOP_DONG'}
                        onChange={e => handleUpdate(item.id, { trang_thai_hop_dong: e.target.value })}
                        className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white max-w-[140px]"
                      >
                        <option value="CHUA_KY_HOP_DONG">Chưa ký Đ</option>
                        <option value="DANG_XU_LY_HOP_DONG">Đang xử lý</option>
                        <option value="DA_KY_HOP_DONG">Đã ký Đ</option>
                        <option value="TU_CHOI_KY">Từ chối ký</option>
                        <option value="KHONG_DU_DIEU_KIEN">Không đủ điều kiện</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-zinc-400 text-xs whitespace-nowrap">{item.ngay_lien_he_gan_nhat ? new Date(item.ngay_lien_he_gan_nhat).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="px-3 py-2 max-w-[140px]">
                      <input
                        defaultValue={item.ghi_chu_lien_he || ''}
                        placeholder="Ghi chú..."
                        className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white w-full max-w-[140px]"
                        onBlur={e => { if (e.target.value !== (item.ghi_chu_lien_he || '')) handleUpdate(item.id, { ghi_chu_lien_he: e.target.value }); }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.download_url && (
                          <button
                            onClick={() => handleDownload(item.download_url)}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="Tải công văn"
                          >
                            <FileTextIcon size={13} />
                          </button>
                        )}
                        {item.envelope_download_url && (
                          <button
                            onClick={() => handleDownload(item.envelope_download_url)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Tải bìa thư"
                          >
                            <MailIcon size={13} />
                          </button>
                        )}
                        <RowActionsMenu actions={[
                          {
                            label: 'Sửa',
                            icon: <Edit2Icon size={14} />,
                            onClick: () => setEditItemModal(item),
                          },
                          {
                            label: 'Đánh dấu đã liên hệ',
                            icon: <CheckCircle2Icon size={14} />,
                            onClick: () => handleUpdate(item.id, { trang_thai_lien_he: 'DA_LIEN_HE' }),
                          },
                          {
                            label: 'Đánh dấu ngưng hoạt động',
                            icon: <AlertCircleIcon size={14} />,
                            onClick: () => handleUpdate(item.id, { trang_thai_lien_he: 'NGUNG_HOAT_DONG' }),
                          },
                          {
                            label: 'Đánh dấu đã ký hợp đồng',
                            icon: <CheckCircle2Icon size={14} />,
                            onClick: () => handleUpdate(item.id, { trang_thai_hop_dong: 'DA_KY_HOP_DONG' }),
                          },
                          { divider: true, label: '' },
                          {
                            label: 'Xóa dòng theo dõi',
                            icon: <Trash2Icon size={14} />,
                            tone: 'danger',
                            onClick: () => setDeleteItemModal(item),
                          },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-zinc-500">
            Đang xem {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} / Tổng {total} đơn vị
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹ Trước</Button>
            <span className="text-sm text-zinc-600">Trang {page} / {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau ›</Button>
          </div>
        </div>
      )}

      {/* Tracking tab modals */}
      <TrackingEditItemModal
        item={editItemModal}
        onClose={() => setEditItemModal(null)}
        onSave={handleEditItem}
        saving={savingTracking}
      />
      {bulkDeleteItemModal && (
      <BulkDeleteItemModal
        selectedCount={selectedItemIds.size}
        totalFiltered={total}
        allFilteredMode={allFilteredModeItems}
        yearFilter={yearFilter}
        dispatchTypeFilter={dispatchTypeFilter}
        contactStatusFilter={contactStatusFilter}
        contractStatusFilter={contractStatusFilter}
        onClose={() => setBulkDeleteItemModal(false)}
        onConfirm={handleBulkDeleteItems}
        saving={savingTracking}
      />
      )}

      <TrackingDeleteItemModal
        item={deleteItemModal}
        onClose={() => setDeleteItemModal(null)}
        onConfirm={handleDeleteItemTracking}
        saving={savingTracking}
      />
    </div>
  );
}

// =============================================================================
// Tracking tab — inline Edit & Delete modals
// =============================================================================

function TrackingEditItemModal({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: any | null;
  onClose: () => void;
  onSave: (itemId: number, params: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [recipientUnit, setRecipientUnit] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [trangThaiLienHe, setTrangThaiLienHe] = useState('');
  const [ngayLienHe, setNgayLienHe] = useState('');
  const [ghiChuLienHe, setGhiChuLienHe] = useState('');
  const [trangThaiHopDong, setTrangThaiHopDong] = useState('');
  const [soHopDong, setSoHopDong] = useState('');
  const [ngayKyHopDong, setNgayKyHopDong] = useState('');

  useEffect(() => {
    if (item) {
      setRecipientUnit(item.recipient_unit || '');
      setRecipientAddress(item.recipient_address || '');
      setRecipientPhone(item.so_dien_thoai || '');
      setRecipientContact(item.dong_nguoi_nhan_bia_thu || '');
      setTrangThaiLienHe(item.trang_thai_lien_he || 'DA_GUI_CONG_VAN');
      setNgayLienHe(item.ngay_lien_he_gan_nhat ? String(item.ngay_lien_he_gan_nhat).substring(0, 10) : '');
      setGhiChuLienHe(item.ghi_chu_lien_he || '');
      setTrangThaiHopDong(item.trang_thai_hop_dong || 'CHUA_KY_HOP_DONG');
      setSoHopDong(item.contract_no || '');
      setNgayKyHopDong(item.ngay_ky_hop_dong ? String(item.ngay_ky_hop_dong).substring(0, 10) : '');
    }
  }, [item]);

  if (!item) return null;

  const contactOptions = [
    { value: 'CHUA_LIEN_HE', label: 'Chưa liên hệ' },
    { value: 'DA_LIEN_HE', label: 'Đã liên hệ' },
    { value: 'DA_GUI_CONG_VAN', label: 'Đã gửi công văn' },
    { value: 'DA_PHAN_HOI', label: 'Đã phản hồi' },
    { value: 'DANG_THUONG_LUONG', label: 'Đang thương lượng' },
    { value: 'NGUNG_HOAT_DONG', label: 'Ngưng hoạt động' },
    { value: 'KHONG_HOP_TAC', label: 'Không hợp tác' },
    { value: 'SAI_THONG_TIN', label: 'Sai thông tin' },
  ];

  const contractOptions = [
    { value: 'CHUA_KY_HOP_DONG', label: 'Chưa ký hợp đồng' },
    { value: 'DANG_XU_LY_HOP_DONG', label: 'Đang xử lý' },
    { value: 'DA_KY_HOP_DONG', label: 'Đã ký hợp đồng' },
    { value: 'TU_CHOI_KY', label: 'Từ chối ký' },
    { value: 'KHONG_DU_DIEU_KIEN', label: 'Không đủ điều kiện' },
  ];

  const handleSave = () => {
    onSave(item.id, {
      recipient_unit: recipientUnit,
      recipient_address: recipientAddress,
      recipient_phone: recipientPhone,
      recipient_contact: recipientContact,
      trang_thai_lien_he: trangThaiLienHe,
      ngay_lien_he_gan_nhat: ngayLienHe || undefined,
      ghi_chu_lien_he: ghiChuLienHe,
      trang_thai_hop_dong: trangThaiHopDong,
      contract_no: soHopDong,
      ngay_ky_hop_dong: ngayKyHopDong || undefined,
    });
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Chỉnh sửa dòng theo dõi"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} loading={saving}>Lưu thay đổi</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tên đơn vị</label>
            <Input value={recipientUnit} onChange={e => setRecipientUnit(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-zinc-500 mb-1">Địa chỉ</label>
            <Input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Số điện thoại</label>
            <Input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Người nhận bìa thư</label>
            <Input value={recipientContact} onChange={e => setRecipientContact(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái liên hệ</label>
            <Select value={trangThaiLienHe} onChange={v => setTrangThaiLienHe(v)} options={contactOptions} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày liên hệ gần nhất</label>
            <Input type="date" value={ngayLienHe} onChange={e => setNgayLienHe(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Trạng thái hợp đồng</label>
            <Select value={trangThaiHopDong} onChange={v => setTrangThaiHopDong(v)} options={contractOptions} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Số hợp đồng</label>
            <Input value={soHopDong} onChange={e => setSoHopDong(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Ngày ký hợp đồng</label>
            <Input type="date" value={ngayKyHopDong} onChange={e => setNgayKyHopDong(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Ghi chú liên hệ</label>
          <Textarea value={ghiChuLienHe} onChange={e => setGhiChuLienHe(e.target.value)} rows={2} />
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Chỉnh sửa chỉ cập nhật dữ liệu theo dõi. File công văn/bìa thư đã tạo trước đó sẽ không tự thay đổi.
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Bulk Delete Item Modal (explicit IDs or all_filtered mode)
// =============================================================================

function BulkDeleteItemModal({
  selectedCount,
  totalFiltered,
  allFilteredMode,
  yearFilter,
  dispatchTypeFilter,
  contactStatusFilter,
  contractStatusFilter,
  onClose,
  onConfirm,
  saving,
}: {
  selectedCount: number;
  totalFiltered: number;
  allFilteredMode: boolean;
  yearFilter: number;
  dispatchTypeFilter: string;
  contactStatusFilter: string;
  contractStatusFilter: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');

  const requireTextConfirm = allFilteredMode;

  const dispatchTypeLabel = {
    '': 'tất cả loại',
    'new_karaoke': 'ký mới Karaoke',
    'renewal_reminder': 'nhắc tái ký',
    'overdue_reminder': 'nhắc quá hạn',
  }[dispatchTypeFilter] || dispatchTypeFilter;

  const contactStatusLabel = {
    '': 'tất cả',
    'CHUA_LIEN_HE': 'Chưa liên hệ',
    'DA_LIEN_HE': 'Đã liên hệ',
    'DA_GUI_CONG_VAN': 'Đã gửi công văn',
    'DA_PHAN_HOI': 'Đã phản hồi',
    'DANG_THUONG_LUONG': 'Đang thương lượng',
    'NGUNG_HOAT_DONG': 'Ngưng hoạt động',
    'KHONG_HOP_TAC': 'Không hợp tác',
    'SAI_THONG_TIN': 'Sai thông tin',
  }[contactStatusFilter] || contactStatusFilter;

  const contractStatusLabel = {
    '': 'tất cả',
    'CHUA_KY': 'Chưa ký',
    'DA_KY': 'Đã ký',
    'DA_HUY': 'Đã hủy',
  }[contractStatusFilter] || contractStatusFilter;

  const handleSubmit = () => {
    onConfirm(reason);
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={allFilteredMode ? "Xóa toàn bộ dòng theo dõi theo bộ lọc?" : "Xóa các dòng theo dõi đã chọn?"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={requireTextConfirm && confirmText.trim().toUpperCase() !== 'XOA TOAN BO'}
            loading={saving}
          >
            Xóa mềm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {allFilteredMode ? (
          <>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              Hành động này sẽ xóa mềm <strong>tất cả {totalFiltered} dòng theo dõi</strong> phù hợp với bộ lọc hiện tại:
              <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
                <li>Năm: <strong>{yearFilter}</strong></li>
                <li>Loại công văn: <strong>{dispatchTypeLabel}</strong></li>
                <li>Trạng thái liên hệ: <strong>{contactStatusLabel}</strong></li>
                <li>Trạng thái hợp đồng: <strong>{contractStatusLabel}</strong></li>
              </ul>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Đây là xóa mềm — file không bị xóa. Đợt công văn cha không bị tự động xóa. Có thể khôi phục sau.
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Gõ <strong>XOA TOAN BO</strong> để xác nhận:
              </label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="XOA TOAN BO"
              />
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-700">
              Sẽ xóa mềm <strong>{selectedCount} dòng theo dõi</strong>.
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Đây là xóa mềm — file không bị xóa. Đợt công văn cha không bị tự động xóa. Có thể khôi phục sau.
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lý do xóa (tùy chọn)</label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  );
}

function TrackingDeleteItemModal({
  item,
  onClose,
  onConfirm,
  saving,
}: {
  item: any | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (item) setReason(''); }, [item]);
  if (!item) return null;

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Xóa dòng theo dõi?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} loading={saving}>Xóa dòng</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1 text-sm">
          <div><span className="text-zinc-500">Tên đơn vị:</span> <strong>{item.recipient_unit || '—'}</strong></div>
          <div><span className="text-zinc-500">Địa chỉ:</span> <strong>{item.recipient_address || '—'}</strong></div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          Đây là xóa mềm — bản ghi được giữ lại. Có thể khôi phục sau.
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Lý do xóa (tùy chọn)</label>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Tab 5: Cài đặt mẫu & bìa thư
// =============================================================================

function SettingsTab() {
  const [config, setConfig] = useState<EnvelopeLayoutConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [local, setLocal] = useState<Record<string, number | string>>({});

  // VCPMC Bia Thu physical layout preset.
  // page_h=170, baseline_from_bottom=32 -> baseline_y_from_top=138
  // font_baseline_offset=4 -> paragraph_top=134
  const VCPMC_PRESET = {
    page_width_mm: 230,
    page_height_mm: 170,
    // Physical positioning (for _generate_vcpmc_envelope_docx)
    recipient_x_mm: 130,               // from left edge
    recipient_width_mm: 95,             // usable width
    // Baseline anchor
    first_line_baseline_from_bottom_mm: 32,  // baseline of line-1 is 32mm from page bottom
    font_baseline_offset_mm: 4,        // top-of-line to baseline
    // Line gap + font
    line_gap_mm: 8,
    font_name: "Times New Roman",
    font_size_pt: 13,
    // Phone — default ON with separate line
    phone_on_envelope: true,
    phone_render_mode: "separate_line",
    // Printer offset
    printer_offset_x_mm: 0,
    printer_offset_y_mm: 0,
  };

  // Canon LBP325x offset profile (applied on top of VCPMC preset)
  const CANON_PROFILE = {
    printer_offset_x_mm: 0,
    printer_offset_y_mm: -22,
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEnvelopeLayoutConfig();
      setConfig(data);
      // Build local state from server config, falling back to VCPMC preset
      const safe: Record<string, number | string> = {
        page_width_mm: data.page_width_mm ?? VCPMC_PRESET.page_width_mm,
        page_height_mm: (data.page_height_mm ?? 0) >= 170 ? data.page_height_mm : 170,
        // Physical
        recipient_x_mm: data.recipient_x_mm ?? VCPMC_PRESET.recipient_x_mm,
        recipient_width_mm: data.recipient_width_mm ?? VCPMC_PRESET.recipient_width_mm,
        // Baseline anchor
        first_line_baseline_from_bottom_mm: data.first_line_baseline_from_bottom_mm ?? VCPMC_PRESET.first_line_baseline_from_bottom_mm,
        font_baseline_offset_mm: data.font_baseline_offset_mm ?? VCPMC_PRESET.font_baseline_offset_mm,
        // Line gap + font
        line_gap_mm: data.line_gap_mm ?? VCPMC_PRESET.line_gap_mm,
        font_size_pt: data.font_size_pt ?? VCPMC_PRESET.font_size_pt,
        font_name: data.font_name ?? VCPMC_PRESET.font_name,
        // Phone
        phone_on_envelope: data.phone_on_envelope ?? VCPMC_PRESET.phone_on_envelope,
        phone_render_mode: data.phone_render_mode ?? VCPMC_PRESET.phone_render_mode,
        // Printer offset
        printer_offset_x_mm: data.printer_offset_x_mm ?? 0,
        printer_offset_y_mm: data.printer_offset_y_mm ?? 0,
      };
      setLocal(safe);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải cấu hình');
      setLocal({ ...VCPMC_PRESET });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      // Safety net: enforce VCPMC 230x170
      const safeLocal = {
        ...local,
        page_width_mm: 230,
        page_height_mm: Math.max(170, Number(local.page_height_mm) || 170),
      };
      await saveEnvelopeLayoutConfig({
        preset_name: 'VCPMC Bia Thu 230x170 (physical)',
        page_width_mm: Number(safeLocal.page_width_mm),
        page_height_mm: Number(safeLocal.page_height_mm),
        // Physical
        recipient_x_mm: Number(safeLocal.recipient_x_mm),
        recipient_width_mm: Number(safeLocal.recipient_width_mm),
        // Baseline anchor
        first_line_baseline_from_bottom_mm: Number(safeLocal.first_line_baseline_from_bottom_mm),
        font_baseline_offset_mm: Number(safeLocal.font_baseline_offset_mm),
        // Line gap + font
        line_gap_mm: Number(safeLocal.line_gap_mm),
        font_size_pt: Number(safeLocal.font_size_pt),
        font_name: String(safeLocal.font_name),
        // Phone
        phone_on_envelope: Boolean(safeLocal.phone_on_envelope),
        phone_render_mode: String(safeLocal.phone_render_mode ?? "inline_address"),
        // Printer offset
        printer_offset_x_mm: Number(safeLocal.printer_offset_x_mm),
        printer_offset_y_mm: Number(safeLocal.printer_offset_y_mm),
      });
      setSuccess('Đã lưu cấu hình bìa thư.');
      load();
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleResetVCPMC = () => {
    setLocal({ ...VCPMC_PRESET });
    (async () => {
      try {
        await saveEnvelopeLayoutConfig({
          ...VCPMC_PRESET,
          preset_name: 'VCPMC Bia Thu 230x170 (physical)',
        });
        setSuccess('Đã khôi phục preset VCPMC 230×170 (baseline 32mm, Y=134).');
        load();
      } catch (e: any) {
        setError('Đã đặt preset nhưng lỗi lưu: ' + (e.message || ''));
      }
    })();
  };

  const handleApplyCanonOffset = () => {
    // Canon profile only changes printer offsets - NEVER touches page dimensions.
    const canonLocal = {
      ...local,
      page_width_mm: 230,
      page_height_mm: 170,
      ...CANON_PROFILE,
    };
    setLocal(canonLocal);
    setSuccess('Đã áp dụng offset Canon (giữ nguyên khổ 230×170 và tọa độ X/Y). Nhấn "Lưu cấu hình" để áp dụng.');
  };

  const handleCreateTest230x170 = async () => {
    setTesting(true);
    setError('');
    try {
      const result = await createEnvelopeTest230x170();
      if (result.download_url) {
        downloadFile(result.download_url).catch(() => {
          window.open(getDownloadUrl(result.download_url), '_blank');
        });
        setSuccess(`Đã tạo test 230x170: ${result.filename}`);
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi tạo test envelope');
    } finally {
      setTesting(false);
    }
  };

  const handleCreateTestCanon = async () => {
    setTesting(true);
    setError('');
    try {
      const result = await createEnvelopeTestCanon();
      if (result.download_url) {
        downloadFile(result.download_url).catch(() => {
          window.open(getDownloadUrl(result.download_url), '_blank');
        });
        setSuccess(`Đã tạo test Canon: ${result.filename}`);
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi tạo test envelope');
    } finally {
      setTesting(false);
    }
  };

  const handleCreateAlignmentTest = async () => {
    setTesting(true);
    setError('');
    try {
      const payload = {
        recipient_x_mm: Number(local.recipient_x_mm),
        recipient_width_mm: Number(local.recipient_width_mm),
        first_line_baseline_from_bottom_mm: Number(local.first_line_baseline_from_bottom_mm),
        font_baseline_offset_mm: Number(local.font_baseline_offset_mm),
        line_gap_mm: Number(local.line_gap_mm),
        font_size_pt: Number(local.font_size_pt),
        font_name: String(local.font_name),
        printer_offset_x_mm: Number(local.printer_offset_x_mm),
        printer_offset_y_mm: Number(local.printer_offset_y_mm),
        page_width_mm: 230,
        page_height_mm: 170,
        phone_on_envelope: Boolean(local.phone_on_envelope),
        phone_render_mode: String(local.phone_render_mode ?? "inline_address"),
      };
      const result = await createEnvelopeAlignmentTest(payload);
      if (result.download_url) {
        downloadFile(result.download_url).catch(() => {
          window.open(getDownloadUrl(result.download_url), '_blank');
        });
        setSuccess(`Đã tạo test căn dòng: ${result.filename} (anchor: X=${result.anchor?.x_mm?.toFixed(1)}mm, Y=${result.anchor?.y_mm?.toFixed(1)}mm)`);
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi tạo test căn dòng');
    } finally {
      setTesting(false);
    }
  };

  const handleCreateAlignmentTest32mm = async () => {
    setTesting(true);
    setError('');
    try {
      const payload = {
        recipient_x_mm: Number(local.recipient_x_mm),
        recipient_width_mm: Number(local.recipient_width_mm),
        first_line_baseline_from_bottom_mm: Number(local.first_line_baseline_from_bottom_mm),
        font_baseline_offset_mm: Number(local.font_baseline_offset_mm),
        line_gap_mm: Number(local.line_gap_mm),
        font_size_pt: Number(local.font_size_pt),
        font_name: String(local.font_name),
        printer_offset_x_mm: Number(local.printer_offset_x_mm),
        printer_offset_y_mm: Number(local.printer_offset_y_mm),
        page_width_mm: 230,
        page_height_mm: 170,
        phone_on_envelope: Boolean(local.phone_on_envelope),
        phone_render_mode: String(local.phone_render_mode ?? "inline_address"),
      };
      const result = await createEnvelopeAlignmentTest32mm(payload);
      if (result.download_url) {
        downloadFile(result.download_url).catch(() => {
          window.open(getDownloadUrl(result.download_url), '_blank');
        });
        const b = result.baseline;
        setSuccess(`Đã tạo test 32mm: ${result.filename} (X=${result.anchor?.x_mm?.toFixed(1)}mm, Y=${result.anchor?.y_mm?.toFixed(1)}mm | baseline từ đáy: ${b?.from_bottom_mm}mm)`);
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi tạo test 32mm');
    } finally {
      setTesting(false);
    }
  };

  const setNum = (key: string, value: number) => setLocal(prev => ({ ...prev, [key]: value }));
  const setStr = (key: string, value: string) => setLocal(prev => ({ ...prev, [key]: value }));

  if (loading) return (
    <div className="flex items-center gap-2 p-8 text-zinc-400">
      <Loader2Icon size={16} className="animate-spin" /> Đang tải...
    </div>
  );
  if (error && !config) return (
    <div className="flex items-center gap-2 p-6 text-red-600">
      <AlertCircleIcon size={16} />{error}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <ContentCard>
        <div className="flex items-center gap-2 text-amber-600 text-sm mb-4">
          <PrinterIcon size={15} />
          <span>Cài đặt in bìa thư — Kích thước 230×170mm (in sẵn dòng chấm)</span>
        </div>
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Khổ bìa thư VCPMC: 230 × 170 mm</strong>
          <div className="mt-1 text-xs">Bìa thư đã in sẵn dòng chấm. App chỉ in chữ người nhận lên đúng vị trí dòng chấm, KHÔNG vẽ thêm khung.</div>
          <div className="mt-1 text-xs italic">Máy in Canon khai báo custom paper theo chiều nạp: Width 170mm, Height 230mm, in Landscape.</div>
        </div>
        {config?.preset_name && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Preset: <strong>{config.preset_name}</strong> | Mode: <strong>{String(local.recipient_render_mode ?? "printed_form_lines")}</strong> | Phone: <strong>{String(local.phone_render_mode ?? "inline_address")}</strong>
          </div>
        )}

        {/* CĂN DÒNG BÌA THƯ IN SẴN */}
        <div className="border-t border-zinc-200 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">
            🎯 Căn dòng bìa thư in sẵn (theo baseline)
          </h3>
          <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            <strong>Căn theo baseline từ đáy bìa thư.</strong>
            <div className="mt-1">Dòng chấm đầu tiên cách đáy <strong>32mm</strong>. Font baseline offset <strong>4mm</strong>.</div>
            <div className="mt-1 font-mono text-xs">
              baseline_y_from_top = 170 − 32 = <strong>138mm</strong> | recipient_start_y = 138 − 4 = <strong>134mm</strong>
            </div>
            <div className="mt-2 font-medium">Hướng dẫn chỉnh (sau khi in test):</div>
            <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
              <li>Chữ in nằm <strong>cao hơn</strong> dòng chấm → <strong>tăng</strong> Y (hoặc tăng baseline offset)</li>
              <li>Chữ in nằm <strong>thấp hơn</strong> dòng chấm → <strong>giảm</strong> Y</li>
              <li>Chữ lệch <strong>trái/phải</strong> → chỉnh X</li>
              <li>Máy in kéo giấy lệch theo từng máy → chỉnh <em>offset máy in X/Y</em> ở dưới.</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Dòng đầu cách đáy (mm)</label>
              <Input
                type="number"
                value={local.first_line_baseline_from_bottom_mm ?? 32}
                onChange={e => setNum('first_line_baseline_from_bottom_mm', parseFloat(e.target.value) || 0)}
                min={0}
                max={170}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Font baseline offset (mm)</label>
              <Input
                type="number"
                value={local.font_baseline_offset_mm ?? 4}
                onChange={e => setNum('font_baseline_offset_mm', parseFloat(e.target.value) || 0)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">X bat dau nguoi nhan (mm)</label>
              <Input
                type="number"
                value={local.recipient_x_mm ?? 130}
                onChange={e => setNum('recipient_x_mm', parseFloat(e.target.value) || 0)}
                min={0}
                max={230}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Y bat dau (mm) — tu tinh: 170 minus baseline minus font_offset</label>
              <Input
                type="number"
                value={local.recipient_start_y_mm ?? 134}
                onChange={e => setNum('recipient_start_y_mm', parseFloat(e.target.value) || 0)}
                min={0}
                max={170}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Khoang cach dong (mm)</label>
              <Input
                type="number"
                value={local.line_gap_mm ?? 8}
                onChange={e => setNum('line_gap_mm', parseFloat(e.target.value) || 0)}
                min={3}
                max={30}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Rong toi da (mm)</label>
              <Input
                type="number"
                value={local.recipient_width_mm ?? 95}
                onChange={e => setNum('recipient_width_mm', parseFloat(e.target.value) || 0)}
                min={40}
                max={230}
                step={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Co chu (pt)</label>
              <Input
                type="number"
                value={local.font_size_pt ?? 13}
                onChange={e => setNum('font_size_pt', parseFloat(e.target.value) || 0)}
                min={8}
                max={20}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Font chu</label>
              <Input
                type="text"
                value={String(local.font_name ?? "Times New Roman")}
                onChange={e => setStr('font_name', e.target.value)}
              />
            </div>
          </div>

          <h4 className="text-sm font-medium text-zinc-700 mt-5 mb-2">Cách in số điện thoại</h4>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(local.phone_on_envelope)}
                onChange={e => setLocal(prev => ({ ...prev, phone_on_envelope: e.target.checked }))}
              />
              <span><strong>In số điện thoại trên bìa thư</strong> (mặc định: TẮT — chỉ in tên + địa chỉ)</span>
            </label>
          </div>
          {Boolean(local.phone_on_envelope) && (
            <div className="flex flex-wrap items-center gap-4 ml-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="phone_render_mode"
                  value="inline_address"
                  checked={String(local.phone_render_mode ?? "inline_address") === "inline_address"}
                  onChange={() => setStr('phone_render_mode', 'inline_address')}
                />
                <span>Gộp vào địa chỉ</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="phone_render_mode"
                  value="separate_line"
                  checked={String(local.phone_render_mode ?? "inline_address") === "separate_line"}
                  onChange={() => setStr('phone_render_mode', 'separate_line')}
                />
                <span>Dòng riêng</span>
              </label>
            </div>
          )}

          <h4 className="text-sm font-medium text-zinc-700 mt-5 mb-2">Bù trừ máy in (chỉ áp dụng khi máy kéo giấy lệch)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Offset máy in X (mm)</label>
              <Input
                type="number"
                value={local.printer_offset_x_mm ?? 0}
                onChange={e => setNum('printer_offset_x_mm', parseFloat(e.target.value) || 0)}
                min={-50}
                max={50}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Offset máy in Y (mm)</label>
              <Input
                type="number"
                value={local.printer_offset_y_mm ?? 0}
                onChange={e => setNum('printer_offset_y_mm', parseFloat(e.target.value) || 0)}
                min={-50}
                max={50}
                step={0.5}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-zinc-100">
          <Button onClick={handleSave} disabled={saving} leftIcon={saving ? <Loader2Icon size={14} className="animate-spin" /> : <CheckCircle2Icon size={14} />}>
            Lưu cấu hình
          </Button>
          <Button variant="secondary" onClick={handleResetVCPMC} leftIcon={<PrinterIcon size={14} />}>
            Khôi phục VCPMC 57×134
          </Button>
          <Button variant="outline" onClick={handleApplyCanonOffset} leftIcon={<PrinterIcon size={14} />}>
            Áp dụng offset Canon
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Button
            variant="primary"
            onClick={handleCreateAlignmentTest32mm}
            disabled={testing}
            leftIcon={testing ? <Loader2Icon size={14} className="animate-spin" /> : <Crosshair size={14} />}
          >
            Tạo test căn dòng 32mm
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateAlignmentTest}
            disabled={testing}
            leftIcon={testing ? <Loader2Icon size={14} className="animate-spin" /> : <Crosshair size={14} />}
          >
            Test căn dòng
          </Button>
          <Button variant="outline" onClick={handleCreateTest230x170} disabled={testing} leftIcon={testing ? <Loader2Icon size={14} className="animate-spin" /> : <FileDownIcon size={14} />}>
            Test 230x170
          </Button>
          <Button variant="outline" onClick={handleCreateTestCanon} disabled={testing} leftIcon={testing ? <Loader2Icon size={14} className="animate-spin" /> : <FileDownIcon size={14} />}>
            Test Canon
          </Button>
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </ContentCard>

      {/* Print Instructions */}
      <ContentCard>
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Hướng dẫn in bìa thư</h3>
        <div className="text-xs text-zinc-600 space-y-2">
          <div className="font-medium text-red-600">⚠ Khi in, phải chọn đúng thông số máy in:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Paper Size:</strong> Custom 230 x 170 mm (hoặc VCPMC_BIA_THU)</li>
            <li><strong>Orientation:</strong> Landscape (Ngang)</li>
            <li><strong>Scale:</strong> 100%</li>
            <li><strong>One-sided</strong></li>
            <li><strong>Paper Source:</strong> Multi-Purpose Tray hoặc khay đang dùng thực tế</li>
          </ul>
          <div className="font-medium text-amber-700 mt-3">Quy trình căn dòng:</div>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Nhấn <strong>"Tạo test căn dòng bìa thư"</strong> → tải file test về.</li>
            <li>In 1 bìa thật → đặt bìa thư lên dòng chấm in sẵn.</li>
            <li>Nếu chữ lệch: chỉnh X/Y theo hướng dẫn ở trên (mục "Căn dòng bìa thư in sẵn").</li>
            <li>Nhấn <strong>"Lưu cấu hình"</strong> → nhấn lại <strong>"Tạo test căn dòng bìa thư"</strong> để kiểm tra.</li>
            <li>Khi đã đúng dòng chấm mới xuất hàng loạt.</li>
          </ol>
        </div>
      </ContentCard>

    </div>
  );
}
