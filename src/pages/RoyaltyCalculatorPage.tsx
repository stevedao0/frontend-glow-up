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
import React, { useMemo, useState } from 'react';
import * as Lucide from 'lucide-react';
import {
  CalculatorIcon, InfoIcon, RotateCcwIcon, FileDownIcon, ChevronDownIcon,
  CheckCircle2Icon, AlertTriangleIcon, Building2Icon as B2Icon,
} from 'lucide-react';
import {
  FIELDS, FieldDef, FieldResult, computeQuoteTotals, formatVND, formatCoef,
} from '../lib/royaltyCalc';
import { numberToVietnameseWords } from '../lib/numberToVietnameseWords';
import { exportRoyaltyQuoteDocx } from '../lib/exportRoyaltyQuoteDocx';

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────
const URBAN_OPTIONS = [
  { id: 'special', label: 'Hà Nội / TP. HCM', factor: 1.0 },
  { id: 'I', label: 'Đô thị loại I', factor: 0.8 },
  { id: 'II', label: 'Đô thị loại II', factor: 0.6 },
  { id: 'III', label: 'Đô thị loại III', factor: 0.4 },
  { id: 'IV', label: 'Đô thị loại IV', factor: 0.2 },
  { id: 'V', label: 'Đô thị loại V', factor: 0.1 },
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

  const urbanFactor = URBAN_OPTIONS.find((u) => u.id === urban)!.factor;
  const urbanLabel = URBAN_OPTIONS.find((u) => u.id === urban)!.label;

  const setFieldInput = (fid: string, key: string, value: number) => {
    setInputs((prev) => ({ ...prev, [fid]: { ...(prev[fid] || {}), [key]: value } }));
  };
  const resetAll = () => { setInputs({}); setExpandedField(null); };

  // Compute per-field results
  const perField = useMemo(() => {
    return FIELDS.map((f) => {
      const vals = inputs[f.id] || {};
      const result = f.compute(vals, baseSalary);
      return { field: f, vals, result };
    });
  }, [inputs, baseSalary]);

  const activeFields = perField.filter((p) => p.result.hasInput);
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
            <select
              value={urban}
              onChange={(e) => setUrban(e.target.value as UrbanId)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:border-fuchsia-400/60"
            >
              {URBAN_OPTIONS.map((u) => (
                <option key={u.id} value={u.id} className="bg-zinc-900">{u.label} ({(u.factor * 100).toFixed(0)}%)</option>
              ))}
            </select>
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

        {/* ── FORMULA BANNER ────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 rounded-xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/5 px-4 py-3 text-xs text-indigo-100/90">
          <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Công thức báo giá:</span>{' '}
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
              Σ(MLCS × Hệ số × Số lượng) → Áp trần → × Đô thị → − Hỗ trợ → + VAT
            </code>
          </div>
        </div>

        {/* ── FIELD CARDS ───────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {perField.map(({ field, vals, result }) => (
            <FieldCard
              key={field.id}
              field={field}
              vals={vals}
              result={result}
              expanded={expandedField === field.id}
              onToggleExpand={() => setExpandedField(expandedField === field.id ? null : field.id)}
              onChange={(k, v) => setFieldInput(field.id, k, v)}
              baseSalary={baseSalary}
            />
          ))}
        </section>

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

        <footer className="border-t border-white/5 pt-6 text-center text-[11px] text-zinc-500">
          Căn cứ Phụ lục biểu mức tiền bản quyền — Nghị định 17/2023/NĐ-CP ngày 26/4/2023 · Áp dụng tương tự cho chủ sở hữu quyền liên quan đối với bản ghi âm, ghi hình.
        </footer>
      </div>
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
  const ring = {
    indigo: 'border-indigo-400/30 from-indigo-500/15',
    fuchsia: 'border-fuchsia-400/30 from-fuchsia-500/15',
    amber: 'border-amber-400/30 from-amber-500/15',
    cyan: 'border-cyan-400/30 from-cyan-500/15',
    emerald: 'border-emerald-400/30 from-emerald-500/15',
  }[accent];
  const text = {
    indigo: 'text-indigo-300', fuchsia: 'text-fuchsia-300', amber: 'text-amber-300',
    cyan: 'text-cyan-300', emerald: 'text-emerald-300',
  }[accent];
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent backdrop-blur-xl ${ring}`}>
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
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-400/60"
      />
    </div>
  );
}

function FieldCard({
  field, vals, result, expanded, onToggleExpand, onChange, baseSalary,
}: {
  field: FieldDef;
  vals: Record<string, number>;
  result: FieldResult;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (key: string, v: number) => void;
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
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-2.5 p-4">
        {field.inputs.map((inp) => (
          <div key={inp.key}>
            <label className="mb-1 block text-[11px] font-medium text-zinc-400">{inp.label}</label>
            <div className="relative">
              <input
                type="number" step="any"
                value={vals[inp.key] || ''}
                onChange={(e) => onChange(inp.key, Number(e.target.value) || 0)}
                placeholder={inp.placeholder || '0'}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pr-14 text-sm font-mono text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
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
