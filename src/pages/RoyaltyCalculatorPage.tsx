/**
 * Tính tiền bản quyền âm nhạc theo Nghị định 17/2023/NĐ-CP
 *
 * Ngôn ngữ thiết kế:
 *  - Nền đen sâu, accent neon (indigo / fuchsia / lime) — "cool, ngầu"
 *  - Mono numbers, tương phản cao, dải tô để dễ đọc
 *  - Mỗi lĩnh vực có khối "diễn giải báo khách": từng dòng bậc thang
 *    × MLCS × Hệ số = thành tiền, có cộng, áp trần, hỗ trợ, VAT, bằng chữ
 *  - Xuất file Word báo giá với thông tin VCPMC (vcpmc.org)
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
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

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
// Phân loại đô thị theo NĐ 134/2026/NĐ-CP (Điều 33 — sửa đổi Phụ lục II của NĐ 17/2023)
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

  // customer
  const [customer, setCustomer] = useState({ name: '', address: '', representative: '' });
  const [exporting, setExporting] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  // Smart filter: chỉ render lĩnh vực đã được chọn (hoặc đã có input)
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
    setPickerOpen(false);
    setPickerQuery('');
  };
  const removeField = (fid: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(fid); return n; });
    setInputs((prev) => { const n = { ...prev }; delete n[fid]; return n; });
  };
  const resetAll = () => { setInputs({}); setSelectedIds(new Set()); setExpandedField(null); };

  // Compute per-field results (toàn bộ 17 lĩnh vực, để dùng cho picker & tổng)
  const perField = useMemo(() => {
    return FIELDS.map((f) => {
      const vals = inputs[f.id] || {};
      const result = f.compute(vals, baseSalary);
      return { field: f, vals, result };
    });
  }, [inputs, baseSalary]);

  // Chỉ hiển thị card cho lĩnh vực đã chọn HOẶC đã có input
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
        customer,
        contractMonths,
        baseSalary,
        urbanLabel,
        urbanFactor,
        supportPct,
        vatPct,
        perField: activeFields.map(({ field, vals, result }) => ({
          fieldId: field.id, vals, result,
        })),
        totals,
        quoteDate: new Date().toLocaleDateString('vi-VN'),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative text-zinc-100 antialiased">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[40rem] w-[40rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative space-y-6">
        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-fuchsia-500/30">
              <CalculatorIcon className="h-6 w-6 text-white" />
              <div className="absolute -inset-px rounded-xl ring-1 ring-white/20" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                ● VCPMC · CÔNG CỤ BÁO GIÁ
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Tính tiền bản quyền âm nhạc — <span className="text-fuchsia-300">NĐ 17/2023/NĐ-CP</span>
              </h1>
              <p className="mt-0.5 text-xs text-zinc-400">
                17 lĩnh vực · diễn giải bậc thang chi tiết · xuất file Word báo giá
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" /> Xóa số liệu
            </button>
            <button
              onClick={handleExport}
              disabled={activeFields.length === 0 || exporting}
              className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-emerald-400/30 bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:from-zinc-700 disabled:to-zinc-700 disabled:opacity-50 disabled:shadow-none"
            >
              <FileDownIcon className="h-4 w-4" />
              {exporting ? 'Đang tạo...' : 'Xuất báo giá Word'}
            </button>
          </div>
        </header>

        {/* ── TOP STATS ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <SettingTile label="Mức lương cơ sở" value={formatVND(baseSalary)} accent="indigo">
            <input
              type="number"
              value={baseSalary || ''}
              onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm font-mono font-bold text-white outline-none focus:border-indigo-400/60"
            />
          </SettingTile>

          <SettingTile label="Phân loại đô thị" value={`${urbanLabel} · ${(urbanFactor * 100).toFixed(0)}%`} accent="fuchsia">
            <UrbanSelect value={urban} onChange={setUrban} />
          </SettingTile>


          <SettingTile label="Hỗ trợ trước VAT" value={`${(supportPct * 100).toFixed(0)}%`} accent="amber">
            <div className="relative mt-1">
              <input
                type="number" step="1" min="0" max="100"
                value={Math.round(supportPct * 100)}
                onChange={(e) => setSupportPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 pr-7 text-sm font-mono font-bold text-white outline-none focus:border-amber-400/60"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">%</span>
            </div>
          </SettingTile>

          <SettingTile label="Thuế GTGT" value={`${(vatPct * 100).toFixed(0)}%`} accent="cyan">
            <div className="relative mt-1">
              <input
                type="number" step="1" min="0" max="100"
                value={Math.round(vatPct * 100)}
                onChange={(e) => setVatPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 pr-7 text-sm font-mono font-bold text-white outline-none focus:border-cyan-400/60"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">%</span>
            </div>
          </SettingTile>

          <SettingTile label="Thời hạn HĐ" value={`${contractMonths} tháng`} accent="emerald">
            <div className="relative mt-1">
              <input
                type="number" step="1" min="1"
                value={contractMonths || ''}
                onChange={(e) => setContractMonths(Number(e.target.value) || 1)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 pr-12 text-sm font-mono font-bold text-white outline-none focus:border-emerald-400/60"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">tháng</span>
            </div>
          </SettingTile>
        </section>

        {/* ── CUSTOMER (collapsible) ────────────────────────────────────── */}
        <details className="group rounded-xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl" open={activeFields.length > 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 hover:bg-white/5">
            <div className="flex items-center gap-2">
              <B2Icon className="h-4 w-4 text-indigo-300" />
              <span className="text-sm font-semibold text-white">Thông tin khách hàng</span>
              <span className="text-[11px] text-zinc-500">(điền cho file Word báo giá)</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 gap-3 border-t border-white/5 px-5 py-4 md:grid-cols-3">
            <CustField label="Tên đơn vị / khách hàng" value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} placeholder="Công ty TNHH ABC" />
            <CustField label="Địa chỉ" value={customer.address} onChange={(v) => setCustomer({ ...customer, address: v })} placeholder="123 Nguyễn Huệ, Q.1, TP.HCM" />
            <CustField label="Người đại diện" value={customer.representative} onChange={(v) => setCustomer({ ...customer, representative: v })} placeholder="Ông Nguyễn Văn A" />
          </div>
        </details>

        {/* ── FORMULA + PICKER BAR ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2.5 text-xs text-indigo-100/90">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            <div className="leading-relaxed">
              <span className="font-bold text-white">Công thức:</span>{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
                Σ(MLCS × Hệ số × SL) → Trần → × Đô thị → − Hỗ trợ → + VAT
              </code>
            </div>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-bold text-indigo-100 transition hover:bg-indigo-500/25 md:w-auto"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Thêm lĩnh vực kinh doanh
              <span className="ml-1 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                {visibleFields.length}/{FIELDS.length}
              </span>
            </button>
            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
                  <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
                    <SearchIcon className="h-3.5 w-3.5 text-zinc-500" />
                    <input
                      autoFocus
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Tìm lĩnh vực…"
                      className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {availableToAdd.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-zinc-500">
                        {selectedIds.size >= FIELDS.length ? 'Đã thêm tất cả 17 lĩnh vực' : 'Không tìm thấy lĩnh vực phù hợp'}
                      </div>
                    ) : availableToAdd.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => addField(f.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-indigo-500/15"
                      >
                        <span className="w-6 shrink-0 font-mono text-[10px] text-zinc-500">{f.no}.</span>
                        <span className="flex-1 truncate">{f.name}</span>
                        <PlusIcon className="h-3 w-3 text-indigo-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── FIELD CARDS ───────────────────────────────────────────────── */}
        {visibleFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/30">
              <PlusIcon className="h-5 w-5 text-indigo-300" />
            </div>
            <div className="text-sm font-semibold text-white">Chưa có lĩnh vực nào</div>
            <p className="mt-1 max-w-xs text-xs text-zinc-500">
              Bấm <span className="text-indigo-300">“Thêm lĩnh vực kinh doanh”</span> ở trên để chọn các mục khách hàng đang sử dụng âm nhạc.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFields.map(({ field, vals, result }) => (
              <FieldCard
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

        {/* ── QUOTE SUMMARY ─────────────────────────────────────────────── */}
        {activeFields.length > 0 && (
          <QuoteSummary
            activeFields={activeFields}
            urbanLabel={urbanLabel}
            urbanFactor={urbanFactor}
            supportPct={supportPct}
            vatPct={vatPct}
            totals={totals}
            baseSalary={baseSalary}
          />
        )}

        <footer className="border-t border-white/5 pb-24 pt-6 text-center text-[11px] text-zinc-500">
          Căn cứ Phụ lục biểu mức tiền bản quyền — Nghị định 17/2023/NĐ-CP ngày 26/4/2023 · Áp dụng tương tự cho chủ sở hữu quyền liên quan đối với bản ghi âm, ghi hình.
        </footer>
      </div>

      {/* ── STICKY BOTTOM TOTAL BAR ─────────────────────────────────────── */}
      {activeFields.length > 0 && (
        <div className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/40 bg-zinc-950/90 px-4 py-2.5 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-300" />
            <span className="font-semibold text-white">{activeFields.length}</span> lĩnh vực · MLCS{' '}
            <span className="font-mono text-zinc-200">{formatVND(baseSalary, false)}</span> · {urbanLabel}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">Tổng (đã VAT)</div>
              <div className="font-mono text-base font-extrabold text-emerald-300 leading-tight">{formatVND(totals.grandTotal)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SettingTile({
  label, value, accent, children,
}: {
  label: string; value: string; accent: 'indigo' | 'fuchsia' | 'amber' | 'cyan' | 'emerald';
  children?: React.ReactNode;
}) {
  const accentBar = {
    indigo: 'bg-indigo-400', fuchsia: 'bg-fuchsia-400', amber: 'bg-amber-400',
    cyan: 'bg-cyan-400', emerald: 'bg-emerald-400',
  }[accent];
  const accentFocus = {
    indigo: 'focus-within:border-indigo-400/60 focus-within:shadow-indigo-500/20',
    fuchsia: 'focus-within:border-fuchsia-400/60 focus-within:shadow-fuchsia-500/20',
    amber: 'focus-within:border-amber-400/60 focus-within:shadow-amber-500/20',
    cyan: 'focus-within:border-cyan-400/60 focus-within:shadow-cyan-500/20',
    emerald: 'focus-within:border-emerald-400/60 focus-within:shadow-emerald-500/20',
  }[accent];
  const text = {
    indigo: 'text-indigo-300', fuchsia: 'text-fuchsia-300', amber: 'text-amber-300',
    cyan: 'text-cyan-300', emerald: 'text-emerald-300',
  }[accent];
  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl transition focus-within:shadow-lg ${accentFocus}`}>
      <div className={`absolute left-0 top-0 h-full w-0.5 ${accentBar}`} />
      <div className="relative p-3">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${text}`}>{label}</div>
        <div className="mt-0.5 truncate font-mono text-sm font-bold text-white">{value}</div>
        {children}
      </div>
    </div>
  );
}

function CustField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-400">{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition focus:border-indigo-400/60 focus:bg-black/70"
      />
    </div>
  );
}

function FieldCard({
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
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-zinc-950/70 backdrop-blur-xl transition ${
        hasInput
          ? 'border-emerald-400/40 shadow-lg shadow-emerald-500/10'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Accent header */}
      <div className={`relative overflow-hidden border-b border-white/5 bg-gradient-to-br ${field.accent} px-4 py-3`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/40 ring-1 ring-white/20 backdrop-blur">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Mục {field.no}
            </div>
            <div className="truncate text-sm font-bold text-white">{field.name}</div>
          </div>
          {hasInput && (
            <div className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 ring-1 ring-emerald-400/40">
              <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-300" />
            </div>
          )}
          <button
            onClick={onRemove}
            title="Bỏ lĩnh vực này"
            className="rounded-md bg-black/40 p-1 text-zinc-400 ring-1 ring-white/10 transition hover:bg-red-500/20 hover:text-red-300 hover:ring-red-400/40"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-2.5 p-4">
        {field.inputs.map((inp) => (
          <div key={inp.key}>
            <label className="mb-1 block text-[11px] font-medium text-zinc-300">{inp.label}</label>
            <div className="relative">
              <input
                type="number" step="any"
                value={vals[inp.key] || ''}
                onChange={(e) => onChange(inp.key, Number(e.target.value) || 0)}
                placeholder={inp.placeholder || '0'}
                className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 pr-14 text-sm font-mono font-semibold text-white placeholder:text-zinc-500 outline-none transition focus:border-indigo-400/60 focus:bg-black/70 focus:ring-2 focus:ring-indigo-500/20"
              />
              {inp.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-500">
                  {inp.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="border-t border-white/5 px-4 py-2 text-[10.5px] leading-snug text-zinc-500">
        <InfoIcon className="mr-1 inline h-3 w-3 -translate-y-px" />
        {field.hint}
      </div>

      {/* Quick result */}
      <div className="border-t border-white/5 bg-black/30 px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Hệ số gộp</div>
            <div className="font-mono text-sm font-bold text-zinc-200">
              {formatCoef(result.totalCoef)}
              {result.capped && (
                <span className="ml-1 text-[9px] font-bold uppercase text-amber-400">
                  · trần
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Thành tiền</div>
            <div className="font-mono text-base font-extrabold text-emerald-300">
              {formatVND(result.subTotal)}
            </div>
          </div>
        </div>
        {hasInput && (
          <button
            onClick={onToggleExpand}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-white/10 bg-white/5 py-1 text-[10.5px] font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronDownIcon className={`h-3 w-3 transition ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Ẩn diễn giải' : 'Xem diễn giải báo khách'}
          </button>
        )}
      </div>

      {/* Breakdown */}
      {expanded && hasInput && (
        <div className="border-t border-emerald-400/20 bg-gradient-to-br from-black/60 to-zinc-950/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Diễn giải báo khách
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-[11px]">
              <thead className="bg-white/5">
                <tr className="text-[9.5px] uppercase tracking-wider text-zinc-400">
                  <th className="px-2 py-1.5 text-left font-bold">Bậc</th>
                  <th className="px-2 py-1.5 text-center font-bold">MLCS</th>
                  <th className="px-2 py-1.5 text-center font-bold">Hệ số</th>
                  <th className="px-2 py-1.5 text-center font-bold">SL</th>
                  <th className="px-2 py-1.5 text-right font-bold">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.rows.map((r, i) => (
                  <tr key={i} className="font-mono">
                    <td className="px-2 py-1.5 text-zinc-200">{r.label}</td>
                    <td className="px-2 py-1.5 text-center text-zinc-400">{formatVND(baseSalary, false)}</td>
                    <td className="px-2 py-1.5 text-center text-indigo-300">{r.coefText}</td>
                    <td className="px-2 py-1.5 text-center text-zinc-300">{formatCoef(r.qty, 2)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-emerald-300">{formatVND(r.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-500/10 font-mono">
                  <td className="px-2 py-1.5 font-bold text-white" colSpan={4}>Cộng</td>
                  <td className="px-2 py-1.5 text-right font-extrabold text-emerald-300">{formatVND(result.subTotal)}</td>
                </tr>
                {result.capMultiplier !== undefined && (
                  <tr className={`font-mono ${result.capped ? 'bg-amber-500/10' : ''}`}>
                    <td className={`px-2 py-1.5 text-[10px] italic ${result.capped ? 'text-amber-300' : 'text-zinc-500'}`} colSpan={4}>
                      {result.capped ? (
                        <span className="inline-flex items-center gap-1 font-bold uppercase">
                          <AlertTriangleIcon className="h-3 w-3" />
                          Đã áp trần {result.capMultiplier}×MLCS
                        </span>
                      ) : (
                        <>Mức trần: {result.capMultiplier}×MLCS</>
                      )}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${result.capped ? 'text-amber-300 font-bold' : 'text-zinc-500'}`}>
                      {formatVND(result.capAmount || 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteSummary({
  activeFields, urbanLabel, urbanFactor, supportPct, vatPct, totals, baseSalary,
}: {
  activeFields: { field: FieldDef; vals: Record<string, number>; result: FieldResult }[];
  urbanLabel: string;
  urbanFactor: number;
  supportPct: number;
  vatPct: number;
  totals: ReturnType<typeof computeQuoteTotals>;
  baseSalary: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-zinc-950/90 to-black/80 backdrop-blur-xl shadow-2xl shadow-emerald-500/10">
      <div className="border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/40">
            <CheckCircle2Icon className="h-4 w-4 text-emerald-300" />
          </div>
          <h2 className="text-base font-bold text-white">TỔNG HỢP BÁO GIÁ</h2>
        </div>
        <p className="mt-0.5 pl-9 text-[11px] text-zinc-400">
          MLCS: <span className="font-mono text-zinc-200">{formatVND(baseSalary)}</span> · Đô thị:{' '}
          <span className="text-zinc-200">{urbanLabel}</span> ({(urbanFactor * 100).toFixed(0)}%) ·{' '}
          {activeFields.length} lĩnh vực
        </p>
      </div>

      {/* Per-field rollup */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-[10.5px] uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-bold">#</th>
              <th className="px-4 py-2.5 text-left font-bold">Lĩnh vực</th>
              <th className="px-4 py-2.5 text-right font-bold">Hệ số</th>
              <th className="px-4 py-2.5 text-right font-bold">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeFields.map(({ field, result }) => (
              <tr key={field.id} className="transition hover:bg-white/5">
                <td className="px-4 py-2.5 font-mono text-zinc-500">{field.no}</td>
                <td className="px-4 py-2.5 text-zinc-200">
                  {field.name}
                  {result.capped && (
                    <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                      TRẦN
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-300">{formatCoef(result.totalCoef)}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-300">{formatVND(result.subTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals waterfall */}
      <div className="border-t border-white/10 bg-black/30 p-5">
        <div className="space-y-1.5 text-sm">
          <TotalRow label="Cộng tiền bản quyền (sau áp trần)" amount={totals.rawSubTotal} />
          <TotalRow label={`× Hệ số đô thị (${(urbanFactor * 100).toFixed(0)}%)`} amount={totals.afterUrban} accent />
          {supportPct > 0 && (
            <TotalRow label={`− Hỗ trợ ${(supportPct * 100).toFixed(0)}% trước VAT`} amount={totals.afterSupport} />
          )}
          <TotalRow label={`+ Thuế GTGT ${(vatPct * 100).toFixed(0)}%`} amount={totals.vat} accent />
          <div className="!mt-3 flex items-center justify-between rounded-lg border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 px-4 py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Tổng giá trị hợp đồng</div>
              <div className="text-[10px] italic text-zinc-500">(đã gồm VAT)</div>
            </div>
            <div className="text-right font-mono text-xl font-extrabold text-emerald-300">
              {formatVND(totals.grandTotal)}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bằng chữ:</span>{' '}
          <span className="text-xs italic text-zinc-200">{numberToVietnameseWords(totals.grandTotal)}./.</span>
        </div>
      </div>
    </section>
  );
}

function TotalRow({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5 text-xs">
      <span className={accent ? 'font-semibold text-cyan-200' : 'text-zinc-400'}>{label}</span>
      <span className="font-mono font-bold text-zinc-200">{formatVND(amount)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Urban Dropdown — bo cong, mượt, accent fuchsia, click-outside-close
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
    <div className="relative mt-1">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-black/50 px-3 py-2 text-left text-xs font-semibold text-white outline-none transition-all',
          open
            ? 'border-fuchsia-400/70 shadow-[0_0_0_3px_rgba(232,121,249,0.15)]'
            : 'border-white/10 hover:border-fuchsia-400/40',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" />
          <span className="truncate">{current.label}</span>
          <span className="ml-1 rounded-md bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-mono text-fuchsia-300">
            {(current.factor * 100).toFixed(0)}%
          </span>
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180 text-fuchsia-300' : ''}`}
        />
      </button>

      {open && rect && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            zIndex: 9999,
            animation: 'urbanDropIn 160ms cubic-bezier(0.32,0.72,0,1)',
          }}
          className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(232,121,249,0.15)] backdrop-blur-xl"
        >
          {URBAN_OPTIONS.map((u) => {
            const active = u.id === value;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => { onChange(u.id); setOpen(false); }}
                className={[
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                  active ? 'bg-fuchsia-500/15 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.9)]' : 'bg-zinc-700'}`} />
                  <span className="truncate">{u.label}</span>
                </span>
                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${active ? 'bg-fuchsia-500/25 text-fuchsia-200' : 'bg-white/5 text-zinc-400'}`}>
                  {(u.factor * 100).toFixed(0)}%
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


