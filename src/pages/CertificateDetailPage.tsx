import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeftIcon,
  RefreshCwIcon,
  SaveIcon,
  PrinterIcon,
  AwardIcon,
  FileBadge2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Input } from '../components/app-ui/Input';
import { Textarea } from '../components/app-ui/Textarea';
import { Select } from '../components/app-ui/Select';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { CertificatePaperPreview } from '../modules/certificates/CertificatePaperPreview';
import { GCN_LOCKED_OFFSET } from '../modules/certificates/certificateLayoutLocked';
import type { CertificatePreviewData } from '../modules/certificates/certificateTypes';
import {
  CertificateRecord,
  CERTIFICATE_STATUS_LABEL,
  CertificateStatus,
} from '../data/certificateRecords';
import {
  getCertificate,
  getCertificateContextDryRun,
  updateCertificate,
  syncCertificate,
  printCertificate,
  type CertificatePreviewContext,
  type CertificateUpdatePayload,
} from '../lib/certificatesClient';
import { formatDate } from '../lib/format';
import { RouteKey } from '../data/routes';

const TOKEN_KEY = 'vcpmc_new_app_access_token';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'test_printed', label: 'Đã in thử' },
  { value: 'final_printed', label: 'Đã in chính thức' },
];

type FormState = {
  certificate_no: string;
  certificate_issue_date: string;
  status: CertificateStatus;
  organization_name: string;
  business_registration_no: string;
  address: string;
  business_sign_name: string;
  business_location: string;
  contract_no: string;
  effective_from: string;
  effective_to: string;
  gcn_scope_col_1_text: string;
  gcn_scope_col_2_text: string;
  gcn_scope_col_3_text: string;
  qr_image_data: string;
  offset_x_mm: number;
  offset_y_mm: number;
};

const emptyForm: FormState = {
  certificate_no: '',
  certificate_issue_date: '',
  status: 'draft',
  organization_name: '',
  business_registration_no: '',
  address: '',
  business_sign_name: '',
  business_location: '',
  contract_no: '',
  effective_from: '',
  effective_to: '',
  gcn_scope_col_1_text: '',
  gcn_scope_col_2_text: '',
  gcn_scope_col_3_text: '',
  qr_image_data: '',
  offset_x_mm: 0,
  offset_y_mm: 0,
};

const toForm = (cert: CertificateRecord): FormState => ({
  certificate_no: cert.certificate_no || '',
  certificate_issue_date: cert.certificate_issue_date || '',
  status: cert.status as CertificateStatus,
  organization_name: cert.organization_name || '',
  business_registration_no: cert.business_registration_no || '',
  address: cert.address || '',
  business_sign_name: cert.business_sign_name || '',
  business_location: cert.business_location || '',
  contract_no: cert.contract_no || '',
  effective_from: cert.effective_from || '',
  effective_to: cert.effective_to || '',
  gcn_scope_col_1_text: cert.gcn_scope_col_1_text || '',
  gcn_scope_col_2_text: cert.gcn_scope_col_2_text || '',
  gcn_scope_col_3_text: cert.gcn_scope_col_3_text || '',
  qr_image_data: cert.qr_image_data || '',
  offset_x_mm: cert.offset_x_mm || 0,
  offset_y_mm: cert.offset_y_mm || 0,
});

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}

function InfoRow({ label, value, mono }: InfoRowProps) {
  const display = value == null || value === '' ? '—' : String(value);
  return (
    <div className="grid gap-1 border-b border-zinc-100 py-2 text-sm sm:grid-cols-[140px_1fr]">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono tabular-nums' : ''} ${!value ? 'text-zinc-400 italic' : 'text-zinc-900'}`}>
        {display}
      </span>
    </div>
  );
}

