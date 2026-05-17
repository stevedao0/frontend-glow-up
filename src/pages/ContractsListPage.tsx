import React, { useEffect, useState } from 'react';
import {
  FilePlusIcon,
  FileSpreadsheetIcon,
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
  WalletIcon,
  CalendarRangeIcon,
  XIcon,
  LoaderIcon,
} from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { MetricStrip } from '../components/app-ui/MetricCard';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { SearchBox } from '../components/app-ui/SearchBox';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { Checkbox } from '../components/app-ui/Checkbox';
import { RowActionsMenu } from '../components/app-ui/RowActionsMenu';
import { FilterBar, FilterField } from '../components/app-ui/FilterBar';
import { BulkActionBar } from '../components/app-ui/BulkActionBar';
import { Pagination } from '../components/app-ui/Pagination';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import { EmptyState } from '../components/app-ui/EmptyState';
import { SummaryHero } from '../components/app-ui/SummaryHero';
import { Modal } from '../components/app-ui/Modal';
import { RouteKey } from '../data/routes';
import {
  ContractRecord,
  getExpiryStatus,
  RENEWAL_LABEL } from
'../data/contractRecords';
import {
  CONTRACT_YEAR_OPTIONS,
  LINH_VUC_OPTIONS,
  STATUS_OPTIONS,
  FIELD_CODE_OPTIONS,
  BACKGROUND_OPS_SUMMARY,
  StatusFilter } from
