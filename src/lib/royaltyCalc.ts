/**
 * Cấu hình + công thức tính tiền bản quyền theo Phụ lục NĐ 17/2023/NĐ-CP.
 * Trả về breakdown chi tiết (từng bậc thang) để báo khách rõ ràng.
 */

export type BreakdownRow = {
  /** Mô tả bậc, vd "Đến 15 m²", "15 - 50 m²", "Trên 50 m²" */
  label: string;
  /** Hệ số (hiển thị, vd "0,35/15m²", "0,04/m²") */
  coefText: string;
  /** Số lượng đơn vị áp dụng cho bậc này (vd m² thực tế trong bậc) */
  qty: number;
  /** Hệ số số học (× MLCS × qty) */
  coef: number;
  /** Cách tính: hệ số × qty hoặc hệ số trực tiếp */
  mode: 'tier-area' | 'tier-per100' | 'flat' | 'per-room' | 'per-pax';
  /** Thành tiền dòng = baseSalary × coef × (qty hoặc 1) */
  amount: number;
};

export type FieldResult = {
  rows: BreakdownRow[];
  /** Tổng hệ số gộp (sau khi áp trần nếu có) */
  totalCoef: number;
  /** Tổng tiền sau khi áp trần (× MLCS) — TRƯỚC khi nhân hệ số đô thị */
  subTotal: number;
  /** Trần được kích hoạt không */
  capped: boolean;
  /** Mức trần × MLCS (= capMultiplier × MLCS), undefined nếu không có */
  capAmount?: number;
  capMultiplier?: number;
  /** Có dữ liệu nhập hay không */
  hasInput: boolean;
  /** Phí trọn gói (VND), không áp hệ số đô thị (NĐ 17 mục 5.4) */
  urbanExempt?: boolean;
};


export type FieldDef = {
  id: string;
  no: number;
  name: string;
  /** Slug icon trong lucide-react */
  icon: string;
  /** Lớp tailwind cho gradient highlight */
  accent: string;
  /** "m²", "phòng", "lượt khách"... */
  unit: string;
  /** Trần × MLCS */
  capMultiplier?: number;
  /** Tóm tắt công thức hiển thị trên thẻ */
  hint: string;
  /** Danh sách input cho field */
  inputs: FieldInput[];
  /** Hàm tính breakdown */
  compute: (vals: Record<string, number>, baseSalary: number) => FieldResult;
  /** Phí trọn gói VND — bỏ qua hệ số đô thị (mục 5.4 NĐ 17) */
  urbanExempt?: boolean;
};


