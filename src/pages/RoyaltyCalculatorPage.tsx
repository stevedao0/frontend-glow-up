/**
 * Trang tính tiền bản quyền theo Nghị định 17/2023/NĐ-CP
 * (ban hành ngày 26/4/2023, Phụ lục biểu mức tiền bản quyền)
 *
 * Trang ĐỘC LẬP, không phụ thuộc AppShell / Auth / bất kỳ trang nào khác.
 * Tự động tính toán cho toàn bộ 11 lĩnh vực khi nhập số liệu.
 */
import React, { useMemo, useState } from 'react';
import {
  CalculatorIcon,
  CoffeeIcon,
  UtensilsIcon,
  StoreIcon,
  DumbbellIcon,
  MicIcon,
  MartiniIcon,
  HotelIcon,
  TreesIcon,
  Building2Icon,
  ShoppingCartIcon,
  PlaneIcon,
  InfoIcon,
  ArrowLeftIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Cấu hình hệ số đô thị (Ghi chú phụ lục)
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

const DEFAULT_BASE_SALARY = 2_340_000; // Mức lương cơ sở hiện hành (VND)

// ─────────────────────────────────────────────────────────────────────────────
// Logic tính hệ số cho 11 lĩnh vực
// ─────────────────────────────────────────────────────────────────────────────

type AreaTierConfig = {
  kind: 'area';
  baseCoef: number;        // hệ số khởi điểm cho phần đầu
  baseArea: number;        // diện tích đã bao gồm trong baseCoef (m²)
  midUpTo: number;         // ngưỡng trên của bậc 2 (m²)
  midPerM2: number;        // hệ số mỗi m² tăng thêm ở bậc 2
  highPerM2: number;       // hệ số mỗi m² tăng thêm ở bậc 3
  capMultiplier?: number;  // số tiền tối đa = capMultiplier × mức lương cơ sở
  bandLabels: [string, string, string];
};

type AreaPer100Config = {
  kind: 'area-per-100';     // dùng cho TTTM, Siêu thị: bậc 2/3 tính theo mỗi 100m²
  baseCoef: number;
  baseArea: number;         // m² trong baseCoef
  midUpTo: number;          // m² ngưỡng trên bậc 2
  midPer100: number;        // hệ số / 100 m² ở bậc 2
  highPer100: number;       // hệ số / 100 m² ở bậc 3
  capMultiplier?: number;
  bandLabels: [string, string, string];
};

function calcAreaTier(area: number, c: AreaTierConfig): number {
  if (!area || area <= 0) return 0;
  if (area <= c.baseArea) return c.baseCoef;
  const mid = Math.min(area, c.midUpTo) - c.baseArea;
  let coef = c.baseCoef + mid * c.midPerM2;
  if (area > c.midUpTo) {
    coef += (area - c.midUpTo) * c.highPerM2;
  }
  return coef;
}

function calcAreaPer100(area: number, c: AreaPer100Config): number {
  if (!area || area <= 0) return 0;
  if (area <= c.baseArea) return c.baseCoef;
  const midM2 = Math.min(area, c.midUpTo) - c.baseArea;
  let coef = c.baseCoef + (midM2 / 100) * c.midPer100;
  if (area > c.midUpTo) {
    coef += ((area - c.midUpTo) / 100) * c.highPer100;
  }
  return coef;
}

// ── Karaoke (mục 5) ─────────────────────────────────────────────────────────
// hệ số phụ thuộc cả vào dải số phòng VÀ diện tích phòng
const KARAOKE_RATES = {
  // [≤20m², 20-30m², >30m²]
  band1: [1.5, 1.6, 1.7],   // phòng 1..4
  band2: [1.2, 1.28, 1.36], // phòng 5..10
  band3: [1.05, 1.12, 1.19], // phòng 11+
};
function karaokeSizeIndex(roomArea: number): 0 | 1 | 2 {
  if (roomArea <= 20) return 0;
  if (roomArea <= 30) return 1;
  return 2;
}
function calcKaraoke(rooms: number, roomArea: number, boxes: number): number {
  let coef = 0;
  const idx = karaokeSizeIndex(roomArea || 20);
  if (rooms > 0) {
    const b1 = Math.min(rooms, 4);
    const b2 = Math.min(Math.max(rooms - 4, 0), 6);
    const b3 = Math.max(rooms - 10, 0);
    coef += b1 * KARAOKE_RATES.band1[idx];
    coef += b2 * KARAOKE_RATES.band2[idx];
    coef += b3 * KARAOKE_RATES.band3[idx];
  }
  if (boxes > 0) coef += boxes * 0.85;
  return coef;
}

// ─────────────────────────────────────────────────────────────────────────────
// Định nghĩa 11 lĩnh vực
// ─────────────────────────────────────────────────────────────────────────────

type FieldDef = {
  id: string;
  no: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;        // tailwind gradient classes
  unit: string;          // m² / phòng / lượt khách
  capMultiplier?: number;
  hint: string;
  formula: (inputs: Record<string, number>) => number;
  inputs: { key: string; label: string; placeholder?: string; suffix?: string }[];
  bandText?: string;
};

const FIELDS: FieldDef[] = [
  {
    id: 'cafe',
    no: 1,
    name: 'Quán cà phê – giải khát',
    icon: CoffeeIcon,
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-400/30',
    unit: 'm²',
    capMultiplier: 8,
    hint: '≤15m²: 0,35 · 15-50m²: +0,04/m² · >50m²: +0,02/m² · tối đa 8× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: 0.35, baseArea: 15,
        midUpTo: 50, midPerM2: 0.04,
        highPerM2: 0.02,
        capMultiplier: 8,
        bandLabels: ['≤15m²', '15–50m²', '>50m²'],
      }),
  },
  {
    id: 'restaurant',
    no: 2,
    name: 'Nhà hàng, phòng hội thảo, hội nghị',
    icon: UtensilsIcon,
    accent: 'from-rose-500/20 to-pink-500/10 border-rose-400/30',
    unit: 'm²',
    capMultiplier: 8,
    hint: '≤50m²: 2,0 · 50-100m²: +0,05/m² · >100m²: +0,03/m² · tối đa 8× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: 2.0, baseArea: 50,
        midUpTo: 100, midPerM2: 0.05,
        highPerM2: 0.03,
        capMultiplier: 8,
        bandLabels: ['≤50m²', '50–100m²', '>100m²'],
      }),
  },
  {
    id: 'showroom',
    no: 3,
    name: 'Cửa hàng, showroom',
    icon: StoreIcon,
    accent: 'from-violet-500/20 to-purple-500/10 border-violet-400/30',
    unit: 'm²',
    capMultiplier: 5,
    hint: '≤50m²: 0,35 · 50-100m²: +0,008/m² · >100m²: +0,006/m² · tối đa 5× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: 0.35, baseArea: 50,
        midUpTo: 100, midPerM2: 0.008,
        highPerM2: 0.006,
        capMultiplier: 5,
        bandLabels: ['≤50m²', '50–100m²', '>100m²'],
      }),
  },
  {
    id: 'fitness',
    no: 4,
    name: 'CLB thể dục, chăm sóc sức khỏe – thẩm mỹ',
    icon: DumbbellIcon,
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30',
    unit: 'm²',
    capMultiplier: 10,
    hint: '≤50m²: 0,5 · 50-100m²: +0,011/m² · >100m²: +0,009/m² · tối đa 10× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: 0.5, baseArea: 50,
        midUpTo: 100, midPerM2: 0.011,
        highPerM2: 0.009,
        capMultiplier: 10,
        bandLabels: ['≤50m²', '50–100m²', '>100m²'],
      }),
  },
  {
    id: 'karaoke',
    no: 5,
    name: 'Karaoke (phòng / box)',
    icon: MicIcon,
    accent: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-400/30',
    unit: 'phòng',
    hint: 'Phòng 1-4: 1,5–1,7 · Phòng 5-10: 1,2–1,36 · Phòng 11+: 1,05–1,19 (theo diện tích/phòng). Box: 0,85/box',
    inputs: [
      { key: 'rooms', label: 'Số phòng karaoke', suffix: 'phòng' },
      { key: 'roomArea', label: 'Diện tích trung bình/phòng', suffix: 'm²' },
      { key: 'boxes', label: 'Số karaoke box', suffix: 'box' },
    ],
    formula: ({ rooms, roomArea, boxes }) => calcKaraoke(rooms || 0, roomArea || 0, boxes || 0),
  },
  {
    id: 'bar',
    no: 6,
    name: 'Quán bar, bistro, club, vũ trường',
    icon: MartiniIcon,
    accent: 'from-indigo-500/20 to-blue-500/10 border-indigo-400/30',
    unit: 'm²',
    capMultiplier: 27,
    hint: '≤50m²: 2,35–4,0 · 50-200m²: +0,06/m² · >200m²: +0,05/m² · tối đa 27× lương cơ sở',
    inputs: [
      { key: 'area', label: 'Tổng diện tích', suffix: 'm²' },
      { key: 'baseCoef', label: 'Hệ số khởi điểm (2,35–4,0)', suffix: '' },
    ],
    formula: ({ area, baseCoef }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: baseCoef && baseCoef >= 2.35 && baseCoef <= 4.0 ? baseCoef : 2.35,
        baseArea: 50,
        midUpTo: 200, midPerM2: 0.06,
        highPerM2: 0.05,
        capMultiplier: 27,
        bandLabels: ['≤50m²', '50–200m²', '>200m²'],
      }),
  },
  {
    id: 'hotel',
    no: 7,
    name: 'Khách sạn, cơ sở lưu trú',
    icon: HotelIcon,
    accent: 'from-sky-500/20 to-cyan-500/10 border-sky-400/30',
    unit: 'phòng',
    hint: '4–5 sao: 0,03/phòng · 1–3 sao: 0,02/phòng. Dịch vụ kèm theo áp dụng mục 1–6.',
    inputs: [
      { key: 'rooms45', label: 'Số phòng (4–5 sao)', suffix: 'phòng' },
      { key: 'rooms13', label: 'Số phòng (1–3 sao)', suffix: 'phòng' },
    ],
    formula: ({ rooms45, rooms13 }) => (rooms45 || 0) * 0.03 + (rooms13 || 0) * 0.02,
  },
  {
    id: 'amusement',
    no: 8,
    name: 'Khu vui chơi, giải trí',
    icon: TreesIcon,
    accent: 'from-lime-500/20 to-green-500/10 border-lime-400/30',
    unit: 'm²',
    capMultiplier: 12,
    hint: '≤200m²: 0,7 · 200-500m²: +0,003/m² · >500m²: +0,001/m² · tối đa 12× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaTier(area, {
        kind: 'area',
        baseCoef: 0.7, baseArea: 200,
        midUpTo: 500, midPerM2: 0.003,
        highPerM2: 0.001,
        capMultiplier: 12,
        bandLabels: ['≤200m²', '200–500m²', '>500m²'],
      }),
  },
  {
    id: 'mall',
    no: 9,
    name: 'Trung tâm thương mại, Cao ốc văn phòng',
    icon: Building2Icon,
    accent: 'from-blue-500/20 to-indigo-500/10 border-blue-400/30',
    unit: 'm²',
    capMultiplier: 50,
    hint: '≤200m²: 1,5 · 200-500m²: +0,3/100m² · >500m²: +0,2/100m² · tối đa 50× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaPer100(area, {
        kind: 'area-per-100',
        baseCoef: 1.5, baseArea: 200,
        midUpTo: 500, midPer100: 0.3,
        highPer100: 0.2,
        capMultiplier: 50,
        bandLabels: ['≤200m²', '200–500m²', '>500m²'],
      }),
  },
  {
    id: 'supermarket',
    no: 10,
    name: 'Siêu thị',
    icon: ShoppingCartIcon,
    accent: 'from-orange-500/20 to-amber-500/10 border-orange-400/30',
    unit: 'm²',
    capMultiplier: 10,
    hint: '≤500m²: 1,25 · 500-1000m²: +0,3/100m² · >1000m²: +0,2/100m² · tối đa 10× lương cơ sở',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    formula: ({ area }) =>
      calcAreaPer100(area, {
        kind: 'area-per-100',
        baseCoef: 1.25, baseArea: 500,
        midUpTo: 1000, midPer100: 0.3,
        highPer100: 0.2,
        capMultiplier: 10,
        bandLabels: ['≤500m²', '500–1000m²', '>1000m²'],
      }),
  },
  {
    id: 'transport',
    no: 11,
    name: 'Hàng không / Giao thông công cộng',
    icon: PlaneIcon,
    accent: 'from-cyan-500/20 to-sky-500/10 border-cyan-400/30',
    unit: 'lượt khách',
    hint: 'Quốc tế: 0,0031–0,004 · Nội địa: 0,0019–0,0025 · Đường sắt/khác: 0,0016–0,0021 (mỗi 100 lượt khách/năm)',
    inputs: [
      { key: 'intlPax', label: 'Lượt khách QT (chuyến bay quốc tế)', suffix: 'lượt' },
      { key: 'domPax', label: 'Lượt khách nội địa (hàng không)', suffix: 'lượt' },
      { key: 'railPax', label: 'Lượt khách đường sắt / vận tải khác', suffix: 'lượt' },
    ],
    formula: ({ intlPax, domPax, railPax }) =>
      ((intlPax || 0) / 100) * 0.004 +
      ((domPax || 0) / 100) * 0.0025 +
      ((railPax || 0) / 100) * 0.0021,
    bandText: 'Lấy giá trị cận trên của mỗi khung. Có thể tách lẻ nếu cần.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatVND(v: number): string {
  if (!isFinite(v) || v <= 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' ₫';
}
function formatNum(v: number, digits = 4): string {
  if (!isFinite(v)) return '0';
  return v.toLocaleString('vi-VN', { maximumFractionDigits: digits });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function RoyaltyCalculatorPage() {
  const [baseSalary, setBaseSalary] = useState<number>(DEFAULT_BASE_SALARY);
  const [urban, setUrban] = useState<UrbanId>('special');
  const [inputs, setInputs] = useState<Record<string, Record<string, number>>>({});

  const urbanFactor = URBAN_OPTIONS.find((u) => u.id === urban)!.factor;

  const setFieldInput = (fid: string, key: string, value: number) => {
    setInputs((prev) => ({ ...prev, [fid]: { ...(prev[fid] || {}), [key]: value } }));
  };

  const resetAll = () => setInputs({});

  const results = useMemo(() => {
    return FIELDS.map((f) => {
      const data = inputs[f.id] || {};
      const rawCoef = f.formula(data);
      const cappedCoef =
        f.capMultiplier && rawCoef > f.capMultiplier ? f.capMultiplier : rawCoef;
      const amountBase = cappedCoef * baseSalary;
      const amountFinal = amountBase * urbanFactor;
      const hasInput = Object.values(data).some((v) => v && v > 0);
      return {
        field: f,
        rawCoef,
        cappedCoef,
        capped: f.capMultiplier ? rawCoef > f.capMultiplier : false,
        amountBase,
        amountFinal,
        hasInput,
      };
    });
  }, [inputs, baseSalary, urbanFactor]);

  const totalFinal = results.reduce((s, r) => s + r.amountFinal, 0);
  const activeCount = results.filter((r) => r.hasInput).length;

  return (
    <div className="relative text-zinc-100 antialiased">
      {/* Aurora background — scoped to this page, behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[40rem] w-[40rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative">
        {/* Hero — embedded inside AppShell */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
              <CalculatorIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
                ● CÔNG CỤ / TÍNH TIỀN BẢN QUYỀN
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Tính tiền bản quyền theo Nghị định 17/2023/NĐ-CP
              </h1>
              <p className="mt-0.5 text-xs text-zinc-400">
                Tự động tính toàn bộ 11 lĩnh vực khi nhập số liệu · Phụ lục biểu mức tiền bản quyền (26/4/2023)
              </p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcwIcon className="h-3.5 w-3.5" />
            Xóa toàn bộ
          </button>
        </header>

        <div>
          {/* Global settings */}
          <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SettingCard
              title="Mức lương cơ sở"
              hint="Áp dụng cho công thức × Mức lương cơ sở"
            >
              <div className="relative">
                <input
                  type="number"
                  value={baseSalary || ''}
                  onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2.5 pr-12 text-base font-semibold text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="2.340.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-500">
                  ₫
                </span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-500">
                Hiện tại: <span className="text-zinc-300">{formatVND(baseSalary)}</span>
              </div>
            </SettingCard>

            <SettingCard
              title="Phân loại đô thị"
              hint="Áp dụng cho mục 1–10 (mục 11 không phụ thuộc)"
            >
              <div className="grid grid-cols-3 gap-1.5">

                {URBAN_OPTIONS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUrban(u.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                      urban === u.id
                        ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-200'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="leading-tight">{u.label}</div>
                    <div className="mt-0.5 text-[10px] font-normal opacity-70">
                      {(u.factor * 100).toFixed(0)}%
                    </div>
                  </button>
                ))}
              </div>
            </SettingCard>

            <SettingCard title="Tổng tiền bản quyền (đã chọn)" hint={`${activeCount}/11 lĩnh vực có nhập liệu`}>
              <div className="text-2xl font-bold tracking-tight text-emerald-300">
                {formatVND(totalFinal)}
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">
                Đã áp dụng đô thị {(urbanFactor * 100).toFixed(0)}% · áp trần theo từng lĩnh vực
              </div>
            </SettingCard>
          </section>

          {/* Formula notice */}
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-100/90">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white">Công thức:</span>{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">
                Tiền bản quyền/năm = Hệ số × Mức lương cơ sở × Hệ số đô thị
              </code>
              {' · '}Hệ số được tính tự động theo bậc của Phụ lục; nếu vượt trần sẽ tự động giới hạn theo
              ngưỡng <span className="font-semibold">(× Mức lương cơ sở)</span> tương ứng.
            </div>
          </div>

          {/* Field cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((r) => (
              <FieldCard
                key={r.field.id}
                field={r.field}
                values={inputs[r.field.id] || {}}
                onChange={(key, v) => setFieldInput(r.field.id, key, v)}
                rawCoef={r.rawCoef}
                cappedCoef={r.cappedCoef}
                capped={r.capped}
                amountBase={r.amountBase}
                amountFinal={r.amountFinal}
                urbanFactor={urbanFactor}
                hasInput={r.hasInput}
              />
            ))}
          </div>

          {/* Summary table */}
          {activeCount > 0 && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl">
              <div className="border-b border-white/5 px-5 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Tổng hợp kết quả tính</h2>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Mức lương cơ sở: {formatVND(baseSalary)} · Đô thị: {URBAN_OPTIONS.find(u=>u.id===urban)?.label} ({(urbanFactor*100).toFixed(0)}%)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Lĩnh vực</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Hệ số</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Trước đô thị</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Sau đô thị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.filter((r) => r.hasInput).map((r) => (
                      <tr key={r.field.id} className="transition hover:bg-white/5">
                        <td className="px-4 py-3 text-zinc-200">
                          <span className="text-zinc-500">#{r.field.no}.</span> {r.field.name}
                          {r.capped && (
                            <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                              Đã áp trần
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">
                          {formatNum(r.cappedCoef)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-400">
                          {formatVND(r.amountBase)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-300">
                          {formatVND(r.amountFinal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-white/10 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-white" colSpan={3}>
                        Tổng cộng
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-base font-bold text-emerald-300">
                        {formatVND(totalFinal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          <footer className="mt-10 border-t border-white/5 pt-6 text-center text-[11px] text-zinc-500">
            Căn cứ Phụ lục Biểu mức tiền bản quyền — Nghị định 17/2023/NĐ-CP ngày 26/4/2023.
            Áp dụng tương tự cho chủ sở hữu quyền liên quan đối với bản ghi âm, ghi hình.
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────
function SettingCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 backdrop-blur-xl">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</div>
        {hint && <div className="text-[10px] text-zinc-600">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function FieldCard({
  field, values, onChange, rawCoef, cappedCoef, capped, amountBase, amountFinal, urbanFactor, hasInput,
}: {
  field: FieldDef;
  values: Record<string, number>;
  onChange: (key: string, v: number) => void;
  rawCoef: number;
  cappedCoef: number;
  capped: boolean;
  amountBase: number;
  amountFinal: number;
  urbanFactor: number;
  hasInput: boolean;
}) {
  const Icon = field.icon;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-zinc-950/60 backdrop-blur-xl transition hover:border-white/20 ${
        hasInput ? 'border-emerald-400/30 shadow-lg shadow-emerald-500/5' : 'border-white/10'
      }`}
    >
      {/* accent gradient header */}
      <div className={`bg-gradient-to-br ${field.accent} border-b border-white/5 px-4 py-3`}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Mục {field.no}
            </div>
            <div className="truncate text-sm font-semibold text-white">{field.name}</div>
          </div>
        </div>
      </div>

      {/* inputs */}
      <div className="space-y-2.5 p-4">
        {field.inputs.map((inp) => (
          <div key={inp.key}>
            <label className="mb-1 block text-[11px] font-medium text-zinc-400">{inp.label}</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={values[inp.key] || ''}
                onChange={(e) => onChange(inp.key, Number(e.target.value) || 0)}
                placeholder={inp.placeholder || '0'}
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 pr-12 text-sm text-white outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20"
              />
              {inp.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500">
                  {inp.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* hint */}
      <div className="border-t border-white/5 px-4 py-2 text-[10.5px] leading-snug text-zinc-500">
        <InfoIcon className="mr-1 inline h-3 w-3 -translate-y-px" />
        {field.hint}
      </div>

      {/* result */}
      <div className="border-t border-white/5 bg-zinc-900/40 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Hệ số</div>
            <div className="font-mono text-sm font-semibold text-zinc-200">
              {formatNum(cappedCoef)}
              {capped && (
                <span className="ml-1 text-[9px] font-semibold text-amber-400">
                  (trần {field.capMultiplier}×)
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Tiền/năm</div>
            <div className="font-mono text-sm font-bold text-emerald-300">
              {formatVND(amountFinal)}
            </div>
          </div>
        </div>
        {hasInput && urbanFactor < 1 && (
          <div className="mt-1.5 text-right text-[10px] text-zinc-600">
            Trước đô thị: {formatVND(amountBase)} × {(urbanFactor * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
