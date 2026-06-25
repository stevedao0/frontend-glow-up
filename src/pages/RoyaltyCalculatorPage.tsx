/**
 * Tính tiền bản quyền âm nhạc theo Nghị định 17/2023/NĐ-CP
 *
 * Ngôn ngữ thiết kế "Cream & Marine":
 *  - Nền kem #F9F7F2, thẻ trắng, viền #E5E1D8
 *  - Accent navy #00384D (chữ + nút primary + waterfall panel)
 *  - Heading: Playfair Display (serif editorial), thân: Inter
 *  - Số liệu tabular monospace, vi-VN
 *  - Bố cục: trái = engine (settings + field cards), phải = sidebar tổng
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as Lucide from 'lucide-react';
import {
  CalculatorIcon, InfoIcon, RotateCcwIcon, FileDownIcon, ChevronDownIcon,
  CheckCircle2Icon, AlertTriangleIcon, Building2Icon as B2Icon,
  PlusIcon, XIcon, SearchIcon,
} from 'lucide-react';
import {
  FIELDS, FieldDef, FieldResult, computeQuoteTotals, formatVND, formatCoef,
} from '../lib/royaltyCalc';
import { numberToVietnameseWords } from '../lib/numberToVietnameseWords';
import { exportRoyaltyQuoteDocx } from '../lib/exportRoyaltyQuoteDocx';

// Palette tokens (kept inline so the popup is self-contained)
const C = {
  cream: '#F9F7F2',
  paper: '#FFFFFF',
  subtle: '#FAF9F6',
  line: '#E5E1D8',
  lineStrong: '#D9D3C7',
  ink: '#1A1A1A',
  muted: '#6B665F',
  mute2: '#8C877E',
  navy: '#00384D',
  navy600: '#0A4C66',
  ember: '#B45309',
};

const SERIF: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' };

// Phân loại đô thị (NĐ 134/2026 sửa đổi Phụ lục II NĐ 17/2023)
const URBAN_OPTIONS = [
  { id: 'special', label: 'Hà Nội / TP. HCM', factor: 1.0 },
  { id: 'I', label: 'Đô thị loại I', factor: 0.8 },
  { id: 'II', label: 'Đô thị loại II', factor: 0.5 },
  { id: 'III', label: 'Đô thị loại III', factor: 0.2 },
  { id: 'III_remote', label: 'Loại III · vùng sâu/xa/ĐB khó khăn', factor: 0.1 },
] as const;
type UrbanId = (typeof URBAN_OPTIONS)[number]['id'];
const DEFAULT_MLCS = 2_340_000;
const DEFAULT_VAT = 0.08;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export function RoyaltyCalculatorPage() {
  const [baseSalary, setBaseSalary] = useState<number>(DEFAULT_MLCS);
  const [urban, setUrban] = useState<UrbanId>('special');
  const [supportPct, setSupportPct] = useState<number>(0);
  const [vatPct, setVatPct] = useState<number>(DEFAULT_VAT);
  const [contractMonths, setContractMonths] = useState<number>(12);
  const [inputs, setInputs] = useState<Record<string, Record<string, number>>>({});

  const [customer, setCustomer] = useState({ name: '', address: '', representative: '' });
  const [exporting, setExporting] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const urbanFactor = URBAN_OPTIONS.find((u) => u.id === urban)!.factor;
  const urbanLabel = URBAN_OPTIONS.find((u) => u.id === urban)!.label;

  const setFieldInput = (fid: string, key: string, value: number) => {
    setInputs((prev) => ({ ...prev, [fid]: { ...(prev[fid] || {}), [key]: value } }));
    setSelectedIds((prev) => prev.has(fid) ? prev : new Set(prev).add(fid));
  };
  const addField = (fid: string) => {
    setSelectedIds((prev) => new Set(prev).add(fid));
    setPickerOpen(false); setPickerQuery('');
  };
  const removeField = (fid: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(fid); return n; });
    setInputs((prev) => { const n = { ...prev }; delete n[fid]; return n; });
  };
  const resetAll = () => { setInputs({}); setSelectedIds(new Set()); setExpandedField(null); };

  const perField = useMemo(() => FIELDS.map((f) => {
    const vals = inputs[f.id] || {};
    return { field: f, vals, result: f.compute(vals, baseSalary) };
  }), [inputs, baseSalary]);

  const visibleFields = perField.filter((p) => selectedIds.has(p.field.id) || p.result.hasInput);
  const activeFields = perField.filter((p) => p.result.hasInput);
  const availableToAdd = FIELDS.filter((f) =>
    !selectedIds.has(f.id) &&
    (pickerQuery.trim() === '' || f.name.toLowerCase().includes(pickerQuery.toLowerCase()))
  );
  const totals = useMemo(() => computeQuoteTotals({
    perField: perField.map((p) => p.result),
    urbanFactor, supportPct, vatPct,
  }), [perField, urbanFactor, supportPct, vatPct]);

  const handleExport = async () => {
    if (activeFields.length === 0) return;
    setExporting(true);
    try {
      await exportRoyaltyQuoteDocx({
        customer, contractMonths, baseSalary, urbanLabel, urbanFactor,
        supportPct, vatPct,
        perField: activeFields.map(({ field, vals, result }) => ({ fieldId: field.id, vals, result })),
        totals, quoteDate: new Date().toLocaleDateString('vi-VN'),
      });
    } finally { setExporting(false); }
  };

  return (
    <div
      className="rc-light text-[15px] antialiased"
      style={{ background: C.cream, color: C.ink, fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT — ENGINE
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-6 lg:p-8 space-y-6 lg:border-r" style={{ borderColor: C.line }}>
          {/* Hero */}
          <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b" style={{ borderColor: C.line }}>
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1.5" style={{ color: C.navy }}>
                VCPMC · CÔNG CỤ BÁO GIÁ
              </div>
              <h1 className="text-[28px] leading-tight font-bold" style={{ ...SERIF, color: C.navy }}>
                Tính toán Tiền bản quyền
              </h1>
              <p className="text-xs italic tracking-wider uppercase mt-1" style={{ color: C.muted }}>
                Căn cứ Nghị định số 17/2023/NĐ-CP · 17 lĩnh vực
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold tracking-widest" style={{ color: C.mute2 }}>Mức lương cơ sở</div>
              <div className="font-mono text-xl font-bold tabular-nums" style={{ color: C.navy }}>{formatVND(baseSalary)}</div>
            </div>
          </header>

          {/* Customer + Global settings panel */}
          <section
            className="rounded-lg border p-5 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-5"
            style={{ background: C.subtle, borderColor: C.line }}
          >
            <div className="md:col-span-2 space-y-4">
              <Field label="Đơn vị sử dụng">
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Công ty TNHH Giải trí ABC"
                  className="w-full bg-transparent border-b py-1.5 text-sm outline-none transition-colors"
                  style={{ borderColor: C.lineStrong }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.navy)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
                />
              </Field>
              <Field label="Địa chỉ">
                <input
                  type="text"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                  className="w-full bg-transparent border-b py-1.5 text-sm outline-none"
                  style={{ borderColor: C.lineStrong }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.navy)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Thời hạn hợp đồng">
                  <div className="relative">
                    <input
                      type="number" min={1} value={contractMonths || ''}
                      onChange={(e) => setContractMonths(Number(e.target.value) || 1)}
                      className="w-full bg-transparent border-b py-1.5 pr-12 text-sm font-mono font-semibold outline-none tabular-nums"
                      style={{ borderColor: C.lineStrong, color: C.ink }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.navy)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
                    />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: C.mute2 }}>tháng</span>
                  </div>
                </Field>
                <Field label="Phân loại đô thị">
                  <UrbanSelect value={urban} onChange={setUrban} />
                </Field>
              </div>
              <Field label="Mức lương cơ sở (MLCS)">
                <div className="relative">
                  <input
                    type="number" value={baseSalary || ''} onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                    className="w-full bg-transparent border-b py-1.5 pr-8 text-sm font-mono font-semibold outline-none tabular-nums"
                    style={{ borderColor: C.lineStrong }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.navy)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: C.mute2 }}>đ</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-md border p-4 flex flex-col" style={{ background: C.paper, borderColor: C.lineStrong }}>
                <label className="text-[10px] uppercase font-bold tracking-widest mb-2" style={{ color: C.mute2 }}>
                  Ưu đãi / Hỗ trợ (%)
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number" min={0} max={100}
                    value={Math.round(supportPct * 100)}
                    onChange={(e) => setSupportPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100)}
                    className="w-full text-3xl font-bold outline-none tabular-nums bg-transparent"
                    style={{ color: C.navy }}
                  />
                  <span className="text-2xl font-bold" style={{ color: C.navy }}>%</span>
                </div>
                <p className="text-[10px] italic mt-1" style={{ color: C.mute2 }}>Áp dụng trước VAT</p>
              </div>
              <div className="rounded-md border p-4" style={{ background: C.paper, borderColor: C.lineStrong }}>
                <label className="text-[10px] uppercase font-bold tracking-widest mb-1.5 block" style={{ color: C.mute2 }}>
                  Thuế GTGT
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number" min={0} max={100}
                    value={Math.round(vatPct * 100)}
                    onChange={(e) => setVatPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100)}
                    className="w-20 text-2xl font-bold outline-none tabular-nums bg-transparent"
                    style={{ color: C.ink }}
                  />
                  <span className="text-xl font-bold" style={{ color: C.ink }}>%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Person rep + formula + picker bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
              <B2Icon className="h-3.5 w-3.5" />
              <span>Người đại diện:</span>
              <input
                type="text"
                value={customer.representative}
                onChange={(e) => setCustomer({ ...customer, representative: e.target.value })}
                placeholder="Ông/Bà Nguyễn Văn A"
                className="bg-transparent border-b text-sm py-0.5 outline-none w-48"
                style={{ borderColor: C.lineStrong, color: C.ink }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.navy)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.lineStrong)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition-colors"
                style={{ borderColor: C.lineStrong, color: C.muted, background: C.paper }}
              >
                <RotateCcwIcon className="h-3.5 w-3.5" /> Xóa số liệu
              </button>
              <FieldPicker
                count={visibleFields.length}
                total={FIELDS.length}
                open={pickerOpen}
                setOpen={setPickerOpen}
                query={pickerQuery}
                setQuery={setPickerQuery}
                items={availableToAdd}
                onPick={addField}
                allFull={selectedIds.size >= FIELDS.length}
              />
            </div>
          </div>

          {/* Formula bar */}
          <div
            className="flex items-start gap-2.5 rounded-md border px-4 py-2.5 text-xs"
            style={{ background: C.subtle, borderColor: C.line, color: C.muted }}
          >
            <InfoIcon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
            <div className="leading-relaxed">
              <span className="font-bold" style={{ color: C.navy }}>Công thức: </span>
              <code className="font-mono text-[11px] rounded px-1.5 py-0.5" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                Σ(MLCS × Hệ số × SL) → Trần → × Đô thị → − Hỗ trợ → + VAT
              </code>
            </div>
          </div>

          {/* Field list */}
          {visibleFields.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 px-6 text-center"
              style={{ borderColor: C.lineStrong, background: C.subtle }}
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3" style={{ background: C.paper, border: `1px solid ${C.lineStrong}` }}>
                <PlusIcon className="h-5 w-5" style={{ color: C.navy }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: C.ink }}>Chưa có lĩnh vực nào</div>
              <p className="text-xs mt-1 max-w-xs" style={{ color: C.muted }}>
                Bấm <span className="font-semibold" style={{ color: C.navy }}>"Thêm hạng mục sử dụng"</span> ở trên để chọn lĩnh vực kinh doanh có sử dụng âm nhạc.
              </p>
            </div>
          ) : (
            <section className="space-y-6">
              {visibleFields.map(({ field, vals, result }) => (
                <FieldBlock
                  key={field.id}
                  field={field}
                  vals={vals}
                  result={result}
                  expanded={expandedField === field.id}
                  onToggleExpand={() => setExpandedField(expandedField === field.id ? null : field.id)}
                  onChange={(k, v) => setFieldInput(field.id, k, v)}
                  onRemove={() => removeField(field.id)}
                  baseSalary={baseSalary}
                />
              ))}
            </section>
          )}

          <footer className="pt-6 pb-4 text-center text-[11px] italic" style={{ color: C.mute2 }}>
            Căn cứ Phụ lục biểu mức tiền bản quyền — Nghị định 17/2023/NĐ-CP ngày 26/4/2023. Áp dụng tương tự cho chủ sở hữu quyền liên quan đối với bản ghi âm, ghi hình.
          </footer>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT — TOTALS SIDEBAR (navy)
            ═══════════════════════════════════════════════════════════════════ */}
        <aside
          className="lg:sticky lg:top-0 lg:self-start lg:h-screen flex flex-col text-white"
          style={{ background: C.navy }}
        >
          <div className="flex-1 overflow-y-auto p-7">
            <h2
              className="text-xl italic font-bold pb-3 border-b border-white/15"
              style={SERIF}
            >
              Tóm tắt thanh toán
            </h2>

            {activeFields.length === 0 ? (
              <div className="mt-8 text-sm text-white/60 leading-relaxed">
                Chưa có lĩnh vực nào được nhập. Sau khi điền dữ liệu, bảng tổng hợp và mức tiền bản quyền sẽ hiển thị ở đây.
              </div>
            ) : (
              <>
                {/* Per-field list */}
                <div className="mt-5 space-y-2">
                  {activeFields.map(({ field, result }) => (
                    <div key={field.id} className="flex items-start justify-between gap-3 text-[12px] py-1 border-b border-white/5">
                      <div className="min-w-0 flex-1">
                        <div className="text-white/85 leading-snug">
                          <span className="font-mono text-white/50 mr-1">{String(field.no).padStart(2, '0')}.</span>
                          {field.name}
                        </div>
                        {result.capped && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30">
                            Đã áp trần
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-semibold tabular-nums text-right shrink-0">
                        {formatVND(result.subTotal, false)} đ
                      </div>
                    </div>
                  ))}
                </div>

                {/* Waterfall */}
                <div className="mt-7 space-y-3 text-sm">
                  <WRow label="Tổng cộng định mức" value={formatVND(totals.rawSubTotal)} />
                  <WRow label={`Hệ số đô thị (×${urbanFactor.toFixed(1)})`} value={formatVND(totals.afterUrban)} />
                  {supportPct > 0 && (
                    <WRow
                      label={`Hỗ trợ (-${(supportPct * 100).toFixed(0)}%)`}
                      value={`- ${formatVND(totals.afterUrban - totals.afterSupport)}`}
                      tone="positive"
                    />
                  )}
                  <div className="pt-3 border-t border-white/15">
                    <WRow label={`Thuế VAT (${(vatPct * 100).toFixed(0)}%)`} value={`+ ${formatVND(totals.vat)}`} />
                  </div>
                </div>

                {/* Grand total */}
                <div className="mt-10">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/45 block mb-2">
                    Tổng giá trị hợp đồng
                  </label>
                  <div className="text-[34px] font-bold leading-none tabular-nums" style={SERIF}>
                    {new Intl.NumberFormat('vi-VN').format(Math.round(totals.grandTotal))}
                    <span className="text-xl ml-1">đ</span>
                  </div>
                  <p className="text-[11px] text-white/65 mt-3 leading-relaxed italic">
                    Bằng chữ: {numberToVietnameseWords(totals.grandTotal)}./.
                  </p>
                </div>

                {activeFields.some((a) => a.result.capped) && (
                  <div className="mt-7 p-3.5 rounded border border-amber-300/30 bg-amber-400/10 text-[11px] text-amber-100 flex gap-2">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-300" />
                    <span>Đã áp dụng mức trần tối đa cho một số lĩnh vực theo quy định của Nghị định 17/2023.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-white/10 p-5 space-y-2.5" style={{ background: C.navy600 }}>
            <button
              onClick={handleExport}
              disabled={activeFields.length === 0 || exporting}
              className="w-full bg-white py-3.5 rounded font-bold uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 transition-colors hover:bg-[#F9F7F2] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: C.navy }}
            >
              <FileDownIcon className="h-4 w-4" />
              {exporting ? 'Đang tạo file…' : 'Xuất báo giá Word'}
            </button>
            <div className="text-center text-[10px] uppercase tracking-widest text-white/50">
              {activeFields.length} / {FIELDS.length} lĩnh vực
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small UI primitives
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.mute2 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function WRow({ label, value, tone }: { label: string; value: string; tone?: 'positive' }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-white/65">{label}</span>
      <span className={`font-mono tabular-nums font-semibold ${tone === 'positive' ? 'text-emerald-300' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field block — light editorial card
// ─────────────────────────────────────────────────────────────────────────────
function FieldBlock({
  field, vals, result, expanded, onToggleExpand, onChange, onRemove, baseSalary,
}: {
  field: FieldDef;
  vals: Record<string, number>;
  result: FieldResult;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (key: string, v: number) => void;
  onRemove: () => void;
  baseSalary: number;
}) {
  const Icon = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[field.icon] || CalculatorIcon;
  const hasInput = result.hasInput;
  return (
    <article
      className="pl-5 border-l-[3px] transition-colors"
      style={{ borderColor: hasInput ? C.navy : C.lineStrong }}
    >
      {/* Header row */}
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="h-7 w-7 shrink-0 rounded flex items-center justify-center"
            style={{ background: hasInput ? C.navy : C.subtle, color: hasInput ? '#fff' : C.muted, border: `1px solid ${hasInput ? C.navy : C.lineStrong}` }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: C.mute2 }}>
              Mục {String(field.no).padStart(2, '0')}
            </div>
            <h3 className="text-[15px] font-bold leading-tight truncate" style={{ color: hasInput ? C.navy : C.ink }}>
              {field.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasInput && result.capped && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>
              TRẦN
            </span>
          )}
          {hasInput && (
            <button
              onClick={onToggleExpand}
              className="text-[11px] font-bold uppercase tracking-wider hover:underline"
              style={{ color: C.navy }}
            >
              {expanded ? 'Ẩn diễn giải' : 'Xem diễn giải'}
            </button>
          )}
          <button
            onClick={onRemove}
            title="Gỡ lĩnh vực này"
            className="h-6 w-6 rounded flex items-center justify-center transition-colors"
            style={{ color: C.mute2 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#B91C1C'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.mute2; }}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
        {field.inputs.map((inp) => (
          <div key={inp.key}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.mute2 }}>
              {inp.label}
            </label>
            <div className="relative">
              <input
                type="number" step="any"
                value={vals[inp.key] || ''}
                onChange={(e) => onChange(inp.key, Number(e.target.value) || 0)}
                placeholder={inp.placeholder || '0'}
                className="w-full bg-white border rounded-md py-2 px-3 pr-12 text-base font-mono font-semibold tabular-nums outline-none transition-all"
                style={{ borderColor: C.lineStrong, color: C.ink }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,56,77,0.08)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.lineStrong; e.currentTarget.style.boxShadow = 'none'; }}
              />
              {inp.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold" style={{ color: C.mute2 }}>
                  {inp.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-[11px] leading-snug mb-3 flex items-start gap-1.5" style={{ color: C.muted }}>
        <InfoIcon className="h-3 w-3 mt-[3px] shrink-0" />
        <span>{field.hint}</span>
      </p>

      {/* Result strip */}
      {hasInput && (
        <div
          className="flex items-center justify-between rounded border px-4 py-2.5"
          style={{ background: C.subtle, borderColor: C.line }}
        >
          <div className="text-[11px]" style={{ color: C.muted }}>
            Hệ số gộp: <span className="font-mono font-bold tabular-nums" style={{ color: C.ink }}>{formatCoef(result.totalCoef)}</span>
            {result.capMultiplier !== undefined && (
              <span className="ml-2 italic">
                · trần {result.capMultiplier}×MLCS
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest font-bold" style={{ color: C.mute2 }}>Thành tiền</div>
            <div className="font-mono font-bold text-base tabular-nums" style={{ color: C.navy }}>
              {formatVND(result.subTotal)}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      {expanded && hasInput && (
        <div className="mt-3 rounded border overflow-hidden" style={{ borderColor: C.line, background: C.paper }}>
          <div className="px-4 py-2 border-b text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ borderColor: C.line, background: C.subtle, color: C.navy }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: C.navy }} />
            Diễn giải báo khách
          </div>
          <table className="w-full text-[12px]">
            <thead style={{ background: C.subtle, color: C.mute2 }}>
              <tr className="text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-bold">Bậc</th>
                <th className="px-3 py-2 text-right font-bold">MLCS</th>
                <th className="px-3 py-2 text-right font-bold">Hệ số</th>
                <th className="px-3 py-2 text-right font-bold">Số lượng</th>
                <th className="px-3 py-2 text-right font-bold">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.line }}>
              {result.rows.map((r, i) => (
                <tr key={i} className="font-mono tabular-nums" style={{ background: i % 2 ? C.subtle : 'transparent' }}>
                  <td className="px-3 py-2 font-sans" style={{ color: C.ink }}>{r.label}</td>
                  <td className="px-3 py-2 text-right" style={{ color: C.muted }}>{formatVND(baseSalary, false)}</td>
                  <td className="px-3 py-2 text-right" style={{ color: C.navy }}>{r.coefText}</td>
                  <td className="px-3 py-2 text-right" style={{ color: C.ink }}>{formatCoef(r.qty, 2)}</td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: C.ink }}>{formatVND(r.amount)}</td>
                </tr>
              ))}
              <tr className="font-mono tabular-nums" style={{ background: '#EEF4F6' }}>
                <td className="px-3 py-2 font-sans font-bold" colSpan={4} style={{ color: C.navy }}>Cộng</td>
                <td className="px-3 py-2 text-right font-extrabold" style={{ color: C.navy }}>{formatVND(result.subTotal)}</td>
              </tr>
              {result.capMultiplier !== undefined && (
                <tr className="font-mono" style={{ background: result.capped ? '#FEF3C7' : 'transparent' }}>
                  <td className="px-3 py-2 text-[10px] italic font-sans" colSpan={4} style={{ color: result.capped ? '#92400E' : C.mute2 }}>
                    {result.capped ? (
                      <span className="inline-flex items-center gap-1 font-bold uppercase">
                        <AlertTriangleIcon className="h-3 w-3" />
                        Đã áp trần tối đa {result.capMultiplier}×MLCS
                      </span>
                    ) : (
                      <>Mức trần: {result.capMultiplier}×MLCS</>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: result.capped ? '#92400E' : C.mute2 }}>
                    {formatVND(result.capAmount || 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field picker dropdown (light)
// ─────────────────────────────────────────────────────────────────────────────
function FieldPicker({
  count, total, open, setOpen, query, setQuery, items, onPick, allFull,
}: {
  count: number; total: number;
  open: boolean; setOpen: (v: boolean) => void;
  query: string; setQuery: (v: string) => void;
  items: FieldDef[]; onPick: (id: string) => void;
  allFull: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-bold transition-colors"
        style={{ background: C.navy, color: '#fff' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.navy600)}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
      >
        <PlusIcon className="h-3.5 w-3.5" /> Thêm hạng mục sử dụng
        <span className="ml-1 rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: 'rgba(255,255,255,0.18)' }}>
          {count}/{total}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-lg shadow-xl border"
            style={{ background: C.paper, borderColor: C.lineStrong, boxShadow: '0 20px 50px rgba(0,56,77,0.15)' }}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: C.line, background: C.subtle }}>
              <SearchIcon className="h-3.5 w-3.5" style={{ color: C.mute2 }} />
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm lĩnh vực…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: C.ink }}
              />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs" style={{ color: C.mute2 }}>
                  {allFull ? 'Đã thêm tất cả lĩnh vực' : 'Không tìm thấy lĩnh vực phù hợp'}
                </div>
              ) : items.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onPick(f.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors"
                  style={{ color: C.ink }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.subtle)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="w-7 shrink-0 font-mono text-[10px]" style={{ color: C.mute2 }}>{String(f.no).padStart(2, '0')}.</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <PlusIcon className="h-3.5 w-3.5" style={{ color: C.navy }} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Urban dropdown — light cream + navy accent
// ─────────────────────────────────────────────────────────────────────────────
function UrbanSelect({ value, onChange }: { value: UrbanId; onChange: (v: UrbanId) => void }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = URBAN_OPTIONS.find((u) => u.id === value)!;

  const updateRect = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setRect({ left: r.left, top: r.bottom + 6, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    updateRect();
    const onDocPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => updateRect();
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-transparent border-b py-1.5 text-left text-sm font-semibold outline-none transition-colors"
        style={{ borderColor: open ? C.navy : C.lineStrong, color: C.navy }}
      >
        <span className="truncate">{current.label}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-[11px] rounded px-1.5 py-0.5" style={{ background: '#EEF4F6', color: C.navy }}>
            ×{current.factor.toFixed(1)}
          </span>
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: C.muted }} />
        </span>
      </button>

      {open && rect && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', left: rect.left, top: rect.top, width: Math.max(rect.width, 260),
            zIndex: 9999, animation: 'urbanDropIn 160ms cubic-bezier(0.32,0.72,0,1)',
            background: C.paper, border: `1px solid ${C.lineStrong}`,
            boxShadow: '0 20px 50px rgba(0,56,77,0.18)',
          }}
          className="overflow-hidden rounded-lg p-1"
        >
          {URBAN_OPTIONS.map((u) => {
            const active = u.id === value;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => { onChange(u.id); setOpen(false); }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors"
                style={{ background: active ? '#EEF4F6' : 'transparent', color: active ? C.navy : C.ink }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.subtle; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="truncate">{u.label}</span>
                <span className="font-mono text-[11px] rounded px-1.5 py-0.5" style={{ background: active ? C.navy : C.subtle, color: active ? '#fff' : C.muted }}>
                  ×{u.factor.toFixed(1)}
                </span>
              </button>
            );
          })}
          <style>{`
            @keyframes urbanDropIn {
              from { opacity: 0; transform: translateY(-4px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  );
}