export type FieldInput = {
  key: string;
  label: string;
  suffix?: string;
  placeholder?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function emptyResult(): FieldResult {
  return { rows: [], totalCoef: 0, subTotal: 0, capped: false, hasInput: false };
}

function applyCap(rows: BreakdownRow[], baseSalary: number, capMult?: number): FieldResult {
  const raw = rows.reduce((s, r) => s + r.amount, 0);
  const rawCoef = rows.reduce((s, r) => s + r.coef * r.qty, 0);
  if (capMult !== undefined) {
    const capAmount = capMult * baseSalary;
    if (raw > capAmount) {
      return {
        rows,
        totalCoef: capMult,
        subTotal: capAmount,
        capped: true,
        capAmount,
        capMultiplier: capMult,
        hasInput: true,
      };
    }
    return {
      rows,
      totalCoef: rawCoef,
      subTotal: raw,
      capped: false,
      capAmount,
      capMultiplier: capMult,
      hasInput: true,
    };
  }
  return { rows, totalCoef: rawCoef, subTotal: raw, capped: false, hasInput: true };
}

// Bậc thang theo diện tích (mục 1, 2, 3, 4, 6, 8)
function tierArea(opts: {
  area: number;
  baseCoef: number;
  baseArea: number;
  baseLabel: string;
  midUpTo: number;
  midPerM2: number;
  midLabel: string;
  highPerM2: number;
  highLabel: string;
  baseCoefText: string;
  midCoefText: string;
  highCoefText: string;
  baseSalary: number;
  capMult?: number;
}): FieldResult {
  const { area, baseSalary, capMult } = opts;
  if (!area || area <= 0) return emptyResult();
  const rows: BreakdownRow[] = [];
  // Bậc 1 — luôn áp dụng (gói cứng)
  rows.push({
    label: opts.baseLabel,
    coefText: opts.baseCoefText,
    qty: 1,
    coef: opts.baseCoef,
    mode: 'tier-area',
    amount: opts.baseCoef * baseSalary,
  });
  if (area > opts.baseArea) {
    const midM2 = Math.min(area, opts.midUpTo) - opts.baseArea;
    if (midM2 > 0) {
      rows.push({
        label: opts.midLabel,
        coefText: opts.midCoefText,
        qty: midM2,
        coef: opts.midPerM2,
        mode: 'tier-area',
        amount: opts.midPerM2 * midM2 * baseSalary,
      });
    }
  }
  if (area > opts.midUpTo) {
    const highM2 = area - opts.midUpTo;
    rows.push({
      label: opts.highLabel,
      coefText: opts.highCoefText,
      qty: highM2,
      coef: opts.highPerM2,
      mode: 'tier-area',
      amount: opts.highPerM2 * highM2 * baseSalary,
    });
  }
  return applyCap(rows, baseSalary, capMult);
}

// Bậc thang per-100m² (mục 9, 10)
function tierPer100(opts: {
  area: number;
  baseCoef: number;
  baseArea: number;
  baseLabel: string;
  midUpTo: number;
  midPer100: number;
  midLabel: string;
  highPer100: number;
  highLabel: string;
  baseCoefText: string;
  midCoefText: string;
  highCoefText: string;
  baseSalary: number;
  capMult?: number;
}): FieldResult {
  const { area, baseSalary, capMult } = opts;
  if (!area || area <= 0) return emptyResult();
  const rows: BreakdownRow[] = [];
  rows.push({
    label: opts.baseLabel,
    coefText: opts.baseCoefText,
    qty: 1,
    coef: opts.baseCoef,
    mode: 'tier-per100',
    amount: opts.baseCoef * baseSalary,
  });
  if (area > opts.baseArea) {
    const midM2 = Math.min(area, opts.midUpTo) - opts.baseArea;
    if (midM2 > 0) {
      const units = midM2 / 100;
      rows.push({
        label: opts.midLabel,
        coefText: opts.midCoefText,
        qty: units,
        coef: opts.midPer100,
        mode: 'tier-per100',
        amount: opts.midPer100 * units * baseSalary,
      });
    }
  }
  if (area > opts.midUpTo) {
    const highM2 = area - opts.midUpTo;
    const units = highM2 / 100;
    rows.push({
      label: opts.highLabel,
      coefText: opts.highCoefText,
      qty: units,
      coef: opts.highPer100,
      mode: 'tier-per100',
      amount: opts.highPer100 * units * baseSalary,
    });
  }
  return applyCap(rows, baseSalary, capMult);
}

// ── 17 lĩnh vực ────────────────────────────────────────────────────────────
// (Karaoke tách thành 4 dòng riêng theo bảng tính tham chiếu của khách)
export const FIELDS: FieldDef[] = [
  {
    id: 'cafe', no: 1, name: 'Quán cà phê – giải khát', icon: 'CoffeeIcon',
    accent: 'from-amber-500/20 to-orange-500/10',
    unit: 'm²', capMultiplier: 8,
    hint: '≤15m²: 0,35/15m² · 15-50m²: +0,04/m² · >50m²: +0,02/m² · trần 8×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierArea({
      area: area || 0, baseSalary: mlcs, capMult: 8,
      baseCoef: 0.35, baseArea: 15, baseLabel: 'Đến 15 m²', baseCoefText: '0,35/15m²',
      midUpTo: 50, midPerM2: 0.04, midLabel: '15 – 50 m²', midCoefText: '0,04/m²',
      highPerM2: 0.02, highLabel: 'Trên 50 m²', highCoefText: '0,02/m²',
    }),
  },
  {
    id: 'restaurant', no: 2, name: 'Nhà hàng, phòng hội thảo, hội nghị', icon: 'UtensilsIcon',
    accent: 'from-rose-500/20 to-pink-500/10',
    unit: 'm²', capMultiplier: 8,
    hint: '≤50m²: 2,0/50m² · 50-100m²: +0,05/m² · >100m²: +0,03/m² · trần 8×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierArea({
      area: area || 0, baseSalary: mlcs, capMult: 8,
      baseCoef: 2.0, baseArea: 50, baseLabel: 'Đến 50 m²', baseCoefText: '2,0/50m²',
      midUpTo: 100, midPerM2: 0.05, midLabel: '50 – 100 m²', midCoefText: '0,05/m²',
      highPerM2: 0.03, highLabel: 'Trên 100 m²', highCoefText: '0,03/m²',
    }),
  },
  {
    id: 'showroom', no: 3, name: 'Cửa hàng, showroom', icon: 'StoreIcon',
    accent: 'from-violet-500/20 to-purple-500/10',
    unit: 'm²', capMultiplier: 5,
    hint: '≤50m²: 0,35/50m² · 50-100m²: +0,008/m² · >100m²: +0,006/m² · trần 5×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierArea({
      area: area || 0, baseSalary: mlcs, capMult: 5,
      baseCoef: 0.35, baseArea: 50, baseLabel: 'Đến 50 m²', baseCoefText: '0,35/50m²',
      midUpTo: 100, midPerM2: 0.008, midLabel: '50 – 100 m²', midCoefText: '0,008/m²',
      highPerM2: 0.006, highLabel: 'Trên 100 m²', highCoefText: '0,006/m²',
    }),
  },
  {
    id: 'fitness', no: 4, name: 'CLB thể dục, chăm sóc sức khỏe – thẩm mỹ', icon: 'DumbbellIcon',
    accent: 'from-emerald-500/20 to-teal-500/10',
    unit: 'm²', capMultiplier: 10,
    hint: '≤50m²: 0,5/50m² · 50-100m²: +0,011/m² · >100m²: +0,009/m² · trần 10×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierArea({
      area: area || 0, baseSalary: mlcs, capMult: 10,
      baseCoef: 0.5, baseArea: 50, baseLabel: 'Đến 50 m²', baseCoefText: '0,5/50m²',
      midUpTo: 100, midPerM2: 0.011, midLabel: '50 – 100 m²', midCoefText: '0,011/m²',
      highPerM2: 0.009, highLabel: 'Trên 100 m²', highCoefText: '0,009/m²',
    }),
  },
  {
    id: 'karaoke-le20', no: 5, name: 'Karaoke (phòng ≤20m²)', icon: 'MicIcon',
    accent: 'from-fuchsia-500/20 to-pink-500/10',
    unit: 'phòng',
    hint: '4 phòng đầu: 1,5/phòng · 6 phòng tiếp: 1,2/phòng · từ phòng 11: 1,05/phòng',
    inputs: [{ key: 'rooms', label: 'Số phòng karaoke ≤20m²', suffix: 'phòng' }],
    compute: ({ rooms }, mlcs) => karaokeBand(rooms || 0, [1.5, 1.2, 1.05], mlcs, '≤20m²'),
  },
  {
    id: 'karaoke-2030', no: 6, name: 'Karaoke (phòng 20–30m²)', icon: 'MicIcon',
    accent: 'from-fuchsia-500/20 to-pink-500/10',
    unit: 'phòng',
    hint: '4 phòng đầu: 1,6/phòng · 6 phòng tiếp: 1,28/phòng · từ phòng 11: 1,12/phòng',
    inputs: [{ key: 'rooms', label: 'Số phòng karaoke 20-30m²', suffix: 'phòng' }],
    compute: ({ rooms }, mlcs) => karaokeBand(rooms || 0, [1.6, 1.28, 1.12], mlcs, '20–30m²'),
  },
  {
    id: 'karaoke-gt30', no: 7, name: 'Karaoke (phòng >30m²)', icon: 'MicIcon',
    accent: 'from-fuchsia-500/20 to-pink-500/10',
    unit: 'phòng',
    hint: '4 phòng đầu: 1,7/phòng · 6 phòng tiếp: 1,36/phòng · từ phòng 11: 1,19/phòng',
    inputs: [{ key: 'rooms', label: 'Số phòng karaoke >30m²', suffix: 'phòng' }],
    compute: ({ rooms }, mlcs) => karaokeBand(rooms || 0, [1.7, 1.36, 1.19], mlcs, '>30m²'),
  },
  {
    id: 'karaoke-box', no: 8, name: 'Karaoke Box', icon: 'MicIcon',
    accent: 'from-fuchsia-500/20 to-pink-500/10',
    unit: 'box',
    hint: '0,85/box/năm (không phụ thuộc diện tích)',
    inputs: [{ key: 'boxes', label: 'Số karaoke box', suffix: 'box' }],
    compute: ({ boxes }, mlcs) => {
      const q = boxes || 0;
      if (q <= 0) return emptyResult();
      const row: BreakdownRow = {
        label: `${q} box`,
        coefText: '0,85/box',
        qty: q,
        coef: 0.85,
        mode: 'per-room',
        amount: 0.85 * q * mlcs,
      };
      return applyCap([row], mlcs);
    },
  },
  {
    id: 'bar', no: 9, name: 'Bar, bistro, club, vũ trường', icon: 'MartiniIcon',
    accent: 'from-indigo-500/20 to-blue-500/10',
    unit: 'm²', capMultiplier: 27,
    hint: '≤50m²: 2,35–4,0/50m² · 50-200m²: +0,06/m² · >200m²: +0,05/m² · trần 27×MLCS',
    inputs: [
      { key: 'area', label: 'Tổng diện tích', suffix: 'm²' },
      { key: 'baseCoef', label: 'Hệ số khởi điểm (2,35–4,0)', suffix: '' },
    ],
    compute: ({ area, baseCoef }, mlcs) => {
      const b = baseCoef && baseCoef >= 2.35 && baseCoef <= 4.0 ? baseCoef : 2.35;
      return tierArea({
        area: area || 0, baseSalary: mlcs, capMult: 27,
        baseCoef: b, baseArea: 50, baseLabel: 'Đến 50 m²', baseCoefText: `${b.toString().replace('.', ',')}/50m²`,
        midUpTo: 200, midPerM2: 0.06, midLabel: '50 – 200 m²', midCoefText: '0,06/m²',
        highPerM2: 0.05, highLabel: 'Trên 200 m²', highCoefText: '0,05/m²',
      });
    },
  },
  {
    id: 'hotel-45', no: 10, name: 'Khách sạn 4–5 sao', icon: 'HotelIcon',
    accent: 'from-sky-500/20 to-cyan-500/10',
    unit: 'phòng',
    hint: '0,03/phòng/năm',
    inputs: [{ key: 'rooms', label: 'Số phòng (4–5 sao)', suffix: 'phòng' }],
    compute: ({ rooms }, mlcs) => flatPerUnit(rooms || 0, 0.03, 'phòng', mlcs),
  },
  {
    id: 'hotel-13', no: 11, name: 'Khách sạn 1–3 sao', icon: 'HotelIcon',
    accent: 'from-sky-500/20 to-cyan-500/10',
    unit: 'phòng',
    hint: '0,02/phòng/năm',
    inputs: [{ key: 'rooms', label: 'Số phòng (1–3 sao)', suffix: 'phòng' }],
    compute: ({ rooms }, mlcs) => flatPerUnit(rooms || 0, 0.02, 'phòng', mlcs),
  },
  {
    id: 'amusement', no: 12, name: 'Khu vui chơi, giải trí', icon: 'TreesIcon',
    accent: 'from-lime-500/20 to-green-500/10',
    unit: 'm²', capMultiplier: 12,
    hint: '≤200m²: 0,7/200m² · 200-500m²: +0,003/m² · >500m²: +0,001/m² · trần 12×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierArea({
      area: area || 0, baseSalary: mlcs, capMult: 12,
      baseCoef: 0.7, baseArea: 200, baseLabel: 'Đến 200 m²', baseCoefText: '0,7/200m²',
      midUpTo: 500, midPerM2: 0.003, midLabel: '200 – 500 m²', midCoefText: '0,003/m²',
      highPerM2: 0.001, highLabel: 'Trên 500 m²', highCoefText: '0,001/m²',
    }),
  },
  {
    id: 'mall', no: 13, name: 'TTTM, cao ốc văn phòng', icon: 'Building2Icon',
    accent: 'from-blue-500/20 to-indigo-500/10',
    unit: 'm²', capMultiplier: 50,
    hint: '≤200m²: 1,5/200m² · 200-500m²: +0,3/100m² · >500m²: +0,2/100m² · trần 50×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierPer100({
      area: area || 0, baseSalary: mlcs, capMult: 50,
      baseCoef: 1.5, baseArea: 200, baseLabel: 'Đến 200 m²', baseCoefText: '1,5/200m²',
      midUpTo: 500, midPer100: 0.3, midLabel: '200 – 500 m²', midCoefText: '0,3/100m²',
      highPer100: 0.2, highLabel: 'Trên 500 m²', highCoefText: '0,2/100m²',
    }),
  },
  {
    id: 'supermarket', no: 14, name: 'Siêu thị', icon: 'ShoppingCartIcon',
    accent: 'from-orange-500/20 to-amber-500/10',
    unit: 'm²', capMultiplier: 10,
    hint: '≤500m²: 1,25/500m² · 500-1000m²: +0,3/100m² · >1000m²: +0,2/100m² · trần 10×MLCS',
    inputs: [{ key: 'area', label: 'Tổng diện tích', suffix: 'm²' }],
    compute: ({ area }, mlcs) => tierPer100({
      area: area || 0, baseSalary: mlcs, capMult: 10,
      baseCoef: 1.25, baseArea: 500, baseLabel: 'Đến 500 m²', baseCoefText: '1,25/500m²',
      midUpTo: 1000, midPer100: 0.3, midLabel: '500 – 1000 m²', midCoefText: '0,3/100m²',
      highPer100: 0.2, highLabel: 'Trên 1000 m²', highCoefText: '0,2/100m²',
    }),
  },
  {
    id: 'avia-intl', no: 15, name: 'Hàng không – Chuyến bay quốc tế', icon: 'PlaneIcon',
    accent: 'from-cyan-500/20 to-sky-500/10',
    unit: 'lượt khách',
    hint: '0,0031 – 0,004/100 lượt khách/năm',
    inputs: [{ key: 'pax', label: 'Số lượt khách quốc tế/năm', suffix: 'lượt' }],
    compute: ({ pax }, mlcs) => paxPer100(pax || 0, 0.004, mlcs, 'quốc tế'),
  },
  {
    id: 'avia-dom', no: 16, name: 'Hàng không – Chuyến bay nội địa', icon: 'PlaneIcon',
    accent: 'from-cyan-500/20 to-sky-500/10',
    unit: 'lượt khách',
    hint: '0,0019 – 0,0025/100 lượt khách/năm',
    inputs: [{ key: 'pax', label: 'Số lượt khách nội địa/năm', suffix: 'lượt' }],
    compute: ({ pax }, mlcs) => paxPer100(pax || 0, 0.0025, mlcs, 'nội địa'),
  },
  {
    id: 'rail', no: 17, name: 'Đường sắt / Giao thông công cộng', icon: 'PlaneIcon',
    accent: 'from-cyan-500/20 to-sky-500/10',
    unit: 'lượt khách',
    hint: '0,0016 – 0,0021/100 lượt khách/năm',
    inputs: [{ key: 'pax', label: 'Số lượt khách/năm', suffix: 'lượt' }],
    compute: ({ pax }, mlcs) => paxPer100(pax || 0, 0.0021, mlcs, 'đường sắt'),
  },
  // ── Mục 5.4 — Biểu diễn theo hình thức hát với nhau, tiệc cưới, liên hoan sinh nhật...
  // Phí trọn gói VND/năm, không nhân hệ số đô thị.
  {

    id: 'sing-restaurant', no: 18,
    name: 'Hát với nhau – Nhà hàng / quán cà phê / CLB khiêu vũ',
    icon: 'MicVocalIcon',
    accent: 'from-violet-500/20 to-indigo-500/10',
    unit: 'chỗ', urbanExempt: true,
    hint: '<30 chỗ: 2.000.000 đ/năm trọn gói · ≥30 chỗ: 60.000 đ/chỗ/năm',
    inputs: [{ key: 'seats', label: 'Sức chứa (số chỗ)', suffix: 'chỗ' }],
    compute: ({ seats }, mlcs) => flatSeats(seats || 0, 2_000_000, 60_000, mlcs),
  },
  {
    id: 'sing-bar', no: 19,
    name: 'Hát với nhau – Vũ trường / bar / lounge / bistro / CLB đêm',
    icon: 'MartiniIcon',
    accent: 'from-fuchsia-500/20 to-rose-500/10',
    unit: 'chỗ', urbanExempt: true,
    hint: '<30 chỗ: 2.500.000 đ/năm trọn gói · ≥30 chỗ: 60.000 đ/chỗ/năm',
    inputs: [{ key: 'seats', label: 'Sức chứa (số chỗ)', suffix: 'chỗ' }],
    compute: ({ seats }, mlcs) => flatSeats(seats || 0, 2_500_000, 60_000, mlcs),
  },
  {
    id: 'wedding-hall', no: 20,
    name: 'Sảnh / khu vực tổ chức tiệc cưới',
    icon: 'HeartIcon',
    accent: 'from-pink-500/20 to-rose-500/10',
    unit: 'chỗ', urbanExempt: true,
    hint: 'Áp dụng 25% mức "Nhà hàng/quán cà phê" — <30 chỗ: 500.000 đ/năm · ≥30 chỗ: 15.000 đ/chỗ/năm',
    inputs: [{ key: 'seats', label: 'Sức chứa (số chỗ)', suffix: 'chỗ' }],
    compute: ({ seats }, mlcs) => flatSeats(seats || 0, 500_000, 15_000, mlcs),
  },
];

