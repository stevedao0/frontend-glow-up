import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { Input } from '../components/app-ui/Input';
import { Tabs } from '../components/app-ui/Tabs';
import { EmptyState } from '../components/app-ui/EmptyState';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import {
  getDispatches,
  getExpiredContracts,
  getEnvelopeLayoutConfig,
  saveEnvelopeLayoutConfig,
  createRenewalBatch,
  generateBatchEnvelope,
  generateBatchEnvelopeCalibration,
  deleteDispatch,
  getDownloadUrl,
  downloadFile,
  getBatches,
  getBatchDetail,
  updateDispatchStatus,
  type DispatchItem,
  type ExpiredContractItem,
  type EnvelopeLayoutConfig,
  type BatchListItem,
  type BatchDetail,
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

export function DispatchesPage({ onNavigate }: { onNavigate: (route: RouteKey) => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('renewal');

  return (
    <Page>
      <PageHeader
        title="Công văn"
        description="Tạo công văn nhắc tái ký và theo dõi phản hồi từ các đơn vị."
        breadcrumb="Nghiệp vụ"
      />

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
      {activeTab === 'new_sign' && <NewSignPlaceholderTab />}
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
        setResult({
          ok: true,
          total: data.total_created,
          batch_no: data.batch_cong_van_no,
          merged: data.merged_download_url,
          envelope: data.envelope_download_url,
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
          <div className="text-xs text-zinc-500 mt-1">Tổng cần xử lý</div>
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
      <ContentCard padded={false}>
        {/* Header row with selection info */}
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3 flex-wrap">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left px-3 py-2.5 w-8"></th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Số HĐ</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Đơn vị</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Bảng hiệu</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Địa chỉ</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Ngày ký</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Ngày hết hạn</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Còn/Hết hạn</th>
                  <th className="text-center px-3 py-2.5 font-medium text-zinc-500 text-xs">Lần gửi</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Số CV gần nhất</th>
                  <th className="text-left px-3 py-2.5 font-medium text-zinc-500 text-xs">Ngày CV</th>
                  <th className="text-center px-3 py-2.5 font-medium text-zinc-500 text-xs">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                  {filtered.map(c => {
                    const isExpired = c.days_expired > 0;
                    return (
                  <tr key={c.contract_id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.contract_id)}
                        onChange={() => toggleOne(c.contract_id)}
                        className="rounded border-zinc-300"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-medium text-zinc-800 whitespace-nowrap">
                      {c.contract_no || '-'}
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-800 max-w-[160px] truncate" title={c.don_vi_ten || ''}>
                      {c.don_vi_ten || '-'}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 text-xs max-w-[120px] truncate" title={c.ten_bang_hieu || ''}>
                      {c.ten_bang_hieu || '-'}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-xs max-w-[180px]">
                      <span className="line-clamp-2" title={c.recipient_address || ''}>
                        {c.recipient_address || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-xs whitespace-nowrap">
                      {c.ngay_ky_hop_dong || '-'}
                    </td>
                    <td className="px-3 py-2 text-zinc-500 text-xs whitespace-nowrap">
                      {c.ngay_het_hieu_luc_hd || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
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
                    <td className="px-3 py-2 text-center">
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
                    <td className="px-3 py-2 font-mono text-xs text-zinc-700 whitespace-nowrap">
                      {c.latest_dispatch_no || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500 whitespace-nowrap">
                      {c.latest_dispatch_date || '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
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
        <div className="flex items-center justify-between px-2">
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBatches({ year: yearFilter, page, page_size: pageSize });
      setBatches(data.rows || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 0);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải danh sách đợt công văn');
    } finally {
      setLoading(false);
    }
  }, [yearFilter, page, pageSize]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Reset page when year changes
  useEffect(() => { setPage(1); }, [yearFilter]);

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

  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    try {
      await updateDispatchStatus(itemId, newStatus);
      if (batchDetail) {
        const updated = await getBatchDetail(expandedBatch!);
        setBatchDetail(updated);
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDownload = (url: string) => {
    if (!url) return;
    downloadFile(url).catch(() => {
      // Fallback: open in new tab
      window.open(getDownloadUrl(url), '_blank');
    });
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

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
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
        <Button variant="ghost" onClick={loadBatches} leftIcon={<RefreshCwIcon size={14} />}>
          Làm mới
        </Button>
      </div>

      {/* Batch Table */}
      <ContentCard padded={false}>
        {loading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-red-600">
            <AlertCircleIcon size={16} />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MailIcon size={32} />}
            title="Chưa có đợt công văn nào"
            description="Tạo công văn từ tab Nguồn cần xử lý."
          />
        ) : (
          <div className="divide-y divide-zinc-50">
            {filtered.map(batch => (
              <div key={batch.id}>
                {/* Batch row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  onClick={() => handleExpandBatch(batch.id)}
                >
                  <span className={`transform transition-transform text-zinc-400 ${expandedBatch === batch.id ? 'rotate-90' : ''}`}>
                    <FileIcon size={14} />
                  </span>
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center text-sm">
                    <div>
                      <div className="font-semibold text-zinc-900">{batch.cong_van_no}</div>
                      <div className="text-xs text-zinc-400">{DISPATCH_TYPE_LABELS[batch.dispatch_type] || batch.dispatch_type}</div>
                    </div>
                    <div className="text-zinc-600">{batch.issue_date}</div>
                    <div className="text-zinc-600">
                      <span className="font-medium">{batch.total_items}</span> đơn vị
                    </div>
                    <div className="text-zinc-600 text-xs truncate" title={batch.note}>{batch.note || '—'}</div>
                    <div className="text-zinc-400 text-xs">{batch.created_by}</div>
                    <div className="flex items-center gap-1 justify-end">
                      {batch.merged_download_url && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(batch.merged_download_url); }}
                          className="p-1.5 rounded hover:bg-zinc-100 text-green-600 transition-colors"
                          title="Tải công văn gộp"
                        >
                          <FileTextIcon size={13} />
                        </button>
                      )}
                      {batch.envelope_download_url && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDownload(batch.envelope_download_url); }}
                          className="p-1.5 rounded hover:bg-zinc-100 text-blue-600 transition-colors"
                          title="Tải bìa thư"
                        >
                          <MailIcon size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded batch detail */}
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
                          <span>Template: <strong>{batchDetail.template_name || 'cong van_tai ky_karaoke.docx'}</strong></span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm bg-white rounded border border-zinc-100">
                            <thead>
                              <tr className="border-b border-zinc-100 bg-zinc-50">
                                <th className="text-left px-3 py-2 font-medium text-zinc-500">Số HĐ</th>
                                <th className="text-left px-3 py-2 font-medium text-zinc-500">Đơn vị</th>
                                <th className="text-left px-3 py-2 font-medium text-zinc-500">Địa chỉ</th>
                                <th className="text-center px-3 py-2 font-medium text-zinc-500">Lần</th>
                                <th className="text-left px-3 py-2 font-medium text-zinc-500">Trạng thái</th>
                                <th className="text-right px-3 py-2 font-medium text-zinc-500">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                              {batchDetail.items.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50/50">
                                  <td className="px-3 py-2 font-mono text-xs">{item.contract_no || '-'}</td>
                                  <td className="px-3 py-2 font-medium text-zinc-800">{item.recipient_unit || '-'}</td>
                                  <td className="px-3 py-2 text-zinc-500 text-xs">{item.recipient_address || '-'}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-xs font-medium ${
                                      item.attempt_no >= 3 ? 'bg-red-100 text-red-700' :
                                      item.attempt_no >= 2 ? 'bg-amber-100 text-amber-700' :
                                      item.attempt_no >= 1 ? 'bg-blue-100 text-blue-700' :
                                      'bg-zinc-100 text-zinc-500'
                                    }`}>
                                      {item.attempt_no || 1}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      value={item.status}
                                      onChange={e => handleUpdateStatus(item.id, e.target.value)}
                                      className="text-xs border border-zinc-200 rounded px-1.5 py-1 bg-white"
                                    >
                                      <option value="draft">Nháp</option>
                                      <option value="processing">Đang theo dõi</option>
                                      <option value="sent">Đã gửi</option>
                                      <option value="closed">Hoàn tất</option>
                                      <option value="cancelled">Hủy</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center justify-end gap-1">
                                      {item.download_url && (
                                        <button
                                          onClick={() => handleDownload(item.download_url)}
                                          className="p-1.5 rounded hover:bg-zinc-100 text-green-600"
                                          title="Tải công văn"
                                        >
                                          <FileTextIcon size={13} />
                                        </button>
                                      )}
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

      {/* Pagination */}
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
    </div>
  );
}

// =============================================================================
// Tab 2: Ký mới — Placeholder (dùng import Excel sau này)
// =============================================================================

function NewSignPlaceholderTab() {
  return (
    <div className="flex flex-col gap-6">
      <ContentCard>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <PlusIcon size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 mb-2">Ký mới</h3>
          <p className="text-sm text-zinc-500 max-w-md mb-4">
            Ký mới dùng danh sách import Excel vì đơn vị mới chưa có hợp đồng trong hệ thống.
          </p>
          <div className="text-xs text-zinc-400 text-left bg-zinc-50 rounded-lg p-4 max-w-lg">
            <div className="font-medium text-zinc-600 mb-2">Dự kiến dữ liệu import:</div>
            <ul className="space-y-1">
              <li>• Tên đơn vị</li>
              <li>• Bảng hiệu</li>
              <li>• Địa chỉ</li>
              <li>• Lĩnh vực</li>
              <li>• Người liên hệ</li>
              <li>• SĐT / Email</li>
              <li>• Ghi chú</li>
            </ul>
            <div className="mt-3 font-medium text-zinc-600">Template dự kiến:</div>
            <div className="text-zinc-500">cong_van_ky_moi_*.docx</div>
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
  return (
    <div className="flex flex-col gap-6">
      <ContentCard>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <AlertCircleIcon size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 mb-2">Theo dõi phản hồi</h3>
          <p className="text-sm text-zinc-500 max-w-md mb-4">
            Theo dõi trạng thái phản hồi từ các đơn vị sau khi đã gửi công văn.
          </p>
          <div className="text-xs text-zinc-400 text-left bg-zinc-50 rounded-lg p-4 max-w-lg">
            <div className="font-medium text-zinc-600 mb-2">Trạng thái theo dõi:</div>
            <ul className="space-y-1">
              <li>• Đang theo dõi</li>
              <li>• Đã phản hồi</li>
              <li>• Đã tái ký</li>
              <li>• Hoàn thành</li>
              <li>• Bỏ qua</li>
              <li>• Hủy</li>
            </ul>
            <div className="mt-3 text-amber-600">
              ⚠ Dữ liệu được lấy từ tab "Đã tạo" và batch đã phát hành.
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}

// =============================================================================
// Tab 5: Cài đặt mẫu & bìa thư
// =============================================================================

function SettingsTab() {
  const [config, setConfig] = useState<EnvelopeLayoutConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [local, setLocal] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEnvelopeLayoutConfig();
      setConfig(data);
      setLocal({
        page_width_mm: data.page_width_mm,
        page_height_mm: data.page_height_mm,
        recipient_box_left_mm: data.recipient_box_left_mm,
        recipient_box_bottom_mm: data.recipient_box_bottom_mm,
        recipient_box_width_mm: data.recipient_box_width_mm,
        recipient_box_height_mm: data.recipient_box_height_mm,
        line_spacing_mm: data.line_spacing_mm,
        printer_offset_x_mm: data.printer_offset_x_mm,
        printer_offset_y_mm: data.printer_offset_y_mm,
      });
    } catch (e: any) {
      setError(e.message || 'Lỗi tải cấu hình');
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
      await saveEnvelopeLayoutConfig({
        page_width_mm: local.page_width_mm,
        page_height_mm: local.page_height_mm,
        recipient_box_left_mm: local.recipient_box_left_mm,
        recipient_box_bottom_mm: local.recipient_box_bottom_mm,
        recipient_box_width_mm: local.recipient_box_width_mm,
        recipient_box_height_mm: local.recipient_box_height_mm,
        line_spacing_mm: local.line_spacing_mm,
        printer_offset_x_mm: local.printer_offset_x_mm,
        printer_offset_y_mm: local.printer_offset_y_mm,
      });
      setSuccess('Đã lưu cấu hình.');
      load();
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: number) => setLocal(prev => ({ ...prev, [key]: value }));

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
          <span>Cài đặt in bìa thư — Kích thước {config?.page_width_mm}×{config?.page_height_mm}mm</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'page_width_mm', label: 'Chiều rộng (mm)', min: 150, max: 300 },
            { key: 'page_height_mm', label: 'Chiều cao (mm)', min: 100, max: 300 },
            { key: 'recipient_box_left_mm', label: 'Tọa độ trái (mm)', min: 0, max: 300 },
            { key: 'recipient_box_bottom_mm', label: 'Tọa độ đáy (mm)', min: 0, max: 200 },
            { key: 'recipient_box_width_mm', label: 'Chiều rộng khung (mm)', min: 40, max: 200 },
            { key: 'recipient_box_height_mm', label: 'Chiều cao khung (mm)', min: 8, max: 100 },
            { key: 'line_spacing_mm', label: 'Khoảng cách dòng (mm)', min: 3, max: 30 },
            { key: 'printer_offset_x_mm', label: 'Bù trừ máy in X (mm)', min: -50, max: 50 },
            { key: 'printer_offset_y_mm', label: 'Bù trừ máy in Y (mm)', min: -50, max: 50 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
              <Input
                type="number"
                value={local[key as keyof typeof local] ?? ''}
                onChange={e => set(key, parseFloat(e.target.value) || 0)}
                min={min}
                max={max}
                step={0.1}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-100">
          <Button onClick={handleSave} disabled={saving} leftIcon={saving ? <Loader2Icon size={14} className="animate-spin" /> : <CheckCircle2Icon size={14} />}>
            Lưu cấu hình
          </Button>
          <Button variant="secondary" onClick={load} leftIcon={<RefreshCwIcon size={14} />}>
            Đặt lại
          </Button>
          {success && <span className="text-sm text-green-600">{success}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </ContentCard>

      <ContentCard>
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Thông số đã resolve</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {config && [
            ['resolved_left_mm', 'Left resolved'],
            ['resolved_bottom_mm', 'Bottom resolved'],
            ['resolved_top_mm', 'Top resolved'],
            ['resolved_width_mm', 'Width resolved'],
            ['resolved_height_mm', 'Height resolved'],
            ['resolved_right_indent_mm', 'Right indent resolved'],
          ].map(([k, label]) => (
            <div key={k} className="flex justify-between px-3 py-2 bg-zinc-50 rounded">
              <span className="text-zinc-500">{label}</span>
              <span className="font-mono font-medium text-zinc-800">{(config as any)[k]}mm</span>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* Template Info */}
      <ContentCard>
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Template công văn đang dùng</h3>
        <div className="text-xs text-zinc-500 space-y-1">
          <div><span className="font-medium text-zinc-700">File:</span> cong van_tai ky_karaoke.docx</div>
          <div><span className="font-medium text-zinc-700">Path:</span> F:\APPs\templates\Background\cong van_tai ky_karaoke.docx</div>
          <div className="mt-2"><span className="font-medium text-zinc-700">Placeholders được hỗ trợ:</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1">
            {['so_cong_van', 'ngay_ky_cong_van', 'thang_ky_cong_van ', 'nam_ky_cong_van', 'TEN_DON_VI', 'so_hop_dong', 'ngay_ky_hop_dong', 'ngay_het_hieu_luc_HD'].map(p => (
              <code key={p} className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">{'{{' + p + '}}'}</code>
            ))}
          </div>
          <div className="mt-2 text-amber-600">
            ⚠ Chỉ thay placeholder. Không tự soạn nội dung.
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