export function CertificateDetailPage({
  certificateId,
  onNavigate,
  onBack,
}: {
  certificateId: number;
  onNavigate: (k: RouteKey) => void;
  onBack?: () => void;
}) {
  const [record, setRecord] = useState<CertificateRecord | null>(null);
  const [context, setContext] = useState<CertificatePreviewContext | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const isPrintRoute = window.location.search.includes('print') || window.location.pathname.endsWith('/print');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError('Chưa đăng nhập');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [detailRes, contextRes] = await Promise.all([
        getCertificate(token, certificateId),
        getCertificateContextDryRun(token, certificateId),
      ]);
      const cert = detailRes.certificate;
      const mapped: CertificateRecord = {
        id: cert.id,
        certificate_id: cert.certificate_id,
        contract_id: cert.contract_id,
        certificate_no: cert.certificate_no || null,
        certificate_issue_date: cert.certificate_issue_date || null,
        status: (cert.status === 'test_printed' || cert.status === 'final_printed' ? cert.status : 'draft') as CertificateStatus,
        organization_name: cert.organization_name || null,
        business_registration_no: cert.business_registration_no || null,
        address: cert.address || cert.business_location || null,
        business_sign_name: cert.business_sign_name || null,
        business_location: cert.business_location || cert.address || null,
        contract_no: cert.contract_no || '',
        effective_from: cert.effective_from || '',
        effective_to: cert.effective_to || '',
        gcn_scope_col_1_text: cert.gcn_scope_col_1_text || null,
        gcn_scope_col_2_text: cert.gcn_scope_col_2_text || null,
        gcn_scope_col_3_text: cert.gcn_scope_col_3_text || null,
        offset_x_mm: cert.offset_x_mm || 0,
        offset_y_mm: cert.offset_y_mm || 0,
        created_at: cert.created_at || '',
        printed_at: cert.printed_at,
        printed_by: cert.printed_by,
        print_count: cert.print_count || 0,
        has_qr_image: cert.has_qr_image,
      };
      setRecord(mapped);
      setForm(toForm(mapped));
      setContext(contextRes.context);
    } catch (err: any) {
      setError(String(err?.message || 'Không tải được GCN'));
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Print mode: auto-trigger print dialog
  useEffect(() => {
    if (!isPrintRoute || !record) return;
    document.body.classList.add('certificate-print-mode');
    const timer = window.setTimeout(() => window.print(), 450);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('certificate-print-mode');
    };
  }, [record, isPrintRoute]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSave = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setSaving(true);
    try {
      const payload: CertificateUpdatePayload = {};
      if (form.certificate_no !== record?.certificate_no) payload.certificate_no = form.certificate_no;
      if (form.certificate_issue_date !== record?.certificate_issue_date) payload.certificate_issue_date = form.certificate_issue_date;
      if (form.status !== record?.status) payload.status = form.status;
      if (form.organization_name !== record?.organization_name) payload.organization_name = form.organization_name;
      if (form.business_registration_no !== record?.business_registration_no) payload.business_registration_no = form.business_registration_no;
      if (form.address !== record?.address) payload.address = form.address;
      if (form.business_sign_name !== record?.business_sign_name) payload.business_sign_name = form.business_sign_name;
      if (form.business_location !== record?.business_location) payload.business_location = form.business_location;
      if (form.contract_no !== record?.contract_no) payload.contract_no = form.contract_no;
      if (form.effective_from !== record?.effective_from) payload.effective_from = form.effective_from;
      if (form.effective_to !== record?.effective_to) payload.effective_to = form.effective_to;
      if (form.gcn_scope_col_1_text !== record?.gcn_scope_col_1_text) payload.gcn_scope_col_1_text = form.gcn_scope_col_1_text;
      if (form.gcn_scope_col_2_text !== record?.gcn_scope_col_2_text) payload.gcn_scope_col_2_text = form.gcn_scope_col_2_text;
      if (form.gcn_scope_col_3_text !== record?.gcn_scope_col_3_text) payload.gcn_scope_col_3_text = form.gcn_scope_col_3_text;
      if (form.qr_image_data !== record?.qr_image_data) payload.qr_image_data = form.qr_image_data;
      if (form.offset_x_mm !== record?.offset_x_mm) payload.offset_x_mm = form.offset_x_mm;
      if (form.offset_y_mm !== record?.offset_y_mm) payload.offset_y_mm = form.offset_y_mm;

      const res = await updateCertificate(token, certificateId, payload);
      if (res.ok) {
        showToast('Đã lưu GCN', 'success');
        await fetchData();
      } else {
        showToast(res.errors?.join(', ') || res.message || 'Lỗi khi lưu', 'error');
      }
    } catch (err: any) {
      showToast(String(err?.message || 'Lỗi khi lưu'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setSyncing(true);
    try {
      const res = await syncCertificate(token, certificateId);
      if (res.ok) {
        showToast(`Đã đồng bộ: ${res.synced_fields?.join(', ') || 'không có thay đổi'}`, 'success');
        await fetchData();
      } else {
        showToast(res.errors?.join(', ') || res.message || 'Lỗi khi đồng bộ', 'error');
      }
    } catch (err: any) {
      showToast(String(err?.message || 'Lỗi khi đồng bộ'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handlePrint = async (type: 'test' | 'final') => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setPrinting(true);
    try {
      const res = await printCertificate(token, certificateId, type);
      if (res.ok) {
        showToast(`Đã ${type === 'test' ? 'in thử' : 'in chính thức'}`, 'success');
        await fetchData();
      } else {
        showToast(res.message || 'Lỗi khi in', 'error');
      }
    } catch (err: any) {
      showToast(String(err?.message || 'Lỗi khi in'), 'error');
    } finally {
      setPrinting(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const statusTone = form.status === 'final_printed' ? 'success' : form.status === 'test_printed' ? 'warning' : 'neutral';

  const previewData: CertificatePreviewData = {
    certificate_no: form.certificate_no,
    certificate_issue_date: form.certificate_issue_date,
    certificate_issue_day: form.certificate_issue_date ? form.certificate_issue_date.split('-')[2] : '',
    certificate_issue_month: form.certificate_issue_date ? form.certificate_issue_date.split('-')[1] : '',
    certificate_issue_year: form.certificate_issue_date ? form.certificate_issue_date.split('-')[0] : '',
    organization_name: form.organization_name,
    business_registration_no: form.business_registration_no,
    address: form.address,
    business_sign_name: form.business_sign_name,
    business_location: form.business_location,
    contract_no: form.contract_no,
    effective_from: form.effective_from,
    effective_to: form.effective_to,
    gcn_scope_col_1_text: form.gcn_scope_col_1_text,
    gcn_scope_col_2_text: form.gcn_scope_col_2_text,
    gcn_scope_col_3_text: form.gcn_scope_col_3_text,
    qr_image_data: form.qr_image_data,
    offset_x_mm: form.offset_x_mm,
    offset_y_mm: form.offset_y_mm,
  };

  const busy = saving || syncing || printing;

  // Print route: show only the print view
  if (isPrintRoute) {
    if (loading) {
      return (
        <div className="gcn-locked-print-root">
          <div className="p-8">Đang tải GCN...</div>
        </div>
      );
    }
    if (error || !record) {
      return (
        <div className="gcn-locked-print-root">
          <div className="p-8">Không tìm thấy giấy chứng nhận.</div>
        </div>
      );
    }
    return (
      <div className="gcn-locked-print-root">
        <div className="gcn-locked-print-page">
          <CertificatePaperPreview certificate={previewData} mode="print" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Page>
        <PageHeader title="Đang tải..." description="" />
        <ContentCard>
          <div className="flex items-center justify-center py-12 text-zinc-500">
            Đang tải giấy chứng nhận...
          </div>
        </ContentCard>
      </Page>
    );
  }

  if (error || !record) {
    return (
      <Page>
        <PageHeader title="Lỗi" description={error || 'Không tìm thấy GCN'} />
        <ContentCard>
          <div className="flex items-center justify-center py-12">
            <Button variant="secondary" onClick={onBack}>Quay lại</Button>
          </div>
        </ContentCard>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        breadcrumb="/bg/contracts/certificates"
        title="Chi tiết giấy chứng nhận"
        description={record.certificate_no || `GCN #${certificateId}`}
        actions={
          <>
            <Button variant="secondary" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={onBack}>
              Quay lại
            </Button>
            <Button
              variant="secondary"
              leftIcon={<RefreshCwIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />}
              onClick={handleSync}
              disabled={busy}>
              Đồng bộ từ hợp đồng
            </Button>
            <Button
              variant="primary"
              leftIcon={<SaveIcon className="h-4 w-4" />}
              onClick={handleSave}
              disabled={busy}>
              Lưu GCN
            </Button>
            <Button
              variant="secondary"
              leftIcon={<PrinterIcon className="h-4 w-4" />}
              onClick={() => handlePrint('test')}
              disabled={busy}>
              In thử
            </Button>
            <Button
              variant="primary"
              leftIcon={<AwardIcon className="h-4 w-4" />}
              onClick={() => handlePrint('final')}
              disabled={busy}>
              In chính thức
            </Button>
          </>
        }
      />

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[520px_1fr]">
        <div className="space-y-5">
          {/* Info Card */}
          <ContentCard title="Thông tin GCN">
            <div className="space-y-0">
              <InfoRow label="Hợp đồng" value={record.contract_no} mono />
              <InfoRow label="Đơn vị" value={record.organization_name} />
              <InfoRow label="Hiệu lực từ" value={formatDate(record.effective_from)} mono />
              <InfoRow label="Hiệu lực đến" value={formatDate(record.effective_to)} mono />
              <InfoRow label="Số lần in" value={record.print_count} />
            </div>
          </ContentCard>

          {/* Edit Form */}
          <ContentCard title="Khung điền giấy chứng nhận">
            <div className="space-y-5">
              {/* Số và trạng thái */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Số và trạng thái</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Số GCN"
                    value={form.certificate_no}
                    onChange={(e) => updateField('certificate_no', e.target.value)}
                    placeholder="VD: 0137/2026.GCN_KA"
                  />
                  <Input
                    label="Ngày cấp"
                    type="date"
                    value={form.certificate_issue_date}
                    onChange={(e) => updateField('certificate_issue_date', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <Select
                      label="Trạng thái"
                      value={form.status}
                      onChange={(v) => updateField('status', v as CertificateStatus)}
                      options={STATUS_OPTIONS}
                    />
                  </div>
                </div>
              </section>

              {/* Thông tin đơn vị */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Thông tin đơn vị trên GCN</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Tên đơn vị"
                      value={form.organization_name}
                      onChange={(e) => updateField('organization_name', e.target.value)}
                    />
                  </div>
                  <Input
                    label="MST/ĐKKD"
                    value={form.business_registration_no}
                    onChange={(e) => updateField('business_registration_no', e.target.value)}
                  />
                  <Input
                    label="Bảng hiệu"
                    value={form.business_sign_name}
                    onChange={(e) => updateField('business_sign_name', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Địa chỉ đơn vị"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Địa điểm sử dụng"
                      value={form.business_location}
                      onChange={(e) => updateField('business_location', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              {/* Hiệu lực và hợp đồng */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Hiệu lực và hợp đồng</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Số hợp đồng"
                      value={form.contract_no}
                      onChange={(e) => updateField('contract_no', e.target.value)}
                    />
                  </div>
                  <Input
                    label="Hiệu lực từ"
                    type="date"
                    value={form.effective_from}
                    onChange={(e) => updateField('effective_from', e.target.value)}
                  />
                  <Input
                    label="Hiệu lực đến"
                    type="date"
                    value={form.effective_to}
                    onChange={(e) => updateField('effective_to', e.target.value)}
                  />
                </div>
              </section>

              {/* Phạm vi sử dụng */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Phạm vi sử dụng trên GCN</h3>
                <div className="grid grid-cols-1 gap-3">
                  <Textarea
                    label="Cột 1 - Nội dung sử dụng"
                    value={form.gcn_scope_col_1_text}
                    onChange={(e) => updateField('gcn_scope_col_1_text', e.target.value)}
                    rows={4}
                    placeholder="VD: Phong 101&#10;Phong 102&#10;Phong 103"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Textarea
                      label="Cột 2"
                      value={form.gcn_scope_col_2_text}
                      onChange={(e) => updateField('gcn_scope_col_2_text', e.target.value)}
                      rows={3}
                      placeholder="VD: 3 phong"
                    />
                    <Textarea
                      label="Cột 3"
                      value={form.gcn_scope_col_3_text}
                      onChange={(e) => updateField('gcn_scope_col_3_text', e.target.value)}
                      rows={3}
                      placeholder="VD: Karaoke&#10;(phong)"
                    />
                  </div>
                </div>
              </section>

              {/* Canh vị trí in */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Canh vị trí in</h3>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-zinc-600">Mã QR</label>
                  <div
                    className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-4 transition-colors hover:bg-zinc-50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateField('qr_image_data', String(reader.result || ''));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white">
                        {form.qr_image_data ? (
                          <img src={form.qr_image_data} alt="QR preview" className="h-full w-full object-contain" />
                        ) : (
                          <span className="px-2 text-center text-xs text-zinc-400">Kéo QR vào đây</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-medium">Kéo file QR PNG/JPG vào khung này</p>
                        <p className="text-xs text-zinc-500">
                          Hoặc chọn file, hệ thống sẽ tự đổi sang data URL để in vào mẫu GCN.
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                updateField('qr_image_data', String(reader.result || ''));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Textarea
                    value={form.qr_image_data}
                    onChange={(e) => updateField('qr_image_data', e.target.value)}
                    rows={2}
                    placeholder="Dán data:image/png;base64,... hoặc dữ liệu QR backend trả về"
                  />
                  <p className="text-xs text-zinc-500">QR sẽ in ở góc dưới bên trái mẫu GCN. Để trống nếu chưa có mã QR.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Dịch ngang (mm)"
                    type="number"
                    step={String(GCN_LOCKED_OFFSET.stepMm)}
                    value={String(form.offset_x_mm)}
                    onChange={(e) => updateField('offset_x_mm', Number(e.target.value) || 0)}
                  />
                  <Input
                    label="Dịch dọc (mm)"
                    type="number"
                    step={String(GCN_LOCKED_OFFSET.stepMm)}
                    value={String(form.offset_y_mm)}
                    onChange={(e) => updateField('offset_y_mm', Number(e.target.value) || 0)}
                  />
                </div>
              </section>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                <Button
                  variant="primary"
                  leftIcon={<SaveIcon className="h-4 w-4" />}
                  onClick={handleSave}
                  disabled={busy}>
                  Lưu thông tin GCN
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<RefreshCwIcon className="h-4 w-4" />}
                  onClick={() => record && setForm(toForm(record))}
                  disabled={busy}>
                  Hoàn tác thay đổi
                </Button>
              </div>
            </div>
          </ContentCard>
        </div>

        {/* Preview Pane */}
        <ContentCard
          title="Bản xem trước"
          description={
            <label className="flex items-center gap-2 text-sm text-zinc-500">
              <input
                type="checkbox"
                checked={showSafeArea}
                onChange={(e) => setShowSafeArea(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Khung canh
            </label>
          }>
          <CertificatePaperPreview certificate={previewData} showSafeArea={showSafeArea} />
        </ContentCard>
      </div>

      {/* Print Mode View */}
      <div className="gcn-locked-print-root gcn-locked-print-root--inline">
        <div className="gcn-locked-print-page">
          <CertificatePaperPreview certificate={previewData} mode="print" />
        </div>
      </div>
    </Page>
  );
}