'../data/contractOptions';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import {
  ApiContractItem,
  getContracts,
  exportDocxPreview,
  getCertificateContextDryRun,
  deleteContractCloneOnly,
  type ExportPreviewResult,
  type CertificateContextResult,
  type DeleteContractCloneOnlyResult,
} from '../lib/contractsClient';
import { useAuth } from '../lib/auth';
import { TOKEN_KEY } from '../lib/authClient';

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
    tong_so_box: item.tong_so_box ?? null
  };
}
export function ContractsListPage({
  onNavigate,
  onOpenDetail,
  onPrintCertificate,
  onCreateNew,
}: {
  onNavigate: (k: RouteKey) => void;
  onOpenDetail: (id: number) => void;
  onPrintCertificate?: (contractId: number) => void;
  /** Callback when user clicks "Tạo hợp đồng mới" - receives the latest contract for pre-populating */
  onCreateNew?: (latestContract: ContractRecord | undefined) => void;
}) {
  // Auth
  const { currentUser, hasPermission } = useAuth();
  const canEdit = hasPermission('contracts.update');
  const canDelete = hasPermission('contracts.delete');

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [year, setYear] = useState('');
  const [linhVuc, setLinhVuc] = useState('');
  const [status, setStatus] = useState<StatusFilter | ''>('');
  const [fieldCode, setFieldCode] = useState('');
  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [reloadTick, setReloadTick] = useState(0);

  // Action modal state (Xuất Word / Xem dữ liệu GCN / Xóa)
  const [actionModal, setActionModal] = useState<{
    contractId: number;
    contractNo: string;
    customerName: string;
    domain: string;
    action: 'word_preview' | 'gcn_context' | 'delete_confirm' | 'delete_result' | null;
    loading: boolean;
    error: string;
    wordResult: ExportPreviewResult | null;
    gcnResult: CertificateContextResult | null;
    deleteResult: DeleteContractCloneOnlyResult | null;
  }>({
    contractId: 0,
    contractNo: '',
    customerName: '',
    domain: '',
    action: null,
    loading: false,
    error: '',
    wordResult: null,
    gcnResult: null,
    deleteResult: null,
  });
  const hasActiveFilter =
  !!keyword || !!year || !!linhVuc || !!status || !!fieldCode;
  const totalRows = contracts.length;
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = total === 0 ? 0 : Math.min(page * pageSize, total);
  const visibleIds = contracts.map((r) => r.id);
  const allSelected =
  visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());else
    setSelected(new Set(visibleIds));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };
  const clearFilters = () => {
    setKeyword('');
    setYear('');
    setLinhVuc('');
    setStatus('');
    setFieldCode('');
    setPage(1);
    setSelected(new Set());
  };
  const triggerRefresh = () => {
    setReloadTick((v) => v + 1);
  };

  // --- Row action handlers ---
  const openWordPreview = async (r: ContractRecord) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal({
      contractId: r.id,
      contractNo: r.contract_no,
      customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi,
      action: 'word_preview',
      loading: true,
      error: '',
      wordResult: null,
      gcnResult: null,
      deleteResult: null,
    });
    try {
      const result = await exportDocxPreview(token, r.id, { include_blocks: true });
      setActionModal((prev) => ({ ...prev, loading: false, wordResult: result, error: result.ok ? '' : 'Preview that bai' }));
    } catch (err: any) {
      setActionModal((prev) => ({ ...prev, loading: false, error: String(err?.message || 'Loi khi tao Word preview') }));
    }
  };

  const openGcnContext = async (r: ContractRecord) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal({
      contractId: r.id,
      contractNo: r.contract_no,
      customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi,
      action: 'gcn_context',
      loading: true,
      error: '',
      wordResult: null,
      gcnResult: null,
      deleteResult: null,
    });
    try {
      const result = await getCertificateContextDryRun(token, r.id);
      setActionModal((prev) => ({ ...prev, loading: false, gcnResult: result, error: result.ok ? '' : 'Khong lay duoc du lieu GCN' }));
    } catch (err: any) {
      setActionModal((prev) => ({ ...prev, loading: false, error: String(err?.message || 'Loi khi lay du lieu GCN') }));
    }
  };

  const openDeleteConfirm = (r: ContractRecord) => {
    setActionModal({
      contractId: r.id,
      contractNo: r.contract_no,
      customerName: r.don_vi_ten,
      domain: r.linh_vuc_hien_thi,
      action: 'delete_confirm',
      loading: false,
      error: '',
      wordResult: null,
      gcnResult: null,
      deleteResult: null,
    });
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActionModal((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await deleteContractCloneOnly(token, actionModal.contractId);
      setActionModal((prev) => ({ ...prev, loading: false, deleteResult: result, action: 'delete_result', error: result.ok ? '' : result.message }));
      // Auto reload list after successful delete
      if (result.ok) {
        setTimeout(() => {
          closeActionModal();
          triggerRefresh();
        }, 1500);
      }
    } catch (err: any) {
      const msg = String(err?.message || 'Loi khi xoa');
      if (msg.includes('405') || msg.toLowerCase().includes('method not allowed')) {
        setActionModal((prev) => ({
          ...prev,
          loading: false,
          action: 'delete_result',
          deleteResult: {
            ok: false,
            mode: 'endpoint_missing',
            message: 'Backend chua co DELETE endpoint dung path/method. Endpoint: DELETE /api/contracts/{id}',
            write_performed: false,
            contract_id: actionModal.contractId,
            contract_no: actionModal.contractNo,
            deleted_contract_records: 0,
            deleted_certificate_records: 0,
            deleted_related_rows: 0,
            old_db_touched: false,
            blocked_final_certificates: 0,
            admin_delete_any_enabled: false,
            permission_used: null,
            warnings: [],
            errors: [{ field: 'http', message: '405 Method Not Allowed' }],
          },
          error: '',
        }));
      } else if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('flag off')) {
        setActionModal((prev) => ({
          ...prev,
          loading: false,
          action: 'delete_result',
          deleteResult: {
            ok: false,
            mode: 'forbidden',
            message: 'Chua bat DELETE_CONTRACT_MAIN_DB_ENABLED. Khong the xoa du lieu tren DB chinh.',
            write_performed: false,
            contract_id: actionModal.contractId,
            contract_no: actionModal.contractNo,
            deleted_contract_records: 0,
            deleted_certificate_records: 0,
            deleted_related_rows: 0,
            old_db_touched: false,
            blocked_final_certificates: 0,
            admin_delete_any_enabled: false,
            permission_used: null,
            warnings: [],
            errors: [{ field: 'permission', message: '403 Forbidden / Flag disabled' }],
          },
          error: '',
        }));
      } else {
        setActionModal((prev) => ({
          ...prev,
          loading: false,
          action: 'delete_result',
          deleteResult: {
            ok: false,
            mode: 'error',
            message: msg,
            write_performed: false,
            contract_id: actionModal.contractId,
            contract_no: actionModal.contractNo,
            deleted_contract_records: 0,
            deleted_certificate_records: 0,
            deleted_related_rows: 0,
            old_db_touched: false,
            blocked_final_certificates: 0,
            admin_delete_any_enabled: false,
            permission_used: null,
            warnings: [],
            errors: [{ field: 'catch', message: msg }],
          },
          error: '',
        }));
      }
    }
  };

  const isSafeTestRecord = (r: ContractRecord) => {
    const prefix = ['CLONE-NEWAPP-', 'TEST-NEWAPP-', 'MAKE-HD-', 'OLDAPP-DIRECT-', 'OLDAPP-FLOW-', 'UI-WORD-FALLBACK-', 'SMOKE-', 'MAKE-HD-SMOKE-', 'UI-TEST-', 'DELETE-TEST-'];
    return prefix.some(p => r.contract_no.toUpperCase().startsWith(p));
  };

  const closeActionModal = () => {
    setActionModal({
      contractId: 0,
      contractNo: '',
      customerName: '',
      domain: '',
      action: null,
      loading: false,
      error: '',
      wordResult: null,
      gcnResult: null,
      deleteResult: null,
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadContracts() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        }
        const data = await getContracts(token, {
          page,
          page_size: pageSize,
          q: keyword.trim() || undefined,
          domain: (linhVuc || fieldCode || '').trim() || undefined,
          status: status || undefined,
          year: year || undefined
        });
        if (cancelled) return;
        setContracts(data.items.map(toContractRecord));
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 0);
        setSelected((prev) => {
          const allowed = new Set(data.items.map((x) => Number(x.id)));
          const next = new Set<number>();
          prev.forEach((id) => {
            if (allowed.has(id)) next.add(id);
          });
          return next;
        });
      } catch (err: any) {
        if (cancelled) return;
        setContracts([]);
        setTotal(0);
        setTotalPages(0);
        setError(String(err?.message || 'Không tải được danh sách hợp đồng.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadContracts();
    return () => {
      cancelled = true;
    };
  }, [keyword, year, linhVuc, fieldCode, status, page, pageSize, reloadTick]);
  return (
    <Page>
      <PageHeader
        breadcrumb="/bg/contracts"
        title="Danh sách hợp đồng"
        description="Quản lý hợp đồng Background/Karaoke đã ký, bản nháp và trạng thái hiệu lực."
        actions={
        <>
            <Button
            variant="secondary"
            leftIcon={<RefreshCwIcon className="h-4 w-4" />}
            onClick={triggerRefresh}>
            
              Làm mới
            </Button>
            <Button
            variant="secondary"
            leftIcon={<FileSpreadsheetIcon className="h-4 w-4" />}
            onClick={() => {}}
            title="Chua trien khai xuat Excel"
            disabled>

              Xuất Excel
            </Button>
            <Button
            variant="primary"
            leftIcon={<FilePlusIcon className="h-4 w-4" />}
            onClick={() => {
              // Pass the first (newest) contract to pre-populate the create form
              if (onCreateNew && contracts.length > 0) {
                onCreateNew(contracts[0]);
              }
              onNavigate('contracts.create');
            }}>
            
              Tạo hợp đồng mới
            </Button>
          </>
        } />
      

      <SummaryHero
        label="Operations Summary · Background"
        title="Tình trạng vận hành toàn bộ workspace"
        description="Số liệu tổng hợp hợp đồng Background đến thời điểm hiện tại."
        stats={[
        {
          label: 'Tổng hợp đồng BG',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.totalBackground),
          tone: 'indigo'
        },
        {
          label: 'Còn hiệu lực',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.active),
          tone: 'emerald'
        },
        {
          label: 'Sắp hết 30 ngày',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.expiringIn30Days),
          tone: 'amber'
        },
        {
          label: 'Hết hạn',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.expired),
          tone: 'rose'
        },
        {
          label: 'Chờ tái ký',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.pendingRenewal),
          tone: 'violet'
        }]
        } />
      

      <MetricStrip
        items={[
        {
          label: 'Tổng hợp đồng',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.totalBackground),
          tone: 'indigo',
          icon: <FileTextIcon className="h-4 w-4" />,
          hint: 'Tất cả thời kỳ'
        },
        {
          label: 'Hợp đồng 2026',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.contracts2026),
          tone: 'violet',
          icon: <CalendarRangeIcon className="h-4 w-4" />,
          delta: {
            value: 'Năm hiện tại',
            tone: 'flat'
          }
        },
        {
          label: 'Còn hiệu lực',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.active),
          tone: 'emerald',
          icon: <CheckCircle2Icon className="h-4 w-4" />,
          hint: '3,6% tổng số'
        },
        {
          label: 'Sắp hết 30 ngày',
          value: formatNumber(BACKGROUND_OPS_SUMMARY.expiringIn30Days),
          tone: 'amber',
          icon: <AlertTriangleIcon className="h-4 w-4" />,
          hint: 'Cần xử lý sớm'
        },
        {
          label: 'Doanh thu 2026',
          value: '1,075 tỷ',
          tone: 'cyan',
          icon: <WalletIcon className="h-4 w-4" />,
          delta: {
            value: 'Lũy kế năm',
            tone: 'flat'
          }
        }]
        } />
      

      <FilterBar
        hasActive={hasActiveFilter}
        onClear={clearFilters}
        error={error}
        resultSummary={
          error ? undefined : (
            <span>
              Hiển thị{' '}
              <span className="font-semibold text-zinc-900 tabular-nums">
                {rangeFrom}–{rangeTo}
              </span>{' '}
              trong{' '}
              <span className="font-semibold text-zinc-900 tabular-nums">
                {formatNumber(total)}
              </span>{' '}
              hợp đồng
            </span>
          )
        }>
        
        <FilterField label="Tìm kiếm" width="flex-1 min-w-[260px]">
          <SearchBox
            value={keyword}
            onChange={(v) => {
              setKeyword(v);
              setPage(1);
            }}
            placeholder="Tìm số hợp đồng, đơn vị, bảng hiệu, địa chỉ…" />
          
        </FilterField>
        <FilterField label="Năm" width="w-32">
          <Select
            value={year}
            onChange={(v) => {
              setYear(v);
              setPage(1);
            }}
            options={CONTRACT_YEAR_OPTIONS}
            placeholder="Tất cả" />
          
        </FilterField>
        <FilterField label="Lĩnh vực" width="w-44">
          <Select
            value={linhVuc}
            onChange={(v) => {
              setLinhVuc(v);
              setPage(1);
            }}
            options={LINH_VUC_OPTIONS}
            placeholder="Tất cả" />
          
        </FilterField>
        <FilterField label="Trạng thái" width="w-44">
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v as StatusFilter | '');
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Tất cả" />
          
        </FilterField>
        <FilterField label="Mã quyền" width="w-40">
          <Select
            value={fieldCode}
            onChange={(v) => {
              setFieldCode(v);
              setPage(1);
            }}
            options={FIELD_CODE_OPTIONS}
            placeholder="Tất cả" />
          
        </FilterField>
      </FilterBar>

      <ContentCard padded={false}>
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
          {
            label: 'Xuất Excel',
            icon: <FileSpreadsheetIcon className="h-3.5 w-3.5" />,
            onClick: () => {},
            disabled: true,
            disabledReason: 'Chưa triển khai xuất Excel',
          },
          {
            label: 'Tạo GCN hàng loạt',
            icon: <AwardIcon className="h-3.5 w-3.5" />,
            onClick: () => onNavigate('contracts.print'),
            disabled: selected.size === 0,
            disabledReason: selected.size === 0 ? 'Chọn ít nhất 1 hợp đồng Karaoke' : undefined,
          }]
          } />
        

        {loading ?
        <TableSkeleton rows={8} cols={6} /> :
        error ?
        <EmptyState
          title="Khong tai duoc du lieu hop dong"
          description={error}
          action={
          <Button variant="secondary" onClick={triggerRefresh}>
                Thu lai
              </Button>
          }
          icon={<XCircleIcon className="h-5 w-5" />} /> :
        contracts.length === 0 ?
        <EmptyState
          title="Khong co du lieu hop dong"
          description={
          hasActiveFilter ?
          "Thu dieu chinh tu khoa hoac xoa bo loc de xem lai danh sach." :
          "Khong co du lieu hop dong theo quyen linh vuc cua tai khoan nay."
          }
          action={
          <Button variant="secondary" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
          }
          icon={<XCircleIcon className="h-5 w-5" />} /> :


        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-amber-50/40 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
                  <th className="w-10 pl-5 pr-2 py-3.5">
                    <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    ariaLabel="Chọn tất cả" />
                  
                  </th>
                  <Th>Số hợp đồng</Th>
                  <Th>Đơn vị / Bảng hiệu</Th>
                  <Th>Địa chỉ sử dụng</Th>
                  <Th>Lĩnh vực</Th>
                  <Th>Ngày lập</Th>
                  <Th>Hiệu lực</Th>
                  <Th align="right">Giá trị</Th>
                  <Th>Trạng thái</Th>
                  <th className="w-10 pr-3" />
                </tr>
              </thead>
              <tbody>
                {contracts.map((r) => {
                const isSelected = selected.has(r.id);
                const exp = getExpiryStatus(r.ngay_ket_thuc);
                const renewalKey = r.renewal_status ?? 'UNKNOWN';
                const renewalTone =
                renewalKey === 'NEW' ?
                'violet' :
                renewalKey === 'PENDING_RENEWAL' ?
                'orange' :
                renewalKey === 'RENEWED' ?
                'success' :
                'neutral';
                return (
                  <tr
                    key={r.id}
                    onClick={() => onOpenDetail(r.id)}
                    className={`group/row relative border-b border-zinc-100 last:border-0 transition-all cursor-pointer ${isSelected ? 'bg-amber-50/60 hover:bg-amber-50/80' : 'hover:bg-amber-50/40 hover:shadow-[inset_0_1px_0_rgba(99,102,241,0.06),inset_0_-1px_0_rgba(99,102,241,0.06)]'}`}>
                    
                      {/* Selection cell + left bar */}
                      <td className="relative pl-5 pr-2 py-3.5 align-top">
                        <span
                        aria-hidden
                        className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-500 to-amber-500 transition-opacity ${isSelected ? 'opacity-100 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'opacity-0 group-hover/row:opacity-90'}`} />
                      
                        <Checkbox
                        checked={isSelected}
                        onChange={() => toggleOne(r.id)}
                        ariaLabel={`Chọn ${r.contract_no}`} />
                      
                      </td>

                      {/* Contract no — link style */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail(r.id);
                        }}
                        className="font-mono text-[13px] font-semibold text-amber-800 hover:text-amber-950 group-hover/row:underline underline-offset-[3px] decoration-amber-300/70 decoration-1 transition-colors tracking-tight">
                        
                          {r.contract_no}
                        </button>
                      </td>

                      {/* Đơn vị + bảng hiệu */}
                      <td className="px-4 py-3.5 align-top max-w-[280px]">
                        <p
                        className="text-[14px] font-semibold text-zinc-900 leading-snug line-clamp-2"
                        title={r.don_vi_ten}>
                        
                          {r.don_vi_ten}
                        </p>
                        {r.ten_bang_hieu &&
                      <p
                        className="mt-0.5 text-[12px] text-zinc-500 truncate"
                        title={r.ten_bang_hieu}>
                        
                            {r.ten_bang_hieu}
                          </p>
                      }
                      </td>

                      {/* Địa chỉ */}
                      <td className="px-4 py-3.5 align-top max-w-[260px]">
                        <p
                        className="text-[12.5px] text-zinc-600 leading-snug line-clamp-2"
                        title={r.dia_chi_su_dung}>
                        
                          {r.dia_chi_su_dung}
                        </p>
                      </td>

                      {/* Lĩnh vực */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-700 text-[13px] font-medium">
                            {r.linh_vuc_hien_thi}
                          </span>
                          {r.loai_hinh_karaoke &&
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-medium bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-900/5 self-start">
                              {r.loai_hinh_karaoke}
                              {r.tong_so_phong != null &&
                          <>
                                  <span className="text-zinc-400">·</span>
                                  <span className="tabular-nums font-semibold">
                                    {r.tong_so_phong} phòng
                                  </span>
                                </>
                          }
                            </span>
                        }
                        </div>
                      </td>

                      {/* Ngày lập */}
                      <td className="px-4 py-3.5 align-top text-zinc-700 tabular-nums whitespace-nowrap text-[13px]">
                        {formatDate(r.ngay_lap_hop_dong)}
                      </td>

                      {/* Hiệu lực */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <p className="text-zinc-700 tabular-nums text-[13px]">
                          {formatDate(r.ngay_bat_dau)}
                        </p>
                        <p className="text-zinc-500 tabular-nums text-[12px]">
                          → {formatDate(r.ngay_ket_thuc)}
                        </p>
                        {exp.status === 'expiring' &&
                      <span className="inline-flex mt-1">
                            <StatusBadge tone="warning" dot>
                              Sắp hết · {exp.daysLeft}d
                            </StatusBadge>
                          </span>
                      }
                      </td>

                      {/* Giá trị */}
                      <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap">
                        {r.so_tien_value == null ?
                      <span className="text-zinc-400 italic text-xs">
                            Chưa có
                          </span> :
                      r.so_tien_value === 0 ?
                      <span className="text-zinc-500 text-xs">
                            Chưa tính
                          </span> :

                      <span className="font-semibold text-zinc-900 text-[13px]">
                            {formatCurrency(r.so_tien_value)}
                          </span>
                      }
                      </td>

                      {/* Trạng thái — 2 badges stacked */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          {exp.status === 'active' &&
                        <StatusBadge tone="success" dot>
                              Còn hiệu lực
                            </StatusBadge>
                        }
                          {exp.status === 'expiring' &&
                        <StatusBadge tone="warning" dot>
                              Sắp hết hạn
                            </StatusBadge>
                        }
                          {exp.status === 'expired' &&
                        <StatusBadge tone="danger" dot>
                              Hết hạn
                            </StatusBadge>
                        }
                          <StatusBadge tone={renewalTone}>
                            {RENEWAL_LABEL[renewalKey]}
                          </StatusBadge>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="pr-3 pl-1 align-top text-right">
                        <RowActionsMenu
                        actions={[
                        {
                          label: 'Xem chi tiết',
                          icon: <EyeIcon className="h-4 w-4" />,
                          onClick: () => onOpenDetail(r.id)
                        },
                        {
                          label: 'Chỉnh sửa',
                          icon: <PencilIcon className="h-4 w-4" />,
                          onClick: () => onOpenDetail(r.id),
                          disabled: !canEdit,
                          disabledReason: !canEdit ? 'Không có quyền chỉnh sửa' : undefined,
                        },
                        {
                          label: 'Xuất Word',
                          icon: <FileDownIcon className="h-4 w-4" />,
                          onClick: () => openWordPreview(r),
                          disabled: r.linh_vuc_hien_thi !== 'Karaoke',
                          disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined,
                        },
                        {
                          label: 'Xem dữ liệu GCN',
                          icon: <AwardIcon className="h-4 w-4" />,
                          onClick: () => openGcnContext(r),
                          disabled: r.linh_vuc_hien_thi !== 'Karaoke',
                          disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined,
                        },
                        {
                          label: 'Tạo GCN',
                          icon: <AwardIcon className="h-4 w-4" />,
                          onClick: () => onPrintCertificate ? onPrintCertificate(r.id) : onNavigate('contracts.print'),
                          disabled: r.linh_vuc_hien_thi !== 'Karaoke',
                          disabledReason: r.linh_vuc_hien_thi !== 'Karaoke' ? 'Chỉ hỗ trợ Karaoke' : undefined,
                        },
                        {
                          label: 'In / Gui',
                          icon: <PrinterIcon className="h-4 w-4" />,
                          onClick: () => onNavigate('contracts.print'),
                        },
                        {
                          divider: true,
                          label: 'Xóa',
                          icon: <Trash2Icon className="h-4 w-4" />,
                          tone: 'danger',
                          onClick: () => openDeleteConfirm(r),
                          disabled: !canDelete,
                          disabledReason: !canDelete ? 'Không có quyền xóa' : undefined,
                        }]
                        } />
                      
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        }

        {!loading && contracts.length > 0 &&
        <Pagination
          page={page}
          totalPages={Math.max(totalPages, 1)}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          total={total}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo} />

        }
      </ContentCard>

      {/* ============================================================ */}
      {/* ACTION MODAL (Xuất Word / Xem dữ liệu GCN / Xóa) */}
      {/* ============================================================ */}
      {actionModal.action && (
        <Modal
          open
          onClose={closeActionModal}
          title={
            actionModal.action === 'word_preview'
              ? `Word preview — ${actionModal.contractNo}`
              : actionModal.action === 'gcn_context'
              ? `Dữ liệu GCN — ${actionModal.contractNo}`
              : actionModal.action === 'delete_confirm'
              ? `Xác nhận xóa — ${actionModal.contractNo}`
              : actionModal.action === 'delete_result'
              ? `Kết quả xóa — ${actionModal.contractNo}`
              : `Hành động — ${actionModal.contractNo}`
          }
          size="lg"
        >
          <div className="space-y-4">

            {/* Loading */}
            {actionModal.loading && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <LoaderIcon className="h-5 w-5 animate-spin text-amber-700" />
                <span className="text-sm text-zinc-600">Đang xử lý...</span>
              </div>
            )}

            {/* Error */}
            {actionModal.error && !actionModal.loading && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-600/15">
                <div className="flex items-start gap-2">
                  <XCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{actionModal.error}</span>
                </div>
              </div>
            )}

            {/* Word Preview Result */}
            {actionModal.action === 'word_preview' && actionModal.wordResult && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.wordResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {actionModal.wordResult.ok ? (
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {actionModal.wordResult.ok
                      ? 'Word preview tạo thành công'
                      : 'Preview thất bại hoặc domain không được hỗ trợ'}
                  </span>
                </div>

                {actionModal.wordResult.ok && (
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                    {actionModal.wordResult.preview_path && (
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 shrink-0">File:</span>
                        <span className="font-mono font-medium text-zinc-800 break-all"
                          title={actionModal.wordResult.preview_path || ''}>
                          {actionModal.wordResult.preview_path}
                        </span>
                      </div>
                    )}
                    {actionModal.wordResult.file_size && (
                      <div>
                        <span className="text-zinc-500">Size:</span>{' '}
                        <span className="font-medium">{(actionModal.wordResult.file_size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                    {actionModal.wordResult.domain_label && (
                      <div>
                        <span className="text-zinc-500">Domain:</span>{' '}
                        <span className="font-medium">{actionModal.wordResult.domain_label}</span>
                      </div>
                    )}

                    <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                      <div>
                        <span className="text-zinc-500">db_write:</span>{' '}
                        <span className={actionModal.wordResult.db_write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.wordResult.db_write_performed ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">docx_path attach:</span>{' '}
                        <span className={actionModal.wordResult.docx_path_attached ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.wordResult.docx_path_attached ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">official_export:</span>{' '}
                        <span className={actionModal.wordResult.official_export ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.wordResult.official_export ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                    </div>

                    {actionModal.wordResult.warnings && actionModal.wordResult.warnings.length > 0 && (
                      <div className="border-t border-zinc-200 pt-2 mt-2">
                        <span className="text-zinc-500">Warnings:</span>
                        <div className="mt-1 space-y-0.5">
                          {actionModal.wordResult.warnings.map((w, i) => (
                            <p key={i} className="text-amber-600">- {w}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GCN Context Result */}
            {actionModal.action === 'gcn_context' && actionModal.gcnResult && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.gcnResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {actionModal.gcnResult.ok ? (
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {actionModal.gcnResult.ok
                      ? 'Dữ liệu GCN sẵn sàng'
                      : 'Không lấy được dữ liệu GCN'}
                  </span>
                </div>

                {actionModal.gcnResult.ok && (
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div>
                        <span className="text-zinc-500">Số HĐ:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.contract_no}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Số GCN:</span>{' '}
                        <span className="font-medium">
                          {actionModal.gcnResult.context.certificate_no || '(chưa có)'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Tên đơn vị:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.organization_name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Địa chỉ:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.address || '(chưa có)'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Địa điểm kinh doanh:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.business_location || '(chưa có)'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Hiệu lực từ:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.effective_from || '(chưa có)'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Hiệu lực đến:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.effective_to || '(chưa có)'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Trạng thái GCN:</span>{' '}
                        <span className="font-medium">{actionModal.gcnResult.context.mode}</span>
                      </div>
                    </div>

                    {/* Scope columns */}
                    <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                      <span className="text-zinc-500">Phạm vi GCN (3 cột):</span>
                      {actionModal.gcnResult.context.gcn_scope_col_1_text && (
                        <div className="bg-white rounded px-2 py-1 text-zinc-700">Col 1: {actionModal.gcnResult.context.gcn_scope_col_1_text}</div>
                      )}
                      {actionModal.gcnResult.context.gcn_scope_col_2_text && (
                        <div className="bg-white rounded px-2 py-1 text-zinc-700">Col 2: {actionModal.gcnResult.context.gcn_scope_col_2_text}</div>
                      )}
                      {actionModal.gcnResult.context.gcn_scope_col_3_text && (
                        <div className="bg-white rounded px-2 py-1 text-zinc-700">Col 3: {actionModal.gcnResult.context.gcn_scope_col_3_text}</div>
                      )}
                    </div>

                    {/* Safety flags */}
                    <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                      <div>
                        <span className="text-zinc-500">write_performed:</span>{' '}
                        <span className={actionModal.gcnResult.write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.gcnResult.write_performed ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">print_enabled:</span>{' '}
                        <span className={actionModal.gcnResult.print_enabled ? 'text-amber-600 font-bold' : 'text-zinc-400'}>
                          {String(actionModal.gcnResult.print_enabled)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">qr_generation_enabled:</span>{' '}
                        <span className={actionModal.gcnResult.qr_generation_enabled ? 'text-amber-600 font-bold' : 'text-zinc-400'}>
                          {String(actionModal.gcnResult.qr_generation_enabled)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">locked_layout:</span>{' '}
                        <span className="text-emerald-600">LOCKED ✓</span>
                      </div>
                    </div>

                    {actionModal.gcnResult.context.warnings && actionModal.gcnResult.context.warnings.length > 0 && (
                      <div className="border-t border-zinc-200 pt-2 mt-2">
                        <span className="text-zinc-500">Warnings:</span>
                        <div className="mt-1 space-y-0.5">
                          {actionModal.gcnResult.context.warnings.map((w, i) => (
                            <p key={i} className="text-amber-600">- {w}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delete Confirm */}
            {actionModal.action === 'delete_confirm' && !actionModal.loading && (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      {currentUser?.role === 'super_admin' ? (
                        <>
                          <p className="font-semibold">Xác nhận xóa vĩnh viễn khỏi DB chính</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Hợp đồng: <strong>{actionModal.contractNo}</strong>
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            ID: <strong>{actionModal.contractId}</strong>
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            Đơn vị: <strong>{actionModal.customerName || '(không rõ)'}</strong>
                          </p>
                          <p className="mt-2 text-xs text-amber-700 font-semibold">
                            Admin đang xóa record khỏi DB chính. Thao tác này không thể hoàn tác.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">Xác nhận xóa hợp đồng này?</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Hợp đồng: <strong>{actionModal.contractNo}</strong>
                          </p>
                          <p className="mt-2 text-xs text-amber-700">
                            Thao tác này không thể hoàn tác.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={closeActionModal}>Hủy</Button>
                  <Button variant="primary" tone="danger" onClick={confirmDelete}
                    leftIcon={<Trash2Icon className="h-4 w-4" />}
                  >
                    {currentUser?.role === 'super_admin' ? 'Xóa vĩnh viễn' : 'Xác nhận xóa'}
                  </Button>
                </div>
              </div>
            )}

            {/* Delete Result */}
            {actionModal.action === 'delete_result' && actionModal.deleteResult && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${actionModal.deleteResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {actionModal.deleteResult.ok ? (
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {actionModal.deleteResult.ok
                      ? 'Xóa thành công'
                      : 'Xóa thất bại'}
                  </span>
                </div>

                {actionModal.deleteResult.ok && (
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div><span className="text-zinc-500">contract_id:</span> <span className="font-medium">{actionModal.deleteResult.contract_id}</span></div>
                      <div><span className="text-zinc-500">contract_no:</span> <span className="font-medium">{actionModal.deleteResult.contract_no}</span></div>
                      <div><span className="text-zinc-500">deleted_contract_records:</span> <span className="font-medium">{actionModal.deleteResult.deleted_contract_records}</span></div>
                      <div><span className="text-zinc-500">deleted_certificate_records:</span> <span className="font-medium">{actionModal.deleteResult.deleted_certificate_records}</span></div>
                      <div><span className="text-zinc-500">mode:</span> <span className="font-medium">{actionModal.deleteResult.mode}</span></div>
                      <div><span className="text-zinc-500">permission_used:</span> <span className="font-medium">{actionModal.deleteResult.permission_used || '-'}</span></div>
                    </div>
                    <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                      <div>
                        <span className="text-zinc-500">write_performed:</span>{' '}
                        <span className={actionModal.deleteResult.write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.deleteResult.write_performed ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">old_db_touched:</span>{' '}
                        <span className={actionModal.deleteResult.old_db_touched ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {actionModal.deleteResult.old_db_touched ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">admin_delete_any:</span>{' '}
                        <span className={actionModal.deleteResult.admin_delete_any_enabled ? 'text-amber-700 font-semibold' : 'text-zinc-500'}>
                          {actionModal.deleteResult.admin_delete_any_enabled ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                    </div>
                    {actionModal.deleteResult.warnings && actionModal.deleteResult.warnings.length > 0 && (
                      <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                        <span className="text-zinc-500">Warnings:</span>
                        {actionModal.deleteResult.warnings.map((w, i) => (
                          <p key={i} className="text-amber-600">- {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!actionModal.deleteResult.ok && (
                  <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <p className="font-semibold">Không thể xóa record này.</p>
                    <p className="mt-1">{actionModal.deleteResult.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-2 border-t border-zinc-200">
              <Button variant="secondary" leftIcon={<XIcon className="h-4 w-4" />} onClick={closeActionModal}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </Page>);

}
function Th({
  children,
  align = 'left'



}: {children: React.ReactNode;align?: 'left' | 'right' | 'center';}) {
  return (
    <th
      className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-700 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      
      {children}
    </th>);

}
