import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AwardIcon,
  ArrowLeftIcon,
  SearchIcon,
  FileTextIcon,
  PrinterIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Input } from '../components/app-ui/Input';
import { Textarea } from '../components/app-ui/Textarea';
import { Select } from '../components/app-ui/Select';
import { SearchBox } from '../components/app-ui/SearchBox';
import { CertificatePaperPreview } from '../modules/certificates/CertificatePaperPreview';
import { GCN_LOCKED_OFFSET } from '../modules/certificates/certificateLayoutLocked';
import type { CertificatePreviewData } from '../modules/certificates/certificateTypes';
import type { CertificatePreviewContext } from '../lib/certificatesClient';
import type { CertificateContextResult } from '../lib/contractsClient';
import {
  getCertificateContextDryRun,
  getContracts,
  getContractDetail,
} from '../lib/contractsClient';
import { RouteKey } from '../data/routes';

const TOKEN_KEY = 'vcpmc_new_app_access_token';

type PrintMode = 'contract' | 'free';

type FreeFormData = {
  certificate_no: string;
  certificate_issue_date: string;
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
  fieldOffsets: Record<string, { dx: number; dy: number }>;
  scopeColAlign: {
    col1: 'left' | 'center' | 'right';
    col2: 'left' | 'center' | 'right';
    col3: 'left' | 'center' | 'right';
  };
};

const emptyFree: FreeFormData = {
  certificate_no: '',
  certificate_issue_date: '',
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
  fieldOffsets: {},
  scopeColAlign: { col1: 'left', col2: 'center', col3: 'center' },
};

type EditableCertData = {
  certificate_no: string;
  certificate_issue_date: string;
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
  fieldOffsets: Record<string, { dx: number; dy: number }>;
  scopeColAlign: {
    col1: 'left' | 'center' | 'right';
    col2: 'left' | 'center' | 'right';
    col3: 'left' | 'center' | 'right';
  };
};

function buildEditableFromCtx(ctx: CertificatePreviewContext): EditableCertData {
  return {
    certificate_no: ctx.certificate_no || '',
    certificate_issue_date: ctx.certificate_issue_date || '',
    organization_name: ctx.organization_name,
    business_registration_no: ctx.business_registration_no || '',
    address: ctx.address || '',
    business_sign_name: ctx.business_sign_name || '',
    business_location: ctx.business_location || '',
    contract_no: ctx.contract_no || '',
    effective_from: ctx.effective_from || '',
    effective_to: ctx.effective_to || '',
    gcn_scope_col_1_text: ctx.gcn_scope_col_1_text || '',
    gcn_scope_col_2_text: ctx.gcn_scope_col_2_text || '',
    gcn_scope_col_3_text: ctx.gcn_scope_col_3_text || '',
    qr_image_data: ctx.qr_image_data || '',
    offset_x_mm: ctx.offset_x_mm || 0,
    offset_y_mm: ctx.offset_y_mm || 0,
    fieldOffsets: ctx.fieldOffsets || {},
    scopeColAlign: ctx.scopeColAlign || { col1: 'left', col2: 'center', col3: 'center' },
  };
}

type SimpleContractItem = {
  id: number;
  contract_no: string;
  organization_name: string;
  business_sign_name: string;
  domain_group: string;
};

