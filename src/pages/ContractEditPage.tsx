/**
 * PHASE CONTRACTS-ACTIONS-EDIT-01: Edit Contract Page
 *
 * Edit contract using CreateContractPage structure as base.
 * - Load contract detail from GET /api/contracts/{id}
 * - Map DB row to editable form fields
 * - Call PATCH /api/contracts/{id} for clone-only updates
 * - Only Karaoke/Background for this phase
 * - Read-only save if UPDATE_CONTRACT_CLONE_ONLY_ENABLED=false
 * - Mirror CreateContractPage sections: Thong tin chung, Doi tac, Dia diem, Karaoke
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  SaveIcon,
  LoaderIcon,
  CheckCircle2Icon,
  XCircleIcon,
  LockIcon,
  AlertTriangleIcon,
  FileDownIcon,
} from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Input } from '../components/app-ui/Input';
import { Select } from '../components/app-ui/Select';
import { FormSection } from '../components/app-ui/FormSection';
import { FieldGrid } from '../components/app-ui/FieldGrid';
import { EmptyState } from '../components/app-ui/EmptyState';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import {
  ApiContractDetail,
  getContractDetail,
  updateContract,
  exportDocxPreview,
  type UpdateContractResponse,
  type ExportPreviewResult,
} from '../lib/contractsClient';
import { formatDate } from '../lib/format';
import { RouteKey } from '../data/routes';
import { useAuth } from '../lib/auth';

const TOKEN_KEY = 'vcpmc_new_app_access_token';

export function ContractEditPage({
  contractId,
  onBack,
  onSaved,
}: {
  contractId: number | null;
  onBack: () => void;
  onSaved?: (id: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('contracts.update');
  const [detail, setDetail] = useState<ApiContractDetail | null>(null);

  // Editable form state
  const [formData, setFormData] = useState<EditableContractForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<UpdateContractResponse | null>(null);
  const [saveError, setSaveError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ExportPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState('');

  // Load contract detail
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!contractId) {
        setDetail(null);
        setFormData(null);
        setLoading(false);
        setError('Khong co hop dong duoc chon.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) throw new Error('Phien dang nhap khong hop le. Vui long dang nhap lai.');
        const data = await getContractDetail(token, contractId);
        if (cancelled) return;
        setDetail(data);
        setFormData(mapDetailToForm(data));
      } catch (err: any) {
        if (cancelled) return;
        setDetail(null);
        setFormData(null);
        setError(String(err?.message || 'Khong tai duoc chi tiet hop dong.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [contractId]);

  const handleFieldChange = (field: keyof EditableContractForm, value: string | number) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    setSaveResult(null);
    setSaveError('');
  };

  const handleWordPreview = async () => {
    if (!detail) return;
    const token = localStorage.getItem(TOKEN_KEY);
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
      setPreviewError(String(err?.message || 'Loi khi tao Word preview.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const isKaraoke = detail?.domain?.display === 'Karaoke';

  const handleSave = async () => {
    if (!detail || !formData) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setSaveError('Phien dang nhap khong hop le.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    setSaveResult(null);
    try {
      const result = await updateContract(token, detail.id, formData);
      setSaveResult(result);
      if (result.ok && result.write_performed) {
        const data = await getContractDetail(token, detail.id);
        setDetail(data);
        setFormData(mapDetailToForm(data));
      }
    } catch (err: any) {
      setSaveError(String(err?.message || 'Loi khi luu hop dong.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <PageHeader
          breadcrumb="/bg/contracts/edit"
          title="Chinh sua hop dong"
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
              Quay lai
            </Button>
          }
        />
        <TableSkeleton rows={6} cols={3} />
      </Page>
    );
  }

  if (error || !detail || !formData) {
    return (
      <Page>
        <PageHeader
          breadcrumb="/bg/contracts/edit"
          title="Chinh sua hop dong"
          actions={
            <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
              Quay lai
            </Button>
          }
        />
        <EmptyState
          title="Khong tai duoc hop dong"
          description={error || 'Hop dong khong ton tai.'}
          icon={<XCircleIcon className="h-5 w-5" />}
          action={
            <Button variant="secondary" onClick={onBack}>Quay lai</Button>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        breadcrumb="/bg/contracts/edit"
        title={`Chinh sua hop dong ${detail.contract_no}`}
        description="Chinh sua thong tin hop dong tren DB chinh (port 5432)."
        actions={
          <div className="flex items-center gap-2">
            {!hasPermission('contracts.update') && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md ring-1 ring-amber-600/20">
                <LockIcon className="h-3.5 w-3.5" />
                Read-only — Khong co quyen chinh sua
              </span>
            )}
            <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
              Quay lai
            </Button>
          </div>
        }
      />

      <ContentCard>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <StatusBadge tone="indigo">{detail.contract_no}</StatusBadge>
          <span className="text-sm text-zinc-500">#{detail.id}</span>
          <span className="text-sm text-zinc-500">Linh vuc: {detail.domain.display}</span>
          <span className="text-sm text-zinc-500">Domain group: {detail.domain.domain_group || '-'}</span>
        </div>
      </ContentCard>

      {/* ============================================================ */}
      {/* SECTION 1: THONG TIN CHUNG (READ-ONLY) */}
      {/* ============================================================ */}
      <FormSection
        title="1. Thong tin chung"
        description="So hop dong va ngay ky (khong the sua)"
      >
        <FieldGrid cols={3}>
          <div>
            <p className="text-xs text-zinc-500 mb-1">So hop dong</p>
            <p className="font-mono font-semibold text-zinc-900">{formData.contract_no}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Ngay ky</p>
            <p className="font-semibold text-zinc-900">{formatDate(detail.dates.signed_date || '')}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Nam hop dong</p>
            <p className="font-semibold text-zinc-900">{detail.contract_year || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Ma vung</p>
            <p className="font-semibold text-zinc-900">{detail.raw?.region_code || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Ma quyen</p>
            <p className="font-semibold text-zinc-900">{detail.domain.field_code || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Linh vuc</p>
            <p className="font-semibold text-zinc-900">{detail.domain.display}</p>
          </div>
        </FieldGrid>
        {isKaraoke && (
          <div className="mt-3">
            <p className="text-xs text-zinc-500 mb-1">Loai hinh karaoke</p>
            <Select
              value={formData.loai_hinh_karaoke || ''}
              onChange={(v) => handleFieldChange('loai_hinh_karaoke', v)}
              options={[
                { value: 'PHONG', label: 'Phong' },
                { value: 'BOX', label: 'Box' },
              ]}
              disabled={!canEdit}
            />
          </div>
        )}
      </FormSection>

      {/* ============================================================ */}
      {/* SECTION 2: THONG TIN DOI TAC */}
      {/* ============================================================ */}
      <FormSection
        title="2. Thong tin doi tac"
        description="Thong tin don vi, nguoi dai dien, dia chi"
      >
        <div className="space-y-4">
          <FieldGrid>
            <Input
              label="Ten don vi"
              value={formData.don_vi_ten}
              onChange={(e) => handleFieldChange('don_vi_ten', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Ten bang hieu"
              value={formData.ten_bang_hieu}
              onChange={(e) => handleFieldChange('ten_bang_hieu', e.target.value)}
              disabled={!canEdit}
            />
          </FieldGrid>
          <FieldGrid>
            <Input
              label="Nguoi dai dien"
              value={formData.don_vi_nguoi_dai_dien}
              onChange={(e) => handleFieldChange('don_vi_nguoi_dai_dien', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Chuc vu"
              value={formData.don_vi_chuc_vu}
              onChange={(e) => handleFieldChange('don_vi_chuc_vu', e.target.value)}
              disabled={!canEdit}
            />
          </FieldGrid>
          <FieldGrid cols={3}>
            <Input
              label="Ma so thue"
              value={formData.don_vi_mst}
              onChange={(e) => handleFieldChange('don_vi_mst', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Dien thoai"
              type="tel"
              value={formData.don_vi_dien_thoai}
              onChange={(e) => handleFieldChange('don_vi_dien_thoai', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Email"
              type="email"
              value={formData.don_vi_email}
              onChange={(e) => handleFieldChange('don_vi_email', e.target.value)}
              disabled={!canEdit}
            />
          </FieldGrid>
          <FieldGrid>
            <Input
              label="Dia chi don vi"
              value={formData.don_vi_dia_chi}
              onChange={(e) => handleFieldChange('don_vi_dia_chi', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Dia chi su dung"
              value={formData.dia_chi_su_dung}
              onChange={(e) => handleFieldChange('dia_chi_su_dung', e.target.value)}
              disabled={!canEdit}
            />
          </FieldGrid>
        </div>
      </FormSection>

      {/* ============================================================ */}
      {/* SECTION 3: KHU VUC KINH DOANH (KARAOKE ONLY) */}
      {/* ============================================================ */}
      {isKaraoke && (
        <FormSection
          title="3. Khu vuc kinh doanh"
          description="So phong/box cho Karaoke"
        >
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="w-48">
                <Input
                  label={formData.loai_hinh_karaoke === 'PHONG' ? 'So phong' : 'So box'}
                  type="number"
                  value={String(
                    formData.loai_hinh_karaoke === 'PHONG'
                      ? (formData.tong_so_phong ?? 0)
                      : (formData.tong_so_box ?? 0)
                  )}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    if (formData.loai_hinh_karaoke === 'PHONG') {
                      handleFieldChange('tong_so_phong', val);
                    } else {
                      handleFieldChange('tong_so_box', val);
                    }
                  }}
                  disabled={!canEdit}
                />
              </div>
              <p className="text-xs text-zinc-500 mb-1">
                <AlertTriangleIcon className="h-3.5 w-3.5 inline mr-1" />
                So phong/box duoc luu truc tiep. Neu thay doi, can chay lai tinh toan tien ban quyen.
              </p>
            </div>
          </div>
        </FormSection>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: THOI HAN & TAI CHINH */}
      {/* ============================================================ */}
      <FormSection
        title="4. Thoi han va tai chinh"
        description="Ngay bat dau, ngay ket thuc, tien ban quyen"
      >
        <div className="space-y-4">
          <FieldGrid cols={2}>
            <Input
              label="Ngay bat dau"
              type="date"
              value={formData.ngay_bat_dau}
              onChange={(e) => handleFieldChange('ngay_bat_dau', e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Ngay ket thuc"
              type="date"
              value={formData.ngay_ket_thuc}
              onChange={(e) => handleFieldChange('ngay_ket_thuc', e.target.value)}
              disabled={!canEdit}
            />
          </FieldGrid>
          <FieldGrid cols={3}>
            <Input
              label="Tien truoc GTGT"
              type="number"
              value={String(formData.so_tien_chua_gtgt_value ?? 0)}
              onChange={(e) => handleFieldChange('so_tien_chua_gtgt_value', parseInt(e.target.value, 10) || 0)}
              disabled={!canEdit}
            />
            <Input
              label="GTGT (%)"
              type="number"
              value={String(formData.thue_percent ?? 0)}
              onChange={(e) => handleFieldChange('thue_percent', parseFloat(e.target.value) || 0)}
              disabled={!canEdit}
            />
            <Select
              label="Trang thai tai ky"
              value={formData.renewal_status || ''}
              onChange={(v) => handleFieldChange('renewal_status', v)}
              options={[
                { value: 'NEW', label: 'Moi (NEW)' },
                { value: 'PENDING_RENEWAL', label: 'Cho tai ky (PENDING_RENEWAL)' },
                { value: 'RENEWED', label: 'Da tai ky (RENEWED)' },
              ]}
              disabled={!canEdit}
            />
          </FieldGrid>
          {formData.so_tien_chua_gtgt_value != null && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm">
              <p className="text-zinc-700">
                Tong tien (chu VAT): <strong>{formData.so_tien_chua_gtgt_value.toLocaleString('vi-VN')} VND</strong>
              </p>
              {formData.thue_percent != null && (
                <p className="text-zinc-600 text-xs">
                  GTGT ({formData.thue_percent}%):{' '}
                  {Math.round(formData.so_tien_chua_gtgt_value * formData.thue_percent / 100).toLocaleString('vi-VN')} VND
                </p>
              )}
              {formData.so_tien_chua_gtgt_value > 0 && formData.thue_percent != null && (
                <p className="font-semibold text-zinc-900">
                  Tong cong:{' '}
                  {Math.round(formData.so_tien_chua_gtgt_value * (1 + formData.thue_percent / 100)).toLocaleString('vi-VN')} VND
                </p>
              )}
            </div>
          )}
        </div>
      </FormSection>

      {/* ============================================================ */}
      {/* SECTION 5: WORD PREVIEW (KARAOKE ONLY) */}
      {/* ============================================================ */}
      {isKaraoke && (
        <ContentCard>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                Tao Word preview
              </h3>
              <p className="text-xs text-zinc-500">
                Tao file Word preview tu du lieu hien tai (da luu). Khong xuat chinh thuc, khong ghi DB, khong dinh kem docx_path.
              </p>

              {previewError && (
                <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-600/15">
                  {previewError}
                </div>
              )}

              {previewResult && (
                <div className="mt-3 space-y-2">
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ring-1 ${previewResult.ok
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                    : 'bg-rose-50 text-rose-700 ring-rose-600/15'}`}>
                    {previewResult.ok ? (
                      <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-semibold">
                      {previewResult.ok ? 'Preview tao thanh cong!' : 'Preview that bai'}
                    </span>
                  </div>
                  {previewResult.ok && (
                    <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs space-y-1">
                      {previewResult.preview_path && (
                        <div>
                          <span className="text-zinc-500">File: </span>
                          <span className="font-medium truncate" title={previewResult.preview_path}>
                            {previewResult.preview_path.split('\\').pop()}
                          </span>
                        </div>
                      )}
                      {previewResult.file_size && (
                        <div>
                          <span className="text-zinc-500">Size: </span>
                          <span className="font-medium">{(previewResult.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      )}
                      <div>
                        <span className="text-zinc-500">db_write: </span>
                        <span className={previewResult.db_write_performed ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {previewResult.db_write_performed ? 'YES' : 'NO'}
                        </span>
                        {'  '}
                        <span className="text-zinc-500">docx_path: </span>
                        <span className={previewResult.docx_path_attached ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {previewResult.docx_path_attached ? 'YES' : 'NO'}
                        </span>
                        {'  '}
                        <span className="text-zinc-500">official: </span>
                        <span className={previewResult.official_export ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                          {previewResult.official_export ? 'YES' : 'NO'}
                        </span>
                      </div>
                      {previewResult.warnings && previewResult.warnings.length > 0 && (
                        <div className="mt-1">
                          {previewResult.warnings.map((w, i) => (
                            <p key={i} className="text-amber-600">- {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                leftIcon={previewLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <FileDownIcon className="h-4 w-4" />}
                onClick={handleWordPreview}
                disabled={previewLoading || !detail}
              >
                {previewLoading ? 'Dang tao...' : 'Tao Word preview'}
              </Button>
            </div>
          </div>
        </ContentCard>
      )}

      {/* ============================================================ */}
      {/* SECTION 6: SAVE ACTION */}
      {/* ============================================================ */}
      <ContentCard>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">
              Luu thay doi
            </h3>
            <p className="text-xs text-zinc-500">
              {canEdit
                ? 'Ghi ket qua len DB chinh. Khong xuat chinh thuc, khong tao GCN.'
                : 'Ban khong co quyen chinh sua hop dong nay.'}
            </p>

            {saveError && (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-600/15">
                {saveError}
              </div>
            )}

            {saveResult && (
              <div className="mt-3 space-y-2">
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ring-1 ${saveResult.ok
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                  : 'bg-rose-50 text-rose-700 ring-rose-600/15'}`}>
                  {saveResult.ok ? (
                    <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-semibold">{saveResult.message}</span>
                </div>
                {saveResult.ok && saveResult.updated_fields && saveResult.updated_fields.length > 0 && (
                  <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs">
                    <p className="font-semibold text-zinc-700 mb-1">Cap nhat thanh cong cac truong:</p>
                    <div className="flex flex-wrap gap-1">
                      {saveResult.updated_fields.map((f) => (
                        <span key={f} className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!saveResult.ok && saveResult.errors && saveResult.errors.length > 0 && (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs">
                    {saveResult.errors.map((e, i) => (
                      <p key={i} className="text-rose-700">- {e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {!canEdit && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                <LockIcon className="h-3.5 w-3.5" />
                Khong co quyen chinh sua
              </span>
            )}
            <Button
              variant="primary"
              leftIcon={isSaving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              onClick={handleSave}
              disabled={!canEdit || isSaving}
            >
              {isSaving ? 'Dang luu...' : 'Luu thay doi'}
            </Button>
          </div>
        </div>
      </ContentCard>
    </Page>
  );
}

// =============================================================================
// TYPES & MAPPING
// =============================================================================

interface EditableContractForm {
  contract_no: string;
  don_vi_ten: string;
  ten_bang_hieu: string;
  don_vi_dia_chi: string;
  dia_chi_su_dung: string;
  don_vi_dien_thoai: string;
  don_vi_email: string;
  don_vi_nguoi_dai_dien: string;
  don_vi_chuc_vu: string;
  don_vi_mst: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  so_tien_chua_gtgt_value: number | null;
  thue_percent: number | null;
  renewal_status: string;
  loai_hinh_karaoke: string;
  tong_so_phong: number | null;
  tong_so_box: number | null;
  contract_note: string;
}

function mapDetailToForm(detail: ApiContractDetail): EditableContractForm {
  return {
    contract_no: detail.contract_no || '',
    don_vi_ten: detail.customer?.name || '',
    ten_bang_hieu: detail.customer?.signage || '',
    don_vi_dia_chi: detail.customer?.legal_address || '',
    dia_chi_su_dung: detail.customer?.usage_address || detail.customer?.address || '',
    don_vi_dien_thoai: '',
    don_vi_email: '',
    don_vi_nguoi_dai_dien: '',
    don_vi_chuc_vu: '',
    don_vi_mst: '',
    ngay_bat_dau: detail.dates.start_date?.split('T')[0] || '',
    ngay_ket_thuc: detail.dates.end_date?.split('T')[0] || '',
    so_tien_chua_gtgt_value: detail.financial.amount_before_gtgt ?? null,
    thue_percent: detail.financial.gtgt_percent ?? null,
    renewal_status: (detail.raw?.renewal_status as string) || 'NEW',
    loai_hinh_karaoke: detail.karaoke?.type || '',
    tong_so_phong: detail.karaoke?.room_count ?? null,
    tong_so_box: detail.karaoke?.box_count ?? null,
    contract_note: '',
  };
}
