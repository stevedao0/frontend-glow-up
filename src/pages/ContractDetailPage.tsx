import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeftIcon, FileTextIcon, LockIcon, FileDownIcon, CheckCircle2Icon, XCircleIcon, Trash2Icon, AlertTriangleIcon, LoaderIcon, PrinterIcon, AwardIcon, RefreshCwIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { EmptyState } from '../components/app-ui/EmptyState';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { Modal } from '../components/app-ui/Modal';
import { formatCurrency, formatDate } from '../lib/format';
import { RouteKey } from '../data/routes';
import { ApiContractDetail, getContractDetail, exportDocxPreview, exportKvcSyntheticPreview, getCertificateContextDryRun, type ExportPreviewResult, type CertificateContextResult, deleteContractCloneOnly, type DeleteContractCloneOnlyResult } from '../lib/contractsClient';
import { useAuth } from '../lib/auth';

const TOKEN_KEY = 'vcpmc_new_app_access_token';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'renewed') return 'success';
  if (normalized === 'expiring' || normalized === 'pending_renewal') return 'warning';
  if (normalized === 'expired') return 'danger';
  return 'neutral';
}

function karaokeCountDisplay(
  value: number | null | undefined,
  mode: string | null | undefined,
  appliesTo: 'PHONG' | 'BOX'
) {
  const normalized = String(mode || '').trim().toUpperCase();
  if (value == null && normalized && normalized !== appliesTo) return 'Không áp dụng';
  return value ?? '-';
}

