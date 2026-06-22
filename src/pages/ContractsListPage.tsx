import React, { useEffect, useState } from 'react';
import {
  FilePlusIcon,
  RefreshCwIcon,
  EyeIcon,
  PencilIcon,
  FileDownIcon,
  AwardIcon,
  PrinterIcon,
  Trash2Icon,
  FileTextIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  XIcon,
  LoaderIcon,
} from 'lucide-react';
import { Tabs } from '../components/app-ui/Tabs';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { SearchBox } from '../components/app-ui/SearchBox';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { Checkbox } from '../components/app-ui/Checkbox';
import { RowActionsMenu } from '../components/app-ui/RowActionsMenu';
import { BulkActionBar } from '../components/app-ui/BulkActionBar';
import { Pagination } from '../components/app-ui/Pagination';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import { EmptyState } from '../components/app-ui/EmptyState';
import { Modal } from '../components/app-ui/Modal';
import { RouteKey } from '../data/routes';
import { assignCertificateNumber } from '../lib/certificatesClient';
import {
  ContractRecord,
  getExpiryStatus,
} from '../data/contractRecords';
import {
  CONTRACT_YEAR_OPTIONS,
  LINH_VUC_OPTIONS,
  FIELD_CODE_OPTIONS,
  StatusFilter,
} from '../data/contractOptions';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import {
  ApiContractItem,
  getContracts,
  getContractsSummary,
  exportDocxPreview,
  getCertificateContextDryRun,
  deleteContractCloneOnly,
  type ExportPreviewResult,
  type CertificateContextResult,
  type DeleteContractCloneOnlyResult,
  type ContractsSummaryStats,
} from '../lib/contractsClient';
import { useAuth } from '../lib/auth';
import { TOKEN_KEY } from '../lib/authClient';
import {
  EnterpriseAmountCell,
  EnterpriseContractNoCell,
  EnterprisePage,
} from '../components/enterprise';

/* ──────────────────────────────────────────────────────────── */
/*  Compact display formatter for contract numbers             */
/* ──────────────────────────────────────────────────────────── */
function formatContractNoDisplay(contractNo: string): {
  full: string;
  primary: string;
  suffix: string;
} {
  const value = String(contractNo || '').trim();
  const parts = value.split('/');
  const primary = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : value;
  const rawTail = parts.length >= 3 ? parts.slice(2).join('/') : '';
  const suffix = rawTail.replace(/^(HĐ[A-Z]+-?)/i, '');
  return { full: value, primary, suffix };
}