/** Phí trọn gói VND theo sức chứa — mục 5.4 NĐ 17/2023 */
function flatSeats(seats: number, flatUnder30: number, perSeatFrom30: number, mlcs: number): FieldResult {
  if (seats <= 0) return emptyResult();
  const amount = seats < 30 ? flatUnder30 : perSeatFrom30 * seats;
  const label = seats < 30
    ? `Sức chứa ${seats} chỗ (<30) — trọn gói`
    : `Sức chứa ${seats} chỗ (≥30) — ${formatVND(perSeatFrom30, false)}/chỗ`;
  const row: BreakdownRow = {
    label,
    coefText: seats < 30 ? 'trọn gói/năm' : `${formatVND(perSeatFrom30, false)}/chỗ/năm`,
    qty: seats < 30 ? 1 : seats,
    coef: amount / Math.max(mlcs, 1),
    mode: 'flat',
    amount,
  };
  return {
    rows: [row],
    totalCoef: amount / Math.max(mlcs, 1),
    subTotal: amount,
    capped: false,
    hasInput: true,
    urbanExempt: true,
  };
}


function karaokeBand(rooms: number, rates: [number, number, number], mlcs: number, sizeLabel: string): FieldResult {
  if (rooms <= 0) return emptyResult();
  const rows: BreakdownRow[] = [];
  const b1 = Math.min(rooms, 4);
  const b2 = Math.min(Math.max(rooms - 4, 0), 6);
  const b3 = Math.max(rooms - 10, 0);
  if (b1 > 0) rows.push({
    label: `4 phòng đầu (${sizeLabel})`,
    coefText: `${rates[0].toString().replace('.', ',')}/phòng`,
    qty: b1, coef: rates[0], mode: 'per-room', amount: rates[0] * b1 * mlcs,
  });
  if (b2 > 0) rows.push({
    label: `Phòng 5 – ${Math.min(rooms, 10)}`,
    coefText: `${rates[1].toString().replace('.', ',')}/phòng`,
    qty: b2, coef: rates[1], mode: 'per-room', amount: rates[1] * b2 * mlcs,
  });
  if (b3 > 0) rows.push({
    label: `Từ phòng 11 trở đi`,
    coefText: `${rates[2].toString().replace('.', ',')}/phòng`,
    qty: b3, coef: rates[2], mode: 'per-room', amount: rates[2] * b3 * mlcs,
  });
  return applyCap(rows, mlcs);
}