export function ContractDetailPage({
  contractId,
  onBack,
  onEdit,
  onNavigate,
  onCreateGcn,
}: {
  contractId: number | null;
  onBack: () => void;
  onEdit?: (id: number) => void;
  onNavigate?: (k: RouteKey) => void;
  onCreateGcn?: (contractId: number) => void;
}) {
  // Auth
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.backendRole?.toLowerCase() === 'admin' || currentUser?.backendRole?.toLowerCase() === 'mod' || currentUser?.backendRole?.toLowerCase() === 'superuser';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<ApiContractDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ExportPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [gcnLoading, setGcnLoading] = useState(false);
  const [gcnResult, setGcnResult] = useState<CertificateContextResult | null>(null);
  const [gcnError, setGcnError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    loading: boolean;
    result: DeleteContractCloneOnlyResult | null;
  }>({ open: false, loading: false, result: null });

  // Auto-load GCN context when contract detail is ready
  const loadGcnContext = useCallback(async (contractId: number) => {
    const token = localStorage.getItem('vcpmc_new_app_access_token');
    if (!token) return;
    setGcnLoading(true);
    setGcnError('');
    setGcnResult(null);
    try {
      const result = await getCertificateContextDryRun(token, contractId);
      setGcnResult(result);
    } catch (err: any) {
      setGcnError(String(err?.message || 'Loi khi lay du lieu GCN.'));
    } finally {
      setGcnLoading(false);
    }
  }, []);

  const isSafeTestRecord = (no: string) => {
    const prefix = ['CLONE-NEWAPP-', 'TEST-NEWAPP-', 'MAKE-HD-', 'OLDAPP-DIRECT-', 'OLDAPP-FLOW-', 'UI-WORD-FALLBACK-', 'SMOKE-', 'MAKE-HD-SMOKE-', 'UI-TEST-', 'DELETE-TEST-'];
    return prefix.some(p => no.toUpperCase().startsWith(p));
  };

  const openDeleteConfirm = () => {
    if (!detail) return;
    setDeleteModal({ open: true, loading: false, result: null });
  };

  const confirmDetailDelete = async () => {
    if (!detail) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deleteContractCloneOnly(token, detail.id);
      setDeleteModal((prev) => ({ ...prev, loading: false, result }));
    } catch (err: any) {
      setDeleteModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          ok: false,
          mode: 'error',
          message: String(err?.message || 'Loi khi xoa'),
          write_performed: false,
          contract_id: detail.id,
          contract_no: detail.contract_no,
          deleted_contract_records: 0,
          deleted_certificate_records: 0,
          deleted_related_rows: 0,
          old_db_touched: false,
          blocked_final_certificates: 0,
          admin_delete_any_enabled: false,
          permission_used: null,
          warnings: [],
          errors: [{ field: 'catch', message: String(err?.message || 'Loi khi xoa') }],
        },
      }));
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, loading: false, result: null });
  };

  const handleExportPreview = async () => {
    if (!detail) return;
    const token = localStorage.getItem('vcpmc_new_app_access_token');
    if (!token) {
      setPreviewError('Phien dang nhap khong hop le.');
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewResult(null);
    try {
      const result = await exportDocxPreview(token, detail.id, { include_blocks: true });
      setPreviewResult(result);
    } catch (err: any) {
      setPreviewError(String(err?.message || 'Loi khi tao preview DOCX.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGcnContext = useCallback(async () => {
    if (!detail) return;
    const token = localStorage.getItem('vcpmc_new_app_access_token');
    if (!token) {
      setGcnError('Phien dang nhap khong hop le.');
      return;
    }
    await loadGcnContext(detail.id);
  }, [detail, loadGcnContext]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!contractId) {
        setDetail(null);
        setLoading(false);
        setError('Khong co hop dong duoc chon.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          throw new Error('Phien dang nhap khong hop le. Vui long dang nhap lai.');
        }
        const data = await getContractDetail(token, contractId);
        if (cancelled) return;
        setDetail(data);
      } catch (err: any) {
        if (cancelled) return;
        setDetail(null);
        setError(String(err?.message || 'Khong tai duoc chi tiet hop dong.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  // Auto-load GCN context once contract detail is loaded
  useEffect(() => {
    if (!detail) return;
    if (detail.domain?.display !== 'Karaoke') return;
    if (gcnResult !== null || gcnLoading) return; // already loaded or loading
    loadGcnContext(detail.id);
  }, [detail, gcnResult, gcnLoading, loadGcnContext]);

  return (
    <Page>
      <PageHeader
        breadcrumb="/bg/contracts/detail"
        title={detail ? `Chi tiet hop dong ${detail.contract_no}` : 'Chi tiet hop dong'}
        description="Read-only tu du lieu tren DB chinh (port 5432)."
        actions={
          <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
            Quay lai danh sach
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={10} cols={4} />
      ) : error || !detail ? (
        <EmptyState
          title="Khong tai duoc chi tiet hop dong"
          description={error || 'Du lieu khong ton tai hoac khong co quyen truy cap.'}
          icon={<FileTextIcon className="h-5 w-5" />}
          action={
            <Button variant="secondary" onClick={onBack}>
              Quay lai
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* Left column */}
          <div className="space-y-4 min-w-0">
          <ContentCard>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={statusTone(detail.status)}>{detail.status || 'unknown'}</StatusBadge>
              <span className="text-sm text-zinc-500">Nam hop dong: {detail.contract_year || '-'}</span>
              <span className="text-sm text-zinc-500">Ma: #{detail.id}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Don vi</p>
                <p className="font-semibold text-zinc-900">{detail.customer.name || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Bang hieu</p>
                <p className="font-semibold text-zinc-900">{detail.customer.signage || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500">Dia chi phap ly</p>
                <p className="font-semibold text-zinc-900">{detail.customer.legal_address || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-zinc-500">Dia chi su dung</p>
                <p className="font-semibold text-zinc-900">
                  {detail.customer.usage_address || detail.customer.address || '-'}
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard>
            <h3 className="text-sm font-semibold text-zinc-900">Linh vuc va thoi gian</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Linh vuc hien thi</p>
                <p className="font-semibold text-zinc-900">{detail.domain.display || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Field code</p>
                <p className="font-semibold text-zinc-900">{detail.domain.field_code || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Domain group</p>
                <p className="font-semibold text-zinc-900">{detail.domain.domain_group || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Ngay lap</p>
                <p className="font-semibold text-zinc-900">{formatDate(detail.dates.signed_date || '')}</p>
              </div>
              <div>
                <p className="text-zinc-500">Hieu luc tu</p>
                <p className="font-semibold text-zinc-900">{formatDate(detail.dates.start_date || '')}</p>
              </div>
              <div>
                <p className="text-zinc-500">Hieu luc den</p>
                <p className="font-semibold text-zinc-900">{formatDate(detail.dates.end_date || '')}</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard>
            <h3 className="text-sm font-semibold text-zinc-900">Tai chinh va karaoke</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-zinc-500">Tiền trước GTGT</p>
                <p className="font-semibold text-zinc-900">
                  {detail.financial.amount_before_gtgt == null
                    ? '-'
                    : formatCurrency(detail.financial.amount_before_gtgt)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">GTGT %</p>
                <p className="font-semibold text-zinc-900">
                  {detail.financial.gtgt_percent ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Tiền GTGT</p>
                <p className="font-semibold text-zinc-900">
                  {detail.financial.gtgt_amount == null
                    ? '-'
                    : formatCurrency(detail.financial.gtgt_amount)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Tong tien</p>
                <p className="font-semibold text-zinc-900">
                  {(detail.financial.total_amount ?? detail.financial.amount) == null
                    ? '-'
                    : formatCurrency(detail.financial.total_amount ?? detail.financial.amount ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Loai hinh karaoke</p>
                <p className="font-semibold text-zinc-900">{detail.karaoke.type || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500">So phong</p>
                <p className="font-semibold text-zinc-900">
                  {karaokeCountDisplay(detail.karaoke.room_count, detail.karaoke.type, 'PHONG')}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">So box</p>
                <p className="font-semibold text-zinc-900">
                  {karaokeCountDisplay(detail.karaoke.box_count, detail.karaoke.type, 'BOX')}
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">Hanh dong</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {detail && onEdit ? (
                <Button variant="secondary" onClick={() => onEdit(detail.id)}>
                  Chinh sua hop dong
                </Button>
              ) : (
                <Button variant="secondary" disabled>
                  Chinh sua (Chua co hanh dong chinh sua)
                </Button>
              )}
              {(isSafeTestRecord(detail?.contract_no || '') || isAdmin) && (
                <Button
                  variant="secondary"
                  tone="danger"
                  leftIcon={<Trash2Icon className="h-4 w-4" />}
                  onClick={openDeleteConfirm}
                >
                  Xoa hop dong
                </Button>
              )}
            </div>
          </ContentCard>

          <ContentCard>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">Xuat DOCX Preview</h3>
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <LockIcon className="h-3.5 w-3.5" /> Preview only
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Tao Word preview tam de kiem tra layout. File preview de kiem tra, chua ghi DB, chua xuat chinh thuc.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Button
                variant="secondary"
                leftIcon={<FileDownIcon className="h-4 w-4" />}
                onClick={handleExportPreview}
                disabled={
                  previewLoading ||
                  !detail ||
                  !['Karaoke', 'KVC', 'Khu vui choi'].includes(detail.domain.display || '')
                }
              >
                {previewLoading ? 'Dang tao preview...' : 'Tao Word preview tam'}
              </Button>
              {previewError && (
                <p className="text-xs text-red-600">Loi: {previewError}</p>
              )}
              {previewResult && (
                <div className="rounded-lg bg-zinc-50 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-zinc-500">Domain:</span>
                    <span className="font-medium">{previewResult.domain_label}</span>
                    <span className="text-zinc-500">Preview file:</span>
                    <span className="font-medium truncate" title={previewResult.preview_path || ''}>
                      {previewResult.preview_path?.split('\\').pop()}
                    </span>
                    <span className="text-zinc-500">File size:</span>
                    <span className="font-medium">
                      {previewResult.file_size ? `${(previewResult.file_size / 1024).toFixed(1)} KB` : '-'}
                    </span>
                    <span className="text-zinc-500">db_write:</span>
                    <span className={previewResult.db_write_performed ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {previewResult.db_write_performed ? 'YES' : 'NO'}
                    </span>
                    <span className="text-zinc-500">docx_path_attached:</span>
                    <span className={previewResult.docx_path_attached ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {previewResult.docx_path_attached ? 'YES' : 'NO'}
                    </span>
                    <span className="text-zinc-500">official_export:</span>
                    <span className={previewResult.official_export ? 'text-red-600 font-bold' : 'text-green-600'}>
                      {previewResult.official_export ? 'YES' : 'NO'}
                    </span>
                    <span className="text-zinc-500">synthetic:</span>
                    <span className={previewResult.synthetic_preview ? 'text-amber-600' : 'text-green-600'}>
                      {previewResult.synthetic_preview ? 'YES' : 'NO'}
                    </span>
                  </div>
                  {previewResult.warnings.length > 0 && (
                    <div className="mt-2">
                      {previewResult.warnings.map((w, i) => (
                        <p key={i} className="text-amber-600">- {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ContentCard>

          <ContentCard>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Raw technical info (safe)</summary>
              <pre className="mt-3 text-xs leading-5 text-zinc-700 overflow-auto bg-zinc-50 p-3 rounded-lg ring-1 ring-zinc-200">
{JSON.stringify(detail.raw, null, 2)}
              </pre>
            </details>
          </ContentCard>
          </div>

          {/* Right column: In GCN panel */}
          <div className="xl:sticky xl:top-6 xl:self-start xl:space-y-4">
            <ContentCard>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <AwardIcon className="h-4 w-4 text-amber-700" />
                  In Giấy Chứng Nhận
                </h3>
                <button
                  type="button"
                  onClick={() => loadGcnContext(detail.id)}
                  disabled={gcnLoading}
                  className="text-xs text-amber-700 hover:text-amber-900 disabled:opacity-40 flex items-center gap-1 transition-colors">
                  {gcnLoading ? (
                    <LoaderIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="h-3 w-3" />
                  )}
                  Tai lai
                </button>
              </div>

              {detail.domain?.display !== 'Karaoke' ? (
                <p className="text-xs text-zinc-400 italic py-2">Chi ho tro Karaoke</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1.5 text-xs">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div><span className="text-zinc-500">So HĐ:</span> <span className="font-medium">{detail.contract_no}</span></div>
                      <div><span className="text-zinc-500">So GCN:</span> <span className="font-medium font-mono">{gcnResult?.context.certificate_no || '(chua co)'}</span></div>
                      <div className="col-span-2"><span className="text-zinc-500">To chuc:</span> <span className="font-medium">{gcnResult?.context.organization_name || detail.customer?.name || '-'}</span></div>
                      <div className="col-span-2"><span className="text-zinc-500">Dia diem KD:</span> <span className="font-medium">{gcnResult?.context.business_location || '(chua co)'}</span></div>
                      <div><span className="text-zinc-500">Hieu luc:</span> <span className="font-medium">{gcnResult?.context.effective_from || '(chua co)'}</span></div>
                      <div><span className="text-zinc-500">Den:</span> <span className="font-medium">{gcnResult?.context.effective_to || '(chua co)'}</span></div>
                    </div>
                  </div>

                  {/* GCN error */}
                  {gcnError && (
                    <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-600/15">
                      {gcnError}
                    </div>
                  )}

                  {/* Safety flags */}
                  {gcnResult?.ok && (
                    <div className="rounded-lg border border-zinc-200 p-2.5 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">write_performed</span>
                        <span className={gcnResult.write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {gcnResult.write_performed ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">print_enabled</span>
                        <span className={gcnResult.print_enabled ? 'text-amber-600 font-semibold' : 'text-zinc-400'}>
                          {String(gcnResult.print_enabled)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">qr_generation</span>
                        <span className={gcnResult.qr_generation_enabled ? 'text-amber-600 font-semibold' : 'text-zinc-400'}>
                          {String(gcnResult.qr_generation_enabled)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">layout</span>
                        <span className="text-emerald-600 font-semibold">LOCKED ✓</span>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {gcnResult?.ok && gcnResult.context.warnings.length > 0 && (
                    <div className="rounded-lg bg-amber-50 p-2.5 space-y-0.5">
                      {gcnResult.context.warnings.map((w, i) => (
                        <p key={i} className="text-[11px] text-amber-700">⚠️ {w}</p>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<PrinterIcon className="h-4 w-4" />}
                      onClick={() => onCreateGcn ? onCreateGcn(detail.id) : onNavigate && onNavigate('contracts.print')}
                      disabled={!gcnResult?.ok}
                      title={!gcnResult?.ok ? 'Can lay du lieu GCN truoc' : ''}
                    >
                      Chinh sua & In GCN
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<FileDownIcon className="h-4 w-4" />}
                      onClick={handleGcnContext}
                      disabled={gcnLoading}
                    >
                      {gcnLoading ? 'Dang lay...' : 'Xem du lieu GCN'}
                    </Button>
                  </div>
                </div>
              )}
            </ContentCard>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && detail && (
        <Modal open onClose={closeDeleteModal} title={`Xác nhận xóa — ${detail.contract_no}`} size="lg">
          <div className="space-y-4">
            {!deleteModal.loading && !deleteModal.result && (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      {isAdmin ? (
                        <>
                          <p className="font-semibold">Xác nhận xóa vĩnh viễn</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Hợp đồng: <strong>{detail.contract_no}</strong>
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            ID: <strong>{detail.id}</strong>
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            Đơn vị: <strong>{detail.customer?.name || '(không rõ)'}</strong>
                          </p>
                          <p className="mt-2 text-xs text-amber-700 font-semibold">
                            Admin đang xóa record khỏi DB chính. Thao tác này không thể hoàn tác.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">Xác nhận xóa hợp đồng này?</p>
                          <p className="mt-1 text-xs text-amber-700">
                            Hợp đồng: <strong>{detail.contract_no}</strong>
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
                  <Button variant="secondary" onClick={closeDeleteModal}>Hủy</Button>
                  <Button variant="primary" tone="danger" onClick={confirmDetailDelete} leftIcon={<Trash2Icon className="h-4 w-4" />}>
                    {isAdmin ? 'Xóa vĩnh viễn' : 'Xác nhận xóa'}
                  </Button>
                </div>
              </div>
            )}

            {deleteModal.loading && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <LoaderIcon className="h-5 w-5 animate-spin text-amber-700" />
                <span className="text-sm text-zinc-600">Đang xử lý...</span>
              </div>
            )}

            {deleteModal.result && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${deleteModal.result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {deleteModal.result.ok ? (
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-semibold">
                    {deleteModal.result.ok ? 'Xóa thành công' : 'Xóa thất bại'}
                  </span>
                </div>

                {deleteModal.result.ok && (
                  <div className="rounded-lg bg-zinc-50 p-4 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div><span className="text-zinc-500">contract_id:</span> <span className="font-medium">{deleteModal.result.contract_id}</span></div>
                      <div><span className="text-zinc-500">contract_no:</span> <span className="font-medium">{deleteModal.result.contract_no}</span></div>
                      <div><span className="text-zinc-500">deleted_contract_records:</span> <span className="font-medium">{deleteModal.result.deleted_contract_records}</span></div>
                      <div><span className="text-zinc-500">deleted_certificate_records:</span> <span className="font-medium">{deleteModal.result.deleted_certificate_records}</span></div>
                      <div><span className="text-zinc-500">mode:</span> <span className="font-medium">{deleteModal.result.mode}</span></div>
                      <div><span className="text-zinc-500">permission_used:</span> <span className="font-medium">{deleteModal.result.permission_used || '-'}</span></div>
                    </div>
                    <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                      <div>
                        <span className="text-zinc-500">write_performed:</span>{' '}
                        <span className={deleteModal.result.write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {deleteModal.result.write_performed ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">old_db_touched:</span>{' '}
                        <span className={deleteModal.result.old_db_touched ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {deleteModal.result.old_db_touched ? 'YES ⚠️' : 'NO ✓'}
                        </span>
                      </div>
                    </div>
                    {deleteModal.result.warnings && deleteModal.result.warnings.length > 0 && (
                      <div className="border-t border-zinc-200 pt-2 mt-2 space-y-1">
                        <span className="text-zinc-500">Warnings:</span>
                        {deleteModal.result.warnings.map((w, i) => (
                          <p key={i} className="text-amber-600">- {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!deleteModal.result.ok && (
                  <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <p className="font-semibold">Không thể xóa record này.</p>
                    <p className="mt-1">{deleteModal.result.message}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => { closeDeleteModal(); if (deleteModal.result?.ok) onBack(); }}>
                    {deleteModal.result?.ok ? 'Quay lại danh sách' : 'Đóng'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Page>
  );
}