function toContractRecord(item: ApiContractItem): ContractRecord {
  const contractYearFromNo = (() => {
    const parts = String(item.contract_no || '').split('/');
    if (parts.length < 2) return 0;
    const parsed = Number(parts[1]);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  return {
    id: Number(item.id),
    contract_no: String(item.contract_no || ''),
    contract_year: Number(item.contract_year || contractYearFromNo || 0),
    don_vi_ten: String(item.customer_name || ''),
    ten_bang_hieu: item.ten_bang_hieu || null,
    dia_chi_su_dung: item.dia_chi_su_dung || '',
    linh_vuc_hien_thi: String(item.domain || ''),
    region_code: String(item.region_code || ''),
    field_code: String(item.field_code || ''),
    ngay_lap_hop_dong: String(item.created_at || ''),
    ngay_bat_dau: String(item.start_date || ''),
    ngay_ket_thuc: String(item.end_date || ''),
    so_tien_value: item.so_tien_value ?? null,
    renewal_status: (item.renewal_status as ContractRecord['renewal_status']) ?? null,
    is_renewable: item.is_renewable ?? false,
    loai_hinh_karaoke: item.loai_hinh_karaoke || null,
    tong_so_phong: item.tong_so_phong ?? null,
    tong_so_box: item.tong_so_box ?? null,
    royalty_amount_before_vat: item.royalty_amount_before_vat ?? null,
    vat_rate: item.vat_rate ?? null,
    vat_amount: item.vat_amount ?? null,
    royalty_amount_after_vat: item.royalty_amount_after_vat ?? null,
    music_usage_areas: item.music_usage_areas ?? null,
    gcn_status: item.gcn_status ?? null,
    gcn_certificate_no: item.gcn_certificate_no ?? null,
    gcn_certificate_id: item.gcn_certificate_id ?? null,
  };
}

/* ──────────────────────────────────────────────────────────── */
/*  Density helpers                                            */
/* ──────────────────────────────────────────────────────────── */
type Density = 'compact' | 'mid' | 'detail';

const DENSITY_KEY = 'vcpmc.contractsTableDensity.v1';

const VALID_DENSITIES = new Set<Density>(['compact', 'mid', 'detail']);

function loadDensity(): Density {
  try {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored && VALID_DENSITIES.has(stored as Density)) return stored as Density;
  } catch { /* ignore */ }
  return 'mid'; // safe default per spec
}

function saveDensity(d: Density) {
  try { localStorage.setItem(DENSITY_KEY, d); } catch { /* ignore */ }
}

interface DensityStyle {
  row: string;
  firstCell: string;
  cell: string;
  badgeLine: string;
  // Per-density line-clamp overrides for customer / address cells
  customerLines: string;   // class string for customer name element
  addressLines: string;    // class string for address element
  secondaryLines: string;   // class string for customer secondary element
  // Visual indicator class for density mode
  indicator: string;
}

const DENSITY: Record<Density, DensityStyle> = {
  compact: {
    row: 'h-10',              // 40px - very compact for scanning
    firstCell: 'pl-3 pr-1.5 py-1',
    cell: 'px-2 py-1',
    badgeLine: 'gap-0.5',
    customerLines: 'line-clamp-1',
    addressLines: 'line-clamp-1',
    secondaryLines: 'line-clamp-1',
    indicator: 'border-b-2 border-amber-600', // visual indicator: amber underline
  },
  mid: {
    row: 'h-[58px]',          // 58px — balanced default
    firstCell: 'pl-4 pr-2 py-2',
    cell: 'px-3 py-2',
    badgeLine: 'gap-1',
    customerLines: 'line-clamp-2',
    addressLines: 'line-clamp-2',
    secondaryLines: 'line-clamp-1',
    indicator: '', // no extra indicator for default
  },
  detail: {
    row: 'h-[76px]',          // 76px — noticeably taller for detail review
    firstCell: 'pl-4 pr-2 py-2.5',
    cell: 'px-4 py-2.5',
    badgeLine: 'gap-1.5',
    customerLines: 'line-clamp-2',
    addressLines: 'line-clamp-3',
    secondaryLines: 'line-clamp-2',
    indicator: 'border-b-2 border-emerald-600', // visual indicator: emerald underline
  },
};

/* ──────────────────────────────────────────────────────────── */
/*  Main component                                             */
/* ──────────────────────────────────────────────────────────── */
export function ContractsListPage({
  onNavigate,
  onOpenDetail,
  onPrintCertificate,
  onCreateNew,
  onOpenCreateContract,
}: {
  onNavigate: (k: RouteKey) => void;
  onOpenDetail: (id: number) => void;
  onPrintCertificate?: (contractId: number) => void;
  onCreateNew?: (latestContract: ContractRecord | undefined) => void;
  /**
   * Opens the "Tạo hợp đồng" WorkflowSheet over the current page. If not
   * provided (e.g. legacy shell), the CTA falls back to direct navigation.
   */
  onOpenCreateContract?: () => void;
}) {
  const { currentUser, hasPermission } = useAuth();
  const canEdit = hasPermission('contracts.update');
  const canDelete = hasPermission('contracts.delete');

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [year, setYear] = useState('');
  const [linhVuc, setLinhVuc] = useState('');
  const [status, setStatus] = useState<StatusFilter | ''>('');
  const [fieldCode, setFieldCode] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summaryStats, setSummaryStats] = useState<ContractsSummaryStats | null>(null);
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [reloadTick, setReloadTick] = useState(0);
  // Density toggle (persisted in localStorage)
  const [density, setDensity] = useState<Density>(loadDensity);

  const hasActiveFilter = !!keyword || !!year || !!linhVuc || !!status || !!fieldCode;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = total === 0 ? 0 : Math.min(page * pageSize, total);
  const visibleIds = contracts.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set()); else setSelected(new Set(visibleIds));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearFilters = () => {
    setKeyword(''); setYear(''); setLinhVuc(''); setStatus(''); setFieldCode('');
    setPage(1); setSelected(new Set());
  };
  const triggerRefresh = () => { setReloadTick((v) => v + 1); };

  // --- Row action handlers ---
  const openWordPreview = async (r: ContractRecord) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal({
      contractId: r.id, contractNo: r.contract_no, customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi, action: 'word_preview', loading: true, error: '',
      wordResult: null, gcnResult: null, deleteResult: null,
    });
    try {
      const result = await exportDocxPreview(token, r.id, { include_blocks: true });
      setActionModal((p) => ({ ...p, loading: false, wordResult: result, error: result.ok ? '' : 'Preview that bai' }));
    } catch (err: any) {
      setActionModal((p) => ({ ...p, loading: false, error: String(err?.message || 'Loi khi tao Word preview') }));
    }
  };

  const openGcnContext = async (r: ContractRecord) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal({
      contractId: r.id, contractNo: r.contract_no, customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi, action: 'gcn_context', loading: true, error: '',
      wordResult: null, gcnResult: null, deleteResult: null,
    });
    try {
      const result = await getCertificateContextDryRun(token, r.id);
      setActionModal((p) => ({ ...p, loading: false, gcnResult: result, error: result.ok ? '' : 'Khong lay duoc du lieu GCN' }));
    } catch (err: any) {
      setActionModal((p) => ({ ...p, loading: false, error: String(err?.message || 'Loi khi lay du lieu GCN') }));
    }
  };

  const openDeleteConfirm = (r: ContractRecord) => {
    setActionModal({
      contractId: r.id, contractNo: r.contract_no, customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi, action: 'delete_confirm', loading: false, error: '',
      wordResult: null, gcnResult: null, deleteResult: null,
    });
  };

  const openGcnEdit = (r: ContractRecord) => {
    setGcnEditModal({
      open: true, contractId: r.id, contractNo: r.contract_no,
      certificateId: r.gcn_certificate_id ?? null,
      currentNo: r.gcn_certificate_no ?? '', saving: false, error: '',
    });
  };

  const saveGcnNumber = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const certId = gcnEditModal.certificateId;
    if (!certId) { setGcnEditModal((p) => ({ ...p, error: 'Không tìm thấy bản ghi chứng nhận.' })); return; }
    const newNo = gcnEditModal.currentNo.trim();
    if (!newNo) { setGcnEditModal((p) => ({ ...p, error: 'Số GCN không được để trống.' })); return; }
    setGcnEditModal((p) => ({ ...p, saving: true, error: '' }));
    try {
      const result = await assignCertificateNumber(token, certId, { certificate_no: newNo, allow_duplicate_certificate_no: false });
      if (result.errors && result.errors.length > 0) {
        setGcnEditModal((p) => ({ ...p, saving: false, error: result.errors.map((e: { message: string }) => e.message).join('; ') }));
        return;
      }
      setContracts((prev) => prev.map((c) =>
        c.id === gcnEditModal.contractId ? { ...c, gcn_certificate_no: newNo, gcn_status: result.updated?.status ?? c.gcn_status } : c));
      setGcnEditModal((p) => ({ ...p, open: false }));
    } catch (err: any) {
      setGcnEditModal((p) => ({ ...p, saving: false, error: String(err?.message || 'Lỗi khi lưu số GCN.') }));
    }
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal((p) => ({ ...p, loading: true, error: '' }));
    try {
      const result = await deleteContractCloneOnly(token, actionModal.contractId);
      setActionModal((p) => ({ ...p, loading: false, deleteResult: result, action: 'delete_result', error: result.ok ? '' : result.message }));
      if (result.ok) { setTimeout(() => { closeActionModal(); triggerRefresh(); }, 1500); }
    } catch (err: any) {
      const msg = String(err?.message || 'Loi khi xoa');
      const mode = msg.includes('405') ? 'endpoint_missing' : msg.includes('403') ? 'forbidden' : 'error';
      setActionModal((p) => ({
        ...p, loading: false, action: 'delete_result',
        deleteResult: {
          ok: false, mode, message: msg, write_performed: false,
          contract_id: actionModal.contractId, contract_no: actionModal.contractNo,
          deleted_contract_records: 0, deleted_certificate_records: 0, deleted_related_rows: 0,
          old_db_touched: false, blocked_final_certificates: 0, admin_delete_any_enabled: false,
          permission_used: null, warnings: [], errors: [{ field: mode === 'endpoint_missing' ? 'http' : 'catch', message: msg }],
        },
        error: '',
      }));
    }
  };

  const closeActionModal = () => {
    setActionModal({
      contractId: 0, contractNo: '', customerName: '', domain: '', action: null,
      loading: false, error: '', wordResult: null, gcnResult: null, deleteResult: null,
    });
  };

  // Action modal state
  const [actionModal, setActionModal] = useState<{
    contractId: number; contractNo: string; customerName: string; domain: string;
    action: 'word_preview' | 'gcn_context' | 'delete_confirm' | 'delete_result' | null;
    loading: boolean; error: string;
    wordResult: ExportPreviewResult | null; gcnResult: CertificateContextResult | null; deleteResult: DeleteContractCloneOnlyResult | null;
  }>({
    contractId: 0, contractNo: '', customerName: '', domain: '', action: null,
    loading: false, error: '', wordResult: null, gcnResult: null, deleteResult: null,
  });

  // GCN edit modal state
  const [gcnEditModal, setGcnEditModal] = useState<{
    open: boolean; contractId: number; contractNo: string;
    certificateId: number | null; currentNo: string; saving: boolean; error: string;
  }>({
    open: false, contractId: 0, contractNo: '', certificateId: null, currentNo: '', saving: false, error: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadContracts() {
      setLoading(true); setError('');
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) { throw new Error('Phiên đăng nhập không hợp lệ.'); }
        const data = await getContracts(token, {
          page, page_size: pageSize,
          q: keyword.trim() || undefined,
          domain: (linhVuc || fieldCode || '').trim() || undefined,
          status: status || undefined, year: year || undefined,
        });
        if (cancelled) return;
        setContracts((data.items ?? []).map(toContractRecord));
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
        setSelected((prev) => {
          const allowed = new Set((data.items ?? []).map((x) => Number(x.id)));
          const next = new Set<number>();
          prev.forEach((id) => { if (allowed.has(id)) next.add(id); });
          return next;
        });
      } catch (err: any) {
        if (cancelled) return;
        setContracts([]); setTotal(0); setTotalPages(0);
        setError(String(err?.message || 'Không tải được danh sách hợp đồng.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadContracts();
    return () => { cancelled = true; };
  }, [keyword, year, linhVuc, fieldCode, status, page, pageSize, reloadTick]);

  useEffect(() => {
    let cancelled = false;
    async function loadSummaryStats() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;
        const stats = await getContractsSummary(token);
        if (!cancelled) setSummaryStats(stats);
      } catch { if (!cancelled) setSummaryStats(null); }
    }
    loadSummaryStats();
    return () => { cancelled = true; };
  }, [reloadTick]);

  const DS = DENSITY[density];

  // Summary footer stats
  const footerRoyalty = contracts.reduce((sum, r) => sum + (r.royalty_amount_before_vat ?? 0), 0);
  const footerMissingGcn = contracts.filter((r) => r.gcn_status && r.gcn_status !== 'no_gcn' && !r.gcn_certificate_no).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 mx-auto flex flex-col gap-5 min-h-0 w-full">
      <EnterprisePage>

        {/* ─── COMMAND OS HEADER ─────────────────────────────── */}
        <div className="cos-pageheader">
          <div>
            <div className="cos-pageheader__crumbs">
              <span>Hợp đồng</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>Danh sách</span>
            </div>
            <h1 className="cos-pageheader__title">Quản lý hợp đồng</h1>
            <p className="cos-pageheader__subtitle">
              Background &amp; Karaoke · Phân quyền sử dụng tác phẩm âm nhạc
            </p>
          </div>
          <div className="cos-pageheader__actions">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCwIcon className="h-3.5 w-3.5" />}
              onClick={triggerRefresh}
            >
              Làm mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FilePlusIcon className="h-3.5 w-3.5" />}
              onClick={() => {
                if (onOpenCreateContract) { onOpenCreateContract(); return; }
                if (onCreateNew && contracts.length > 0) onCreateNew(contracts[0]);
                onNavigate('contracts.create');
              }}
            >
              Tạo hợp đồng
            </Button>
          </div>
        </div>

        {/* ─── KPI STAT STRIP ────────────────────────────────── */}
        <div className="cos-statstrip">
          <div className="cos-statstrip__cell">
            <div className="cos-statstrip__label">Tổng hợp đồng</div>
            <div className="cos-statstrip__value">{formatNumber(summaryStats?.totalContracts ?? total ?? 0)}</div>
            <div className="cos-statstrip__delta">trên toàn hệ thống</div>
            <span className="cos-statstrip__spark" aria-hidden />
          </div>
          <div className="cos-statstrip__cell">
            <div className="cos-statstrip__label" style={{ color: '#047857' }}>Còn hiệu lực</div>
            <div className="cos-statstrip__value">{formatNumber(summaryStats?.active ?? 0)}</div>
            <div className="cos-statstrip__delta is-up">đang vận hành</div>
          </div>
          <div className="cos-statstrip__cell">
            <div className="cos-statstrip__label" style={{ color: '#B45309' }}>Cần gia hạn ≤ 30 ngày</div>
            <div className="cos-statstrip__value">{formatNumber(summaryStats?.expiringIn30Days ?? 0)}</div>
            <div className="cos-statstrip__delta">cần xử lý sớm</div>
          </div>
          <div className="cos-statstrip__cell">
            <div className="cos-statstrip__label" style={{ color: '#BE123C' }}>Hết hạn</div>
            <div className="cos-statstrip__value">{formatNumber(summaryStats?.expired ?? 0)}</div>
            <div className="cos-statstrip__delta is-down">ngưng hiệu lực</div>
          </div>
        </div>

        {/* ─── TOOLBAR (command bar) ─────────────────────────── */}
        <div className="cos-toolbar">
          <div className="flex-1 min-w-[240px]">
            <SearchBox
              value={keyword}
              onChange={(v) => { setKeyword(v); setPage(1); }}
              placeholder="Tìm số HĐ, đơn vị, bảng hiệu…"
              size="sm"
            />
          </div>
          <div className="cos-toolbar__sep" />
          <Select size="sm" value={year} onChange={(v) => { setYear(v); setPage(1); }} options={CONTRACT_YEAR_OPTIONS} placeholder="Năm" />
          <Select size="sm" value={linhVuc} onChange={(v) => { setLinhVuc(v); setPage(1); }} options={LINH_VUC_OPTIONS} placeholder="Lĩnh vực" />
          <Select size="sm" value={fieldCode} onChange={(v) => { setFieldCode(v); setPage(1); }} options={FIELD_CODE_OPTIONS} placeholder="Mã quyền" />
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" leftIcon={<XIcon className="h-3.5 w-3.5" />} onClick={clearFilters}>
              Xóa lọc
            </Button>
          )}
          <div className="cos-toolbar__sep" />
          <div className="inline-flex rounded-md ring-1 ring-zinc-200 overflow-hidden text-[11px] shrink-0">
            {(['compact', 'mid', 'detail'] as Density[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDensity(d); saveDensity(d); }}
                className={`px-2 py-1 transition-colors font-medium whitespace-nowrap ${
                  density === d
                    ? 'vc-contracts-density-active'
                    : 'text-zinc-500 bg-white hover:bg-zinc-50 hover:text-zinc-700'
                }`}
                title={d === 'compact' ? 'Gọn' : d === 'mid' ? 'Vừa' : 'Chi tiết'}
              >
                {d === 'compact' ? 'Gọn' : d === 'mid' ? 'Vừa' : 'Chi tiết'}
              </button>
            ))}
          </div>
          <span className="cos-toolbar__hint">
            <kbd>⌘</kbd><kbd>K</kbd> Command
          </span>
        </div>

        {/* ─── TAB STRIP (underline tabs) ────────────────────── */}
        <div>
          <Tabs
            value={tabFilter}
            onChange={(v) => {
              setTabFilter(v as typeof tabFilter);
              if (v === 'all') setStatus('');
              else if (v === 'active') setStatus('active');
              else if (v === 'expiring') setStatus('expiring');
              else if (v === 'expired') setStatus('expired');
              setPage(1);
            }}
            tabs={[
              { value: 'all', label: 'Tất cả', count: summaryStats?.totalContracts ?? undefined },
              { value: 'active', label: 'Còn hiệu lực', count: summaryStats?.active ?? undefined },
              { value: 'expiring', label: 'Cần gia hạn', count: summaryStats?.expiringIn30Days ?? undefined },
              { value: 'expired', label: 'Hết hạn', count: summaryStats?.expired ?? undefined },
            ]}
          />
        </div>

        {/* ─── TABLE WORKSPACE ───────────────────────────────── */}
        <div className="vc-cos-workspace">

          {/* --- Bulk action bar --- */}
          {selected.size > 0 && (
            <BulkActionBar
              count={selected.size}
              onClear={() => setSelected(new Set())}
              actions={[
                {
                  label: 'Tạo GCN hàng loạt',
                  icon: <AwardIcon className="h-3.5 w-3.5" />,
                  onClick: () => onNavigate('contracts.print'),
                  disabled: selected.size === 0,
                },
              ]}
            />
          )}

          {/* --- Table area --- */}
          {loading ? (
            <TableSkeleton rows={8} cols={9} />
          ) : error ? (
            <EmptyState title="Không tải được dữ liệu" description={error}
              action={<Button variant="secondary" size="sm" onClick={triggerRefresh}>Thử lại</Button>}
              icon={<XCircleIcon className="h-5 w-5" />} />
          ) : contracts.length === 0 ? (
            <EmptyState
              title="Không có hợp đồng nào"
              description={hasActiveFilter ? 'Điều chỉnh từ khóa hoặc xóa bộ lọc.' : 'Chưa có hợp đồng trong danh sách.'}
              action={<Button variant="secondary" size="sm" onClick={clearFilters}>Xóa bộ lọc</Button>}
              icon={<FileTextIcon className="h-5 w-5" />}
            />
          ) : (
            <>
              <div className={`vc-contracts-table-scroll vc-density-${density}`}>
                <table className="w-full border-collapse text-sm">
                  {/* Column widths — flexible cols grow, fixed cols stay compact */}
                  <colgroup>
                    <col className="w-9" />                     {/* checkbox */}
                    <col className="vc-col-contract-no" />       {/* Số HĐ: fixed min */}
                    <col className="vc-col-customer" />         {/* Khách hàng: grows 1fr */}
                    <col className="vc-col-address" />          {/* Địa điểm KD: grows 1fr */}
                    <col className="vc-col-domain" />           {/* Lĩnh vực: fixed min */}
                    <col className="vc-col-date" />             {/* Ngày lập: fixed */}
                    <col className="vc-col-expiry" />            {/* Thời hạn: fixed */}
                    <col className="vc-col-amount" />           {/* Tiền: fixed */}
                    <col className="vc-col-status" />           {/* Trạng thái: fixed */}
                    <col className="vc-col-cert" />             {/* Chứng nhận: fixed */}
                    <col className="vc-col-actions" />         {/* actions: fixed 48px */}
                  </colgroup>
                  {/* Header */}
                  <thead className="sticky top-0 z-10">
                    <tr className="vc-table-header-row">
                      <th className={`w-9 ${DS.firstCell} text-left`}>
                        <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} ariaLabel="Chọn tất cả" />
                      </th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Số HĐ</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Khách hàng</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Địa điểm KD</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Lĩnh vực</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Ngày lập</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Thời hạn</th>
                      <th className={`${DS.cell} text-right text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Tiền bản quyền</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Trạng thái</th>
                      <th className={`${DS.cell} text-left text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap`}>Chứng nhận</th>
                      <th className="vc-col-actions pl-1 text-left vc-col-actions-sticky" />
                    </tr>
                  </thead>
                  {/* Body */}
                  <tbody>
                    {contracts.map((r) => {
                      const isSelected = selected.has(r.id);
                      const exp = getExpiryStatus(r.ngay_ket_thuc);

                      return (
                        <tr
                          key={r.id}
                          onClick={() => onOpenDetail(r.id)}
                          className={`${DS.row} cursor-pointer transition-colors vc-table-row ${isSelected ? 'vc-row-selected' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className={`${DS.firstCell} align-top relative`}>
                            {/* Left accent bar */}
                            <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#c89968] via-[#9c6d3e] to-[#0d7a5f] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={isSelected} onChange={() => toggleOne(r.id)} ariaLabel={`Chọn ${r.contract_no}`} />
                            </div>
                          </td>

                          {/* Số HĐ */}
                          <td className={`${DS.cell} align-top pr-4`}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onOpenDetail(r.id); }}
                              title={r.contract_no}
                              className="block text-left"
                            >
                              {(() => {
                                const { primary, suffix, full } = formatContractNoDisplay(r.contract_no);
                                return (
                                  <EnterpriseContractNoCell
                                    primary={primary}
                                    secondary={suffix && suffix !== full ? suffix : undefined}
                                  />
                                );
                              })()}
                            </button>
                          </td>

                          {/* Khách hàng */}
                          <td className={`${DS.cell} align-top`}>
                            <div className={DS.customerLines}>
                              <div className="text-[13px] font-semibold leading-snug text-zinc-800" title={r.ten_bang_hieu || r.don_vi_ten}>
                                {r.ten_bang_hieu || r.don_vi_ten}
                              </div>
                              {r.ten_bang_hieu && r.don_vi_ten ? (
                                <div className={`text-[11.5px] text-zinc-400 leading-snug vc-secondary-text ${DS.secondaryLines}`} title={r.don_vi_ten}>
                                  {r.don_vi_ten}
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Địa điểm KD */}
                          <td className={`${DS.cell} align-top`}>
                            <div className="text-[12px] leading-snug vc-enterprise-subtle">
                              <p
                                className={`text-zinc-400 ${DS.addressLines}`}
                                title={r.dia_chi_su_dung}
                              >
                                {r.dia_chi_su_dung}
                              </p>
                            </div>
                          </td>

                          {/* Lĩnh vực */}
                          <td className={`${DS.cell} align-top pr-4`}>
                            <span className="text-zinc-700 text-[12.5px] font-medium leading-tight">{r.linh_vuc_hien_thi}</span>
                          </td>

                          {/* Ngày lập */}
                          <td className={`${DS.cell} align-top text-zinc-500 tabular-nums text-[12px] font-medium whitespace-nowrap`}>
                            {formatDate(r.ngay_lap_hop_dong)}
                          </td>

                          {/* Thời hạn */}
                          <td className={`${DS.cell} align-top`}>
                            <div className={`tabular-nums text-[12.5px] font-medium leading-snug whitespace-nowrap ${
                              exp.status === 'active' ? 'text-emerald-600' :
                              exp.status === 'expiring' ? 'text-amber-600' :
                              'text-rose-500'
                            }`}>
                              {formatDate(r.ngay_bat_dau)} → {formatDate(r.ngay_ket_thuc)}
                              {exp.status === 'expiring' && <span className="ml-1 font-semibold text-[11px]">({exp.daysLeft}d)</span>}
                            </div>
                          </td>

                          {/* Tiền bản quyền */}
                          <td className={`${DS.cell} align-top text-right tabular-nums text-[13px] font-semibold text-zinc-700 whitespace-nowrap`}>
                            <EnterpriseAmountCell amount={r.royalty_amount_before_vat} />
                          </td>

                          {/* Trạng thái */}
                          <td className={`${DS.cell} align-top pr-4`}>
                            {density === 'compact' ? (
                              <div className={DS.badgeLine}>
                                {exp.status === 'active' && <StatusBadge tone="success" dot compact>Hiệu lực</StatusBadge>}
                                {exp.status === 'expiring' && <StatusBadge tone="warning" dot compact>Sắp hết · {exp.daysLeft}d</StatusBadge>}
                                {exp.status === 'expired' && <StatusBadge tone="danger" dot compact>Hết hạn</StatusBadge>}
                              </div>
                            ) : (
                              <div className={DS.badgeLine}>
                                {exp.status === 'active' && <StatusBadge tone="success" dot>Còn hiệu lực</StatusBadge>}
                                {exp.status === 'expiring' && <StatusBadge tone="warning" dot>Sắp hết · {exp.daysLeft}d</StatusBadge>}
                                {exp.status === 'expired' && <StatusBadge tone="danger" dot>Hết hạn</StatusBadge>}
                              </div>
                            )}
                          </td>

                          {/* Chứng nhận */}
                          <td className={`${DS.cell} align-top pr-4`}>
                            {r.gcn_certificate_id && r.gcn_certificate_no ? (
                              /* Has number */
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title={`GCN số ${r.gcn_certificate_no} — nhấn để in GCN`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPrintCertificate) onPrintCertificate(r.gcn_certificate_id!);
                                    else onNavigate('contracts.print');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300 transition-colors whitespace-nowrap"
                                >
                                  <AwardIcon className="h-3 w-3 text-zinc-500" />
                                  {r.gcn_certificate_no}
                                </button>
                                <button type="button" title="Sửa số GCN" onClick={(e) => { e.stopPropagation(); openGcnEdit(r); }}
                                  className="inline-flex items-center justify-center h-5 w-5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0">
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (r.gcn_certificate_id || (r.gcn_status && r.gcn_status !== 'no_gcn')) && !r.gcn_certificate_no ? (
                              /* Has record, no number */
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-200 whitespace-nowrap">
                                  Chưa cấp số
                                </span>
                                <button type="button" title="Nhập số GCN" onClick={(e) => { e.stopPropagation(); openGcnEdit(r); }}
                                  className="inline-flex items-center justify-center h-5 w-5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0">
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              /* No certificate (Karaoke only) */
                              r.linh_vuc_hien_thi === 'Karaoke' ? (
                                <button
                                  type="button"
                                  title="Tạo GCN cho hợp đồng này"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPrintCertificate) onPrintCertificate(r.id);
                                    else onNavigate('contracts.print');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-700 transition-colors whitespace-nowrap"
                                >
                                  Tạo GCN
                                </button>
                              ) : null
                            )}
                          </td>

                          {/* Actions */}
                          <td className="vc-col-actions pr-4 pl-1 align-top text-right vc-col-actions-sticky">
                            <RowActionsMenu
                              actions={[
                                { label: 'Xem chi tiết', icon: <EyeIcon className="h-4 w-4" />, onClick: () => onOpenDetail(r.id) },
                                { label: 'Chỉnh sửa', icon: <PencilIcon className="h-4 w-4" />, onClick: () => onOpenDetail(r.id), disabled: !canEdit, disabledReason: !canEdit ? 'Không có quyền chỉnh sửa' : undefined },
                                { label: 'Xuất Word', icon: <FileDownIcon className="h-4 w-4" />, onClick: () => openWordPreview(r), disabled: r.linh_vuc_hien_thi !== 'Karaoke', disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined },
                                { label: 'Xem dữ liệu GCN', icon: <AwardIcon className="h-4 w-4" />, onClick: () => openGcnContext(r), disabled: r.linh_vuc_hien_thi !== 'Karaoke', disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined },
                                { label: 'Tạo GCN', icon: <AwardIcon className="h-4 w-4" />, onClick: () => onPrintCertificate ? onPrintCertificate(r.id) : onNavigate('contracts.print'), disabled: r.linh_vuc_hien_thi !== 'Karaoke', disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined },
                                { label: 'In / Gửi', icon: <PrinterIcon className="h-4 w-4" />, onClick: () => onNavigate('contracts.print') },
                                { divider: true, label: 'Xóa', icon: <Trash2Icon className="h-4 w-4" />, tone: 'danger', onClick: () => openDeleteConfirm(r), disabled: !canDelete, disabledReason: !canDelete ? 'Không có quyền xóa' : undefined },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── FOOTER ──────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-zinc-200 bg-white">
                {/* Left: compact stats */}
                <div className="flex items-center gap-3 text-[12px] text-zinc-500">
                  <span>
                    <strong className="text-zinc-700 tabular-nums">{formatNumber(rangeFrom)}–{formatNumber(rangeTo)}</strong>
                    {' / '}
                    <strong className="text-zinc-700 tabular-nums">{formatNumber(total)}</strong>{' hợp đồng'}
                  </span>
                  {footerRoyalty > 0 && (
                    <>
                      <span className="text-zinc-200 select-none">|</span>
                      <span>Tổng: <strong className="text-zinc-700">{footerRoyalty >= 1_000_000_000 ? `${(footerRoyalty / 1_000_000_000).toFixed(2)} tỷ` : `${(footerRoyalty / 1_000_000).toFixed(1)} triệu`}</strong></span>
                    </>
                  )}
                  {footerMissingGcn > 0 && (
                    <>
                      <span className="text-zinc-200 select-none">|</span>
                      <span>Thiếu GCN: <strong className="text-amber-600">{footerMissingGcn}</strong></span>
                    </>
                  )}
                </div>
                {/* Right: pagination */}
                <Pagination
                  page={page}
                  totalPages={Math.max(totalPages, 1)}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                  total={total}
                  rangeFrom={rangeFrom}
                  rangeTo={rangeTo}
                />
              </div>
            </>
          )}
        </div>

        {/* ─── ACTION MODALS ──────────────────────────────────── */}
        {actionModal.action && (
          <Modal
            open
            onClose={closeActionModal}
            title={
              actionModal.action === 'word_preview' ? `Word preview — ${actionModal.contractNo}` :
              actionModal.action === 'gcn_context' ? `Dữ liệu GCN — ${actionModal.contractNo}` :
              actionModal.action === 'delete_confirm' ? `Xác nhận xóa — ${actionModal.contractNo}` :
              actionModal.action === 'delete_result' ? `Kết quả xóa — ${actionModal.contractNo}` :
              `Hành động — ${actionModal.contractNo}`
            }
            size="lg"
          >
            <div className="space-y-4">
              {actionModal.loading && (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <LoaderIcon className="h-5 w-5 animate-spin text-amber-700" />
                  <span className="text-sm text-zinc-600">Đang xử lý...</span>
                </div>
              )}
              {actionModal.error && !actionModal.loading && (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-600/15">
                  <div className="flex items-start gap-2">
                    <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{actionModal.error}</span>
                  </div>
                </div>
              )}

              {actionModal.action === 'word_preview' && actionModal.wordResult && (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.wordResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {actionModal.wordResult.ok ? <CheckCircle2Icon className="h-4 w-4 shrink-0" /> : <XCircleIcon className="h-4 w-4 shrink-0" />}
                    <span className="font-semibold">{actionModal.wordResult.ok ? 'Word preview tạo thành công' : 'Preview thất bại'}</span>
                  </div>
                  {actionModal.wordResult.ok && (
                    <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                      {actionModal.wordResult.preview_path && (
                        <div><span className="text-zinc-500">File:</span> <span className="font-mono break-all">{actionModal.wordResult.preview_path}</span></div>
                      )}
                      {actionModal.wordResult.file_size && (
                        <div><span className="text-zinc-500">Size:</span> <span>{(actionModal.wordResult.file_size / 1024).toFixed(1)} KB</span></div>
                      )}
                      {actionModal.wordResult.warnings?.map((w, i) => <p key={i} className="text-amber-600">- {w}</p>)}
                    </div>
                  )}
                </div>
              )}

              {actionModal.action === 'gcn_context' && actionModal.gcnResult && (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.gcnResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {actionModal.gcnResult.ok ? <CheckCircle2Icon className="h-4 w-4 shrink-0" /> : <XCircleIcon className="h-4 w-4 shrink-0" />}
                    <span className="font-semibold">{actionModal.gcnResult.ok ? 'Dữ liệu GCN sẵn sàng' : 'Không lấy được dữ liệu GCN'}</span>
                  </div>
                  {actionModal.gcnResult.ok && (
                    <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-500">Số HĐ:</span> <span className="font-medium">{actionModal.gcnResult.context.contract_no}</span></div>
                        <div><span className="text-zinc-500">Số GCN:</span> <span className="font-medium">{actionModal.gcnResult.context.certificate_no || '(chưa có)'}</span></div>
                        <div className="col-span-2"><span className="text-zinc-500">Đơn vị:</span> <span className="font-medium">{actionModal.gcnResult.context.organization_name}</span></div>
                        <div className="col-span-2"><span className="text-zinc-500">Địa chỉ:</span> <span className="font-medium">{actionModal.gcnResult.context.address || '(chưa có)'}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {actionModal.action === 'delete_confirm' && !actionModal.loading && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        {currentUser?.role === 'super_admin' ? (
                          <>
                            <p className="font-semibold">Xác nhận xóa vĩnh viễn khỏi DB chính</p>
                            <p className="mt-1 text-xs">Hợp đồng: <strong>{actionModal.contractNo}</strong> · ID: <strong>{actionModal.contractId}</strong></p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">Xác nhận xóa hợp đồng này?</p>
                            <p className="mt-1 text-xs">Hợp đồng: <strong>{actionModal.contractNo}</strong></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={closeActionModal}>Hủy</Button>
                    <Button variant="primary" tone="danger" leftIcon={<Trash2Icon className="h-4 w-4" />} onClick={confirmDelete}>
                      {currentUser?.role === 'super_admin' ? 'Xóa vĩnh viễn' : 'Xác nhận xóa'}
                    </Button>
                  </div>
                </div>
              )}

              {actionModal.action === 'delete_result' && actionModal.deleteResult && (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.deleteResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {actionModal.deleteResult.ok ? <CheckCircle2Icon className="h-4 w-4 shrink-0" /> : <XCircleIcon className="h-4 w-4 shrink-0" />}
                    <span className="font-semibold">{actionModal.deleteResult.ok ? 'Xóa thành công' : 'Xóa thất bại'}</span>
                  </div>
                  {actionModal.deleteResult.ok && (
                    <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-zinc-500">contract_no:</span> <span className="font-medium">{actionModal.deleteResult.contract_no}</span></div>
                        <div><span className="text-zinc-500">mode:</span> <span className="font-medium">{actionModal.deleteResult.mode}</span></div>
                        <div><span className="text-zinc-500">deleted_contract_records:</span> <span className="font-medium">{actionModal.deleteResult.deleted_contract_records}</span></div>
                        <div><span className="text-zinc-500">deleted_certificate_records:</span> <span className="font-medium">{actionModal.deleteResult.deleted_certificate_records}</span></div>
                      </div>
                    </div>
                  )}
                  {!actionModal.deleteResult.ok && (
                    <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                      <p className="font-semibold">Không thể xóa hợp đồng này.</p>
                      <p className="mt-1">{actionModal.deleteResult.message}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-zinc-200">
                <Button variant="secondary" leftIcon={<XIcon className="h-4 w-4" />} onClick={closeActionModal}>Đóng</Button>
              </div>
            </div>
          </Modal>
        )}

        {/* ─── GCN NUMBER EDIT MODAL ─────────────────────────── */}
        <Modal
          open={gcnEditModal.open}
          onClose={() => setGcnEditModal((p) => ({ ...p, open: false }))}
          title={`Sửa số GCN — ${gcnEditModal.contractNo}`}
          description="Nhập số GCN để cập nhật bản ghi chứng nhận hiện có."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setGcnEditModal((p) => ({ ...p, open: false }))} disabled={gcnEditModal.saving}>Hủy</Button>
              <Button variant="primary" onClick={saveGcnNumber} disabled={gcnEditModal.saving}
                leftIcon={gcnEditModal.saving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : undefined}>
                {gcnEditModal.saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {gcnEditModal.error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{gcnEditModal.error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Số GCN <span className="text-rose-500">*</span></label>
              <input
                type="text"
                className="w-full h-9 rounded-lg border border-zinc-300 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400"
                value={gcnEditModal.currentNo}
                onChange={(e) => setGcnEditModal((p) => ({ ...p, currentNo: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !gcnEditModal.saving) saveGcnNumber(); }}
                placeholder="VD: GCN-OTGAN/2024/HCM/00318"
                autoFocus
                disabled={gcnEditModal.saving}
              />
              <p className="mt-1.5 text-xs text-zinc-500">Cập nhật số chứng nhận cho hợp đồng hiện có. Không tạo bản ghi mới.</p>
            </div>
          </div>
        </Modal>

      </EnterprisePage>
    </div>
  );
}