export function CertificatePrintPage({
  onNavigate,
  initialContractId,
  onPrinted,
}: {
  onNavigate: (k: RouteKey) => void;
  initialContractId?: number | null;
  onPrinted?: () => void;
}) {
  const [mode, setMode] = useState<PrintMode>('contract');
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Contract mode state
  const [contractSearch, setContractSearch] = useState('');
  const [contractResults, setContractResults] = useState<SimpleContractItem[]>([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SimpleContractItem | null>(null);
  const [contractCtx, setContractCtx] = useState<CertificatePreviewContext | null>(null);
  const [contractCtxLoading, setContractCtxLoading] = useState(false);
  const [contractEditable, setContractEditable] = useState<EditableCertData | null>(null);

  // Free form state
  const [freeForm, setFreeForm] = useState<FreeFormData>(emptyFree);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  // Search contracts for certificate context
  const searchContracts = useCallback(async (q: string) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !q.trim()) {
      setContractResults([]);
      return;
    }
    setContractLoading(true);
    try {
      const res = await getContracts(token, {
        q,
        page: 1,
        page_size: 20,
      });
      const items: SimpleContractItem[] = res.items.map((c) => ({
        id: typeof c.id === 'string' ? parseInt(c.id, 10) : c.id,
        contract_no: c.contract_no || '',
        organization_name: c.customer_name || c.organization_name || '',
        business_sign_name: c.business_sign_name || '',
        domain_group: c.domain_group || c.domain || '',
      }));
      setContractResults(items);
    } catch (e: any) {
      showToast(String(e?.message || 'Lỗi tìm hợp đồng'), 'error');
    } finally {
      setContractLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (contractSearch.trim().length >= 2) {
        searchContracts(contractSearch);
      } else {
        setContractResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [contractSearch, searchContracts]);

  // Load context when contract is selected
  const loadContractContext = useCallback(async (contractId: number) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setContractCtxLoading(true);
    setContractCtx(null);
    try {
      const res = await getCertificateContextDryRun(token, contractId);
      if (res.ok) {
        setContractCtx(res.context);
        setContractEditable(buildEditableFromCtx(res.context));
      } else {
        showToast(res.message || 'Lỗi tải context', 'error');
      }
    } catch (e: any) {
      showToast(String(e?.message || 'Lỗi tải context'), 'error');
    } finally {
      setContractCtxLoading(false);
    }
  }, []);

  const handleSelectContract = (c: SimpleContractItem) => {
    setSelectedContract(c);
    setContractResults([]);
    setContractSearch('');
    setContractEditable(null);
    loadContractContext(c.id);
  };

  const buildPreviewFromContractCtx = (ctx: CertificatePreviewContext, editable: EditableCertData): CertificatePreviewData => {
    const dateRaw = editable.certificate_issue_date || '';
    let day = '', month = '', year = '';
    if (dateRaw && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      [year, month, day] = dateRaw.split('-');
    } else if (dateRaw && dateRaw.includes('/')) {
      [day, month, year] = dateRaw.split('/');
    }
    return {
      certificate_no: editable.certificate_no,
      certificate_issue_date: editable.certificate_issue_date,
      certificate_issue_day: day,
      certificate_issue_month: month,
      certificate_issue_year: year,
      organization_name: editable.organization_name,
      business_registration_no: editable.business_registration_no,
      address: editable.address,
      business_sign_name: editable.business_sign_name,
      business_location: editable.business_location,
      contract_no: editable.contract_no,
      effective_from: editable.effective_from || '',
      effective_to: editable.effective_to || '',
      gcn_scope_col_1_text: editable.gcn_scope_col_1_text,
      gcn_scope_col_2_text: editable.gcn_scope_col_2_text,
      gcn_scope_col_3_text: editable.gcn_scope_col_3_text,
      qr_image_data: editable.qr_image_data || '',
      offset_x_mm: editable.offset_x_mm,
      offset_y_mm: editable.offset_y_mm,
      fieldOffsets: editable.fieldOffsets,
      scopeColAlign: editable.scopeColAlign,
    };
  };

  const buildPreviewFromFree = (): CertificatePreviewData => {
    const d = freeForm;
    return {
      certificate_no: d.certificate_no,
      certificate_issue_date: d.certificate_issue_date,
      certificate_issue_day: d.certificate_issue_date ? d.certificate_issue_date.split('-')[2] : '',
      certificate_issue_month: d.certificate_issue_date ? d.certificate_issue_date.split('-')[1] : '',
      certificate_issue_year: d.certificate_issue_date ? d.certificate_issue_date.split('-')[0] : '',
      organization_name: d.organization_name,
      business_registration_no: d.business_registration_no,
      address: d.address,
      business_sign_name: d.business_sign_name,
      business_location: d.business_location,
      contract_no: d.contract_no,
      effective_from: d.effective_from,
      effective_to: d.effective_to,
      gcn_scope_col_1_text: d.gcn_scope_col_1_text,
      gcn_scope_col_2_text: d.gcn_scope_col_2_text,
      gcn_scope_col_3_text: d.gcn_scope_col_3_text,
      qr_image_data: d.qr_image_data,
      offset_x_mm: d.offset_x_mm,
      offset_y_mm: d.offset_y_mm,
      fieldOffsets: d.fieldOffsets,
      scopeColAlign: d.scopeColAlign,
    };
  };

  const previewData = (() => {
    if (mode === 'contract' && contractEditable && contractCtx) {
      return buildPreviewFromContractCtx(contractCtx, contractEditable);
    }
    if (mode === 'free') {
      return buildPreviewFromFree();
    }
    return null;
  })();

  const updateFree = <K extends keyof FreeFormData>(key: K, value: FreeFormData[K]) => {
    setFreeForm(prev => ({ ...prev, [key]: value }));
  };

  const updateFreeFieldOffset = (key: string, dx: number, dy: number) => {
    setFreeForm(prev => ({
      ...prev,
      fieldOffsets: { ...prev.fieldOffsets, [key]: { dx, dy } },
    }));
  };

  const resetFreeFieldOffset = (key: string) => {
    setFreeForm(prev => {
      const next = { ...prev.fieldOffsets };
      delete next[key];
      return { ...prev, fieldOffsets: next };
    });
  };

  const resetAllFreeFieldOffsets = () => {
    setFreeForm(prev => ({ ...prev, fieldOffsets: {} }));
  };

  // Auto-load contract context when navigated with initialContractId
  useEffect(() => {
    if (!initialContractId) return;
    let cancelled = false;

    async function fetchAndSelect() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const detail = await getContractDetail(token, initialContractId);
        if (cancelled) return;
        const item: SimpleContractItem = {
          id: detail.id,
          contract_no: detail.contract_no || '',
          organization_name: detail.customer?.name || '',
          business_sign_name: detail.customer?.signage || '',
          domain_group: detail.domain?.domain_group || '',
        };
        setSelectedContract(item);
        setContractSearch('');
        setContractResults([]);
        setMode('contract');
        await loadContractContext(initialContractId);
      } catch {
        // Silently ignore — user can still search manually
      }
    }

    fetchAndSelect();
    return () => { cancelled = true; };
  }, [initialContractId, loadContractContext]);

  const handlePrint = () => {
    const paperEl = document.querySelector<HTMLElement>('.gcn-locked-paper');
    if (!paperEl) return;

    // Get QR image src to re-attach in cloned element
    const qrImg = paperEl.querySelector<HTMLImageElement>('.gcn-locked-qr-image');
    const qrSrc = qrImg?.src || '';

    // Clone just the paper element
    const clonedPaper = paperEl.cloneNode(true) as HTMLElement;
    // Remove screen/print variant classes so it renders cleanly
    clonedPaper.classList.remove('gcn-locked-paper--screen', 'gcn-locked-paper--print');
    // Fix QR image src in cloned element
    if (qrSrc) {
      const clonedQrImg = clonedPaper.querySelector<HTMLImageElement>('.gcn-locked-qr-image');
      if (clonedQrImg) clonedQrImg.src = qrSrc;
    }

    // Build standalone print page
    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>In Giay Chung Nhan</title>
  <style>
    @page { size: 209.6mm 296.6mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 209.6mm; height: 296.6mm; overflow: hidden; background: #fff; font-family: "Times New Roman", serif; }
    .gcn-locked-paper {
      position: relative; width: 209.6mm; height: 296.6mm;
      background: #fff; overflow: hidden; color: #111; font-family: "Times New Roman", serif;
    }
    .gcn-locked-field {
      position: absolute; box-sizing: border-box; padding: 0;
      white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .gcn-locked-bottom-anchor {
      position: absolute; box-sizing: border-box; display: block; padding: 0;
      font-size: 12.5pt; line-height: 1.15; overflow-wrap: anywhere;
    }
    .gcn-locked-qr-field {
      position: absolute; display: flex; align-items: center; justify-content: center;
      box-sizing: border-box; overflow: hidden;
    }
    .gcn-locked-qr-image { width: 100%; height: 100%; object-fit: contain; display: block; }
    .gcn-locked-qr-placeholder {
      position: absolute; left: 0; top: 0; width: 100%; height: 100%;
      border: 1px dashed #999; color: #555;
      display: flex; align-items: center; justify-content: center;
      font: 7pt "Times New Roman", serif;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
  </style>
</head>
<body>${clonedPaper.outerHTML}</body>
</html>`;

    // Open a new window with only the paper HTML
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=no,toolbar=no,location=no,status=no,menubar=no');
    if (!printWindow) {
      alert('Trinh duyet chan popup. Vui long cho phep popup cho trang nay.');
      return;
    }

    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Save originals for auto-reset after print
    const origContractOffsets = contractEditable ? { ...contractEditable.fieldOffsets } : {};
    const origContractAlign = contractEditable ? { ...contractEditable.scopeColAlign } : null;
    const origFreeOffsets = { ...freeForm.fieldOffsets };
    const origFreeAlign = { ...freeForm.scopeColAlign };

    // After print dialog closes, reset all offsets to original
    const handleAfterPrint = () => {
      if (mode === 'contract' && contractEditable) {
        setContractEditable(prev => prev ? { ...prev, fieldOffsets: origContractOffsets } : null);
      } else {
        setFreeForm(prev => ({ ...prev, fieldOffsets: origFreeOffsets }));
      }
    };

    printWindow.onafterprint = () => {
      handleAfterPrint();
      printWindow.close();
    };

    // Fallback: also close after timeout if onafterprint doesn't fire
    setTimeout(() => {
      try { printWindow.close(); } catch { /* ignore */ }
    }, 60_000);

    // Wait for window load + brief render delay for QR image, then print
    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); }, 800);
    };
  };

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('contracts.gcn')}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-900">In giấy chứng nhận</h1>
            <p className="text-sm text-zinc-500">Chọn hợp đồng hoặc điền thông tin tự do để in GCN</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<PrinterIcon className="h-4 w-4" />}
            onClick={previewData ? handlePrint : undefined}>
            In GCN
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="bg-white border-b border-zinc-200 px-6">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('contract')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mode === 'contract'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}>
            <span className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" />
              In từ hợp đồng
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('free')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mode === 'free'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}>
            <span className="flex items-center gap-2">
              <AwardIcon className="h-4 w-4" />
              In tự do
            </span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
          {message}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <div className="w-[560px] shrink-0 overflow-y-auto border-r border-zinc-200 p-6 bg-white">
          {mode === 'contract' ? (
            <ContractPrintPanel
              search={contractSearch}
              onSearchChange={setContractSearch}
              results={contractResults}
              loading={contractLoading}
              selected={selectedContract}
              onSelect={handleSelectContract}
              ctx={contractCtx}
              ctxLoading={contractCtxLoading}
              editable={contractEditable}
              onEditableChange={setContractEditable}
            />
          ) : (
            <FreePrintPanel
              freeForm={freeForm}
              updateFree={updateFree}
              updateFreeFieldOffset={updateFreeFieldOffset}
              resetFreeFieldOffset={resetFreeFieldOffset}
              resetAllFreeFieldOffsets={resetAllFreeFieldOffsets}
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-6">
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
            {previewData ? (
              <CertificatePaperPreview certificate={previewData} showSafeArea={showSafeArea} />
            ) : (
              <div className="flex h-96 items-center justify-center text-sm text-zinc-400">
                Chọn hợp đồng hoặc điền thông tin để xem trước
              </div>
            )}
          </ContentCard>
        </div>
      </div>
    </div>
  );
}

// ─── Field Nudge Panel (Compact Accordion) ─────────────────────────────────────

type FieldOffsetMap = Record<string, { dx: number; dy: number }>;

const FIELD_DEFS = [
  { key: 'organization_name', label: 'Tên đơn vị' },
  { key: 'business_registration_no', label: 'MST/ĐKKD' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'business_sign_name', label: 'Bảng hiệu' },
  { key: 'business_location', label: 'Địa điểm SD' },
  { key: 'gcn_scope_col_1_text', label: 'Cột 1' },
  { key: 'gcn_scope_col_2_text', label: 'Cột 2' },
  { key: 'gcn_scope_col_3_text', label: 'Cột 3' },
  { key: 'contract_no', label: 'Số HĐ' },
  { key: 'effective_from', label: 'Ngày bắt đầu' },
  { key: 'effective_to', label: 'Ngày kết thúc' },
  { key: 'certificate_no', label: 'Số GCN' },
] as const;

function NumberStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="flex h-6 w-5 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-10 rounded border border-zinc-200 bg-white text-center text-xs text-zinc-700 focus:border-indigo-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-6 w-5 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
      >
        +
      </button>
    </div>
  );
}

function FieldNudgePanel({
  fieldOffsets,
  onUpdate,
  onReset,
  onResetAll,
}: {
  fieldOffsets: FieldOffsetMap;
  onUpdate: (key: string, dx: number, dy: number) => void;
  onReset: (key: string) => void;
  onResetAll: () => void;
}) {
  const [open, setOpen] = useState(false);

  const modifiedCount = useMemo(
    () => FIELD_DEFS.filter((f) => {
      const fo = fieldOffsets[f.key];
      return fo && (fo.dx !== 0 || fo.dy !== 0);
    }).length,
    [fieldOffsets]
  );

  return (
    <section>
      {/* Compact header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm transition-colors hover:bg-zinc-100"
      >
        <span className="font-semibold text-zinc-700">
          Dịch từng trường
          {modifiedCount > 0 && (
            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
              {modifiedCount}/{FIELD_DEFS.length}
            </span>
          )}
        </span>
        <span className="text-xs text-zinc-400">1px ≈ 0.35mm</span>
        <ChevronDownIcon
          className={`ml-2 h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded rows */}
      {open && (
        <div className="mt-1.5 rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {FIELD_DEFS.map(({ key, label }) => {
            const fo = fieldOffsets[key] ?? { dx: 0, dy: 0 };
            const isModified = fo.dx !== 0 || fo.dy !== 0;
            return (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50"
              >
                <span className="w-24 shrink-0 truncate text-xs text-zinc-600">{label}</span>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="w-3">X</span>
                  <NumberStepper
                    value={fo.dx}
                    onChange={(dx) => onUpdate(key, dx, fo.dy)}
                  />
                  <span className="w-3">Y</span>
                  <NumberStepper
                    value={fo.dy}
                    onChange={(dy) => onUpdate(key, fo.dx, dy)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onReset(key)}
                  title="Reset trường này"
                  className={`ml-auto shrink-0 text-xs transition-colors ${isModified ? 'text-zinc-400 hover:text-rose-500' : 'text-zinc-200 cursor-default'}`}
                  disabled={!isModified}
                >
                  ↺
                </button>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50 rounded-b-lg">
            <span className="text-xs text-amber-600">Dịch 1px ≈ 0.35mm trên A4</span>
            {modifiedCount > 0 && (
              <button
                type="button"
                onClick={onResetAll}
                className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
              >
                Reset tất cả ({modifiedCount})
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Contract Mode Panel ───────────────────────────────────────────────────────

function ContractPrintPanel({
  search,
  onSearchChange,
  results,
  loading,
  selected,
  onSelect,
  ctx,
  ctxLoading,
  editable,
  onEditableChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  results: SimpleContractItem[];
  loading: boolean;
  selected: SimpleContractItem | null;
  onSelect: (c: SimpleContractItem) => void;
  ctx: CertificatePreviewContext | null;
  ctxLoading: boolean;
  editable: EditableCertData | null;
  onEditableChange: (e: EditableCertData | null) => void;
}) {
  const update = <K extends keyof EditableCertData>(key: K, value: EditableCertData[K]) => {
    if (editable) onEditableChange({ ...editable, [key]: value });
  };

  const updateFieldOffset = (key: string, dx: number, dy: number) => {
    if (!editable) return;
    onEditableChange({
      ...editable,
      fieldOffsets: { ...editable.fieldOffsets, [key]: { dx, dy } },
    });
  };

  const resetFieldOffset = (key: string) => {
    if (!editable) return;
    const next = { ...editable.fieldOffsets };
    delete next[key];
    onEditableChange({ ...editable, fieldOffsets: next });
  };

  const resetAllFieldOffsets = () => {
    if (!editable) return;
    onEditableChange({ ...editable, fieldOffsets: {} });
  };

  const hasEdits = editable && ctx && JSON.stringify(editable) !== JSON.stringify(buildEditableFromCtx(ctx));

  return (
    <div className="space-y-5">
      <ContentCard title="Tìm hợp đồng">
        <div className="space-y-3">
          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Tìm số hợp đồng, tên đơn vị, bảng hiệu..."
          />
          {loading && (
            <p className="text-sm text-zinc-500">Đang tìm...</p>
          )}
          {results.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100 max-h-64 overflow-y-auto">
              {results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c)}
                  className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors">
                  <p className="text-sm font-medium text-zinc-900">{c.contract_no || '(Không số)'}</p>
                  <p className="text-xs text-zinc-500">{c.organization_name} {c.business_sign_name ? `— ${c.business_sign_name}` : ''}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </ContentCard>

      {selected && (
        <ContentCard title="Hợp đồng đã chọn">
          <div className="space-y-2">
            <InfoRow label="Số HĐ" value={selected.contract_no} mono />
            <InfoRow label="Đơn vị" value={selected.organization_name} />
            <InfoRow label="Bảng hiệu" value={selected.business_sign_name} />
            <InfoRow label="Domain" value={selected.domain_group} />
          </div>
        </ContentCard>
      )}

      {ctxLoading && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          Đang tải context GCN...
        </div>
      )}

      {editable && (
        <ContentCard title="Thông tin GCN (chỉnh sửa được)">
          {hasEdits && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span>⚠️ Đã chỉnh sửa — in sẽ dùng dữ liệu đã thay đổi</span>
            </div>
          )}
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Số GCN</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Số GCN"
                  value={editable.certificate_no}
                  onChange={(e) => update('certificate_no', e.target.value)}
                />
                <Input
                  label="Ngày cấp"
                  type="date"
                  value={editable.certificate_issue_date}
                  onChange={(e) => update('certificate_issue_date', e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Thông tin đơn vị</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Tên đơn vị"
                    value={editable.organization_name}
                    onChange={(e) => update('organization_name', e.target.value)}
                  />
                </div>
                <Input
                  label="MST/ĐKKD"
                  value={editable.business_registration_no}
                  onChange={(e) => update('business_registration_no', e.target.value)}
                />
                <Input
                  label="Bảng hiệu"
                  value={editable.business_sign_name}
                  onChange={(e) => update('business_sign_name', e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Textarea
                    label="Địa chỉ"
                    value={editable.address}
                    onChange={(e) => update('address', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label="Địa điểm sử dụng"
                    value={editable.business_location}
                    onChange={(e) => update('business_location', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Hợp đồng & Hiệu lực</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Số hợp đồng"
                    value={editable.contract_no}
                    onChange={(e) => update('contract_no', e.target.value)}
                  />
                </div>
                <Input
                  label="Hiệu lực từ"
                  type="date"
                  value={editable.effective_from}
                  onChange={(e) => update('effective_from', e.target.value)}
                />
                <Input
                  label="Hiệu lực đến"
                  type="date"
                  value={editable.effective_to}
                  onChange={(e) => update('effective_to', e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Phạm vi sử dụng</h3>
              <Textarea
                label="Cột 1"
                value={editable.gcn_scope_col_1_text}
                onChange={(e) => update('gcn_scope_col_1_text', e.target.value)}
                rows={4}
                placeholder="VD: Phong 101&#10;Phong 102&#10;Phong 103"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Textarea
                  label="Cột 2"
                  value={editable.gcn_scope_col_2_text}
                  onChange={(e) => update('gcn_scope_col_2_text', e.target.value)}
                  rows={3}
                />
                <Textarea
                  label="Cột 3"
                  value={editable.gcn_scope_col_3_text}
                  onChange={(e) => update('gcn_scope_col_3_text', e.target.value)}
                  rows={3}
                />
              </div>
            </section>

            {/* ── Scope columns alignment ───────────────────────────── */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-700">Canh cột 1 / 2 / 3</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['col1', 'col2', 'col3'] as const).map((col) => (
                  <div key={col} className="rounded-lg border border-zinc-200 p-2">
                    <p className="text-xs text-zinc-500 mb-1.5">Cột {col.replace('col', '')}</p>
                    <div className="grid grid-cols-3 gap-1">
                      {(['left', 'center', 'right'] as const).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() => {
                            const newAlign = { ...editable.scopeColAlign, [col]: al };
                            update('scopeColAlign', newAlign);
                          }}
                          className={`rounded py-1 text-xs font-medium transition-colors ${
                            editable.scopeColAlign[col] === al
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-indigo-50'
                          }`}
                        >
                          {al === 'left' ? '⬅' : al === 'center' ? '⬜' : '➡'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Global offset ─────────────────────────────────── */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-700">Dịch vị trí in (toàn trang)</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Dịch ngang (mm)"
                  type="number"
                  step={GCN_LOCKED_OFFSET.stepMm}
                  value={String(editable.offset_x_mm)}
                  onChange={(e) => update('offset_x_mm', Number(e.target.value) || 0)}
                />
                <Input
                  label="Dịch dọc (mm)"
                  type="number"
                  step={GCN_LOCKED_OFFSET.stepMm}
                  value={String(editable.offset_y_mm)}
                  onChange={(e) => update('offset_y_mm', Number(e.target.value) || 0)}
                />
              </div>
            </section>

            {/* ── Per-field nudge (compact accordion) ──────────────── */}
            <FieldNudgePanel
              fieldOffsets={editable.fieldOffsets}
              onUpdate={(key, dx, dy) => updateFieldOffset(key, dx, dy)}
              onReset={resetFieldOffset}
              onResetAll={resetAllFieldOffsets}
            />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-700">Ảnh QR</h3>
              <QrUploadZone
                value={editable.qr_image_data}
                onChange={(dataUrl) => update('qr_image_data', dataUrl)}
              />
            </section>

            {ctx.warnings && ctx.warnings.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                {ctx.warnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            )}
          </div>
        </ContentCard>
      )}
    </div>
  );
}

// ─── Free Form Panel ──────────────────────────────────────────────────────────

function FreePrintPanel({
  freeForm,
  updateFree,
  updateFreeFieldOffset,
  resetFreeFieldOffset,
  resetAllFreeFieldOffsets,
}: {
  freeForm: FreeFormData;
  updateFree: <K extends keyof FreeFormData>(key: K, value: FreeFormData[K]) => void;
  updateFreeFieldOffset: (key: string, dx: number, dy: number) => void;
  resetFreeFieldOffset: (key: string) => void;
  resetAllFreeFieldOffsets: () => void;
}) {
  const update = <K extends keyof FreeFormData>(key: K, value: FreeFormData[K]) => {
    updateFree(key, value);
  };

  return (
    <div className="space-y-5">
      <ContentCard title="Thông tin GCN">
        <div className="space-y-5">
          {/* Số và trạng thái */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">Số GCN</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Số GCN"
                value={freeForm.certificate_no}
                onChange={(e) => updateFree('certificate_no', e.target.value)}
                placeholder="VD: 0137/2026.GCN_KA"
              />
              <Input
                label="Ngày cấp"
                type="date"
                value={freeForm.certificate_issue_date}
                onChange={(e) => updateFree('certificate_issue_date', e.target.value)}
              />
            </div>
          </section>

          {/* Thông tin đơn vị */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">Thông tin đơn vị</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Tên đơn vị"
                  value={freeForm.organization_name}
                  onChange={(e) => updateFree('organization_name', e.target.value)}
                />
              </div>
              <Input
                label="MST/ĐKKD"
                value={freeForm.business_registration_no}
                onChange={(e) => updateFree('business_registration_no', e.target.value)}
              />
              <Input
                label="Bảng hiệu"
                value={freeForm.business_sign_name}
                onChange={(e) => updateFree('business_sign_name', e.target.value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Địa chỉ"
                  value={freeForm.address}
                  onChange={(e) => updateFree('address', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Địa điểm sử dụng"
                  value={freeForm.business_location}
                  onChange={(e) => updateFree('business_location', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Hợp đồng & hiệu lực */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">Hợp đồng & Hiệu lực</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Số hợp đồng"
                  value={freeForm.contract_no}
                  onChange={(e) => updateFree('contract_no', e.target.value)}
                />
              </div>
              <Input
                label="Hiệu lực từ"
                type="date"
                value={freeForm.effective_from}
                onChange={(e) => updateFree('effective_from', e.target.value)}
              />
              <Input
                label="Hiệu lực đến"
                type="date"
                value={freeForm.effective_to}
                onChange={(e) => updateFree('effective_to', e.target.value)}
              />
            </div>
          </section>

          {/* Phạm vi */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">Phạm vi sử dụng</h3>
            <Textarea
              label="Cột 1"
              value={freeForm.gcn_scope_col_1_text}
              onChange={(e) => updateFree('gcn_scope_col_1_text', e.target.value)}
              rows={4}
              placeholder="VD: Phong 101&#10;Phong 102&#10;Phong 103"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Textarea
                label="Cột 2"
                value={freeForm.gcn_scope_col_2_text}
                onChange={(e) => updateFree('gcn_scope_col_2_text', e.target.value)}
                rows={3}
              />
              <Textarea
                label="Cột 3"
                value={freeForm.gcn_scope_col_3_text}
                onChange={(e) => updateFree('gcn_scope_col_3_text', e.target.value)}
                rows={3}
              />
            </div>
          </section>

          {/* ── Scope columns alignment ───────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700">Canh cột 1 / 2 / 3</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['col1', 'col2', 'col3'] as const).map((col) => (
                <div key={col} className="rounded-lg border border-zinc-200 p-2">
                  <p className="text-xs text-zinc-500 mb-1.5">Cột {col.replace('col', '')}</p>
                  <div className="grid grid-cols-3 gap-1">
                    {(['left', 'center', 'right'] as const).map((al) => (
                      <button
                        key={al}
                        type="button"
                        onClick={() => {
                          const newAlign = { ...freeForm.scopeColAlign, [col]: al };
                          update('scopeColAlign', newAlign);
                        }}
                        className={`rounded py-1 text-xs font-medium transition-colors ${
                          freeForm.scopeColAlign[col] === al
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-indigo-50'
                        }`}
                      >
                        {al === 'left' ? '⬅' : al === 'center' ? '⬜' : '➡'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Global offset ─────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-700">Dịch vị trí in (toàn trang)</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Dịch ngang (mm)"
                type="number"
                step={GCN_LOCKED_OFFSET.stepMm}
                value={String(freeForm.offset_x_mm)}
                onChange={(e) => updateFree('offset_x_mm', Number(e.target.value) || 0)}
              />
              <Input
                label="Dịch dọc (mm)"
                type="number"
                step={GCN_LOCKED_OFFSET.stepMm}
                value={String(freeForm.offset_y_mm)}
                onChange={(e) => updateFree('offset_y_mm', Number(e.target.value) || 0)}
              />
            </div>
          </section>

          {/* ── Per-field nudge (compact accordion) ──────────────── */}
          <FieldNudgePanel
            fieldOffsets={freeForm.fieldOffsets}
            onUpdate={(key, dx, dy) => updateFreeFieldOffset(key, dx, dy)}
            onReset={resetFreeFieldOffset}
            onResetAll={resetAllFreeFieldOffsets}
          />

          {/* Ảnh QR */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">Ảnh QR</h3>
            <QrUploadZone
              value={freeForm.qr_image_data}
              onChange={(dataUrl) => updateFree('qr_image_data', dataUrl)}
            />
          </section>
        </div>
      </ContentCard>
    </div>
  );
}

// ─── QR Upload Zone ───────────────────────────────────────────────────────────

function QrUploadZone({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Init preview from existing value
  useEffect(() => {
    if (value) setPreview(value);
    else setPreview(null);
  }, [value]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? 'border-indigo-400 bg-indigo-50'
            : preview
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-zinc-300 bg-zinc-50 hover:border-indigo-300 hover:bg-indigo-50/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="QR preview" className="h-24 w-24 object-contain rounded" />
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-500 hover:text-rose-700 hover:underline">
              Xóa ảnh QR
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-zinc-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200">
              <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-zinc-700">Kéo & thả ảnh QR vào đây</p>
            <p>hoặc</p>
            <label className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
              Chọn file
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileInput} />
            </label>
          </div>
        )}
      </div>
      {preview && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Đã tải ảnh QR thành công
        </p>
      )}
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  const display = value == null || value === '' ? '—' : String(value);
  return (
    <div className="grid gap-1 border-b border-zinc-100 py-2 text-sm sm:grid-cols-[120px_1fr]">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono tabular-nums' : ''} ${!value ? 'text-zinc-400 italic' : 'text-zinc-900'}`}>
        {display}
      </span>
    </div>
  );
}