function flatPerUnit(qty: number, coef: number, unit: string, mlcs: number): FieldResult {
  if (qty <= 0) return emptyResult();
  const row: BreakdownRow = {
    label: `${qty} ${unit}`,
    coefText: `${coef.toString().replace('.', ',')}/${unit}`,
    qty, coef, mode: 'per-room', amount: coef * qty * mlcs,
  };
  return applyCap([row], mlcs);
}

function paxPer100(pax: number, coefPer100: number, mlcs: number, kind: string): FieldResult {
  if (pax <= 0) return emptyResult();
  const units = pax / 100;
  const row: BreakdownRow = {
    label: `${pax.toLocaleString('vi-VN')} lượt khách (${kind})`,
    coefText: `${coefPer100.toString().replace('.', ',')}/100 lượt`,
    qty: units, coef: coefPer100, mode: 'per-pax', amount: coefPer100 * units * mlcs,
  };
  return applyCap([row], mlcs);
}

// ── Aggregation ────────────────────────────────────────────────────────────

export type QuoteTotals = {
  /** Tổng subTotal (sau trần) trước hệ số đô thị */
  rawSubTotal: number;
  /** Sau hệ số đô thị */
  afterUrban: number;
  /** Sau hỗ trợ chung */
  afterSupport: number;
  /** Tiền VAT */
  vat: number;
  /** Tổng giá trị hợp đồng (sau VAT) */
  grandTotal: number;
};

export function computeQuoteTotals(params: {
  perField: FieldResult[];
  urbanFactor: number;
  supportPct: number; // 0..1
  vatPct: number;     // 0..1
}): QuoteTotals {
  const raw = params.perField.reduce((s, r) => s + r.subTotal, 0);
  const exempt = params.perField.reduce((s, r) => s + (r.urbanExempt ? r.subTotal : 0), 0);
  const urbanScaled = raw - exempt;
  const afterUrban = urbanScaled * params.urbanFactor + exempt;
  const afterSupport = afterUrban * (1 - params.supportPct);
  const vat = afterSupport * params.vatPct;

  return {
    rawSubTotal: raw,
    afterUrban,
    afterSupport,
    vat,
    grandTotal: afterSupport + vat,
  };
}

export function formatVND(v: number, withSymbol = true): string {
  if (!isFinite(v)) return '0';
  const s = new Intl.NumberFormat('vi-VN').format(Math.round(v));
  return withSymbol ? s + ' đ' : s;
}

export function formatCoef(v: number, digits = 4): string {
  if (!isFinite(v)) return '0';
  return v.toLocaleString('vi-VN', { maximumFractionDigits: digits });
}
