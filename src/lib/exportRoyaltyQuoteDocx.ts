/**
 * Xuất báo giá tiền bản quyền âm nhạc (NĐ 17/2023) ra file .docx.
 * Dùng thư viện `docx` chạy trực tiếp trong trình duyệt.
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ShadingType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { FieldResult, FIELDS, QuoteTotals, formatVND } from './royaltyCalc';
import { numberToVietnameseWords } from './numberToVietnameseWords';

const VCPMC = {
  fullName: 'TRUNG TÂM BẢO VỆ QUYỀN TÁC GIẢ ÂM NHẠC VIỆT NAM',
  shortName: 'VCPMC',
  hq: 'Số nhà 23, ngách 2/5, ngõ 397 đường Phạm Văn Đồng, phường Xuân Đỉnh, TP. Hà Nội',
  hqPhone: '(+84 24) 3762 4718 | (+84 24) 3762 4719',
  south: 'Số 91-93 đường số 5, KP 4, phường Bình Trưng, TP. Hồ Chí Minh (Tòa nhà VCPMC Crescendo)',
  southPhone: '(+84 28) 3829 9225 | (+84 28) 3910 2385',
  daNang: '168 Lý Tự Trọng, phường Hải Châu, Đà Nẵng',
  daNangPhone: '(+84 23) 6389 8458',
  email: 'info@vcpmc.org',
  website: 'vcpmc.org',
};

const COLOR = {
  black: '0A0A0F',
  ink: '111827',
  mute: '64748B',
  divider: 'E2E8F0',
  accent: '4F46E5',
  ok: '047857',
  warn: 'B45309',
  rowAlt: 'F8FAFC',
  rowTotal: 'EEF2FF',
  rowGrand: '0F172A',
};

const FONT = 'Inter';
const MONO = 'Consolas';

const b = (color: string, size = 4) => ({
  top: { style: BorderStyle.SINGLE, size, color },
  bottom: { style: BorderStyle.SINGLE, size, color },
  left: { style: BorderStyle.SINGLE, size, color },
  right: { style: BorderStyle.SINGLE, size, color },
}) as const;

function txt(text: string, opts: Partial<{ bold: boolean; size: number; color: string; italic: boolean; font: string }> = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italic,
    size: opts.size ?? 22,
    color: opts.color ?? COLOR.ink,
    font: opts.font ?? FONT,
  });
}

function p(children: TextRun[] | string, opts: Partial<{ align: typeof AlignmentType[keyof typeof AlignmentType]; spacing: number }> = {}) {
  const runs = typeof children === 'string' ? [txt(children)] : children;
  return new Paragraph({
    children: runs,
    alignment: opts.align,
    spacing: { after: opts.spacing ?? 80 },
  });
}

function cell(content: Paragraph[] | string, opts: Partial<{
  shading: string; width: number; bold: boolean;
  align: typeof AlignmentType[keyof typeof AlignmentType];
  mono: boolean; color: string;
}> = {}) {
  const paras = typeof content === 'string'
    ? [p([txt(content, { bold: opts.bold, font: opts.mono ? MONO : FONT, color: opts.color })], { align: opts.align })]
    : content;
  return new TableCell({
    children: paras,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: b(COLOR.divider, 4),
  });
}

export type ExportData = {
  customer: { name: string; address: string; representative?: string; location?: string; };
  contractMonths: number;
  baseSalary: number;
  urbanLabel: string;
  urbanFactor: number;
  supportPct: number;
  vatPct: number;
  perField: { fieldId: string; vals: Record<string, number>; result: FieldResult }[];
  totals: QuoteTotals;
  quoteNo?: string;
  quoteDate?: string;
};

function fieldSection(item: ExportData['perField'][number], baseSalary: number): (Paragraph | Table)[] {
  const field = FIELDS.find(f => f.id === item.fieldId)!;
  const { result } = item;
  const out: (Paragraph | Table)[] = [];

  out.push(p([txt(`${field.no}. ${field.name.toUpperCase()}`, { bold: true, size: 24, color: COLOR.accent })], { spacing: 80 }));
  const inputText = field.inputs.map(inp => {
    const v = item.vals[inp.key];
    if (!v) return null;
    return `${inp.label}: ${v.toLocaleString('vi-VN')} ${inp.suffix || ''}`.trim();
  }).filter(Boolean).join(' · ');
  if (inputText) out.push(p([txt(inputText, { italic: true, color: COLOR.mute, size: 20 })], { spacing: 120 }));

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell('Bậc tính', { width: 3400, bold: true, shading: 'F1F5F9' }),
      cell('MLCS', { width: 1800, bold: true, shading: 'F1F5F9', align: AlignmentType.CENTER }),
      cell('Hệ số', { width: 2000, bold: true, shading: 'F1F5F9', align: AlignmentType.CENTER }),
      cell('Số lượng', { width: 1400, bold: true, shading: 'F1F5F9', align: AlignmentType.CENTER }),
      cell('Thành tiền', { width: 1860, bold: true, shading: 'F1F5F9', align: AlignmentType.RIGHT }),
    ],
  });

  const dataRows = result.rows.map(r => new TableRow({
    children: [
      cell(r.label),
      cell(formatVND(baseSalary, false), { mono: true, align: AlignmentType.CENTER }),
      cell(r.coefText, { mono: true, align: AlignmentType.CENTER, color: COLOR.accent }),
      cell(formatNumber(r.qty), { mono: true, align: AlignmentType.CENTER }),
      cell(formatVND(r.amount), { mono: true, align: AlignmentType.RIGHT, bold: true }),
    ],
  }));

  const totalRow = new TableRow({
    children: [
      cell('Cộng', { bold: true, shading: COLOR.rowTotal }),
      cell('', { shading: COLOR.rowTotal }),
      cell('', { shading: COLOR.rowTotal }),
      cell('', { shading: COLOR.rowTotal }),
      cell(formatVND(result.subTotal), { mono: true, align: AlignmentType.RIGHT, bold: true, shading: COLOR.rowTotal }),
    ],
  });

  const allRows: (typeof dataRows)[number][] = [headerRow, ...dataRows, totalRow];

  if (result.capMultiplier !== undefined) {
    allRows.push(new TableRow({
      children: [
        cell(`Mức trần áp dụng: ${result.capMultiplier}×MLCS${result.capped ? ' (ĐÃ ÁP TRẦN)' : ''}`, { italic: true, color: result.capped ? COLOR.warn : COLOR.mute }),
        cell('', {}), cell('', {}), cell('', {}),
        cell(formatVND(result.capAmount || 0), { mono: true, align: AlignmentType.RIGHT, color: result.capped ? COLOR.warn : COLOR.mute }),
      ],
    }));
  }

  out.push(new Table({
    width: { size: 10460, type: WidthType.DXA },
    columnWidths: [3400, 1800, 2000, 1400, 1860],
    rows: allRows,
  }));
  return out;
}

function formatNumber(v: number): string {
  if (!isFinite(v)) return '0';
  if (Math.abs(v - Math.round(v)) < 0.0001) return Math.round(v).toLocaleString('vi-VN');
  return v.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function summaryRow(label: string, amount: number, isGrand = false): TableRow {
  return new TableRow({
    children: [
      cell(label, {
        bold: isGrand, align: AlignmentType.LEFT,
        shading: isGrand ? COLOR.rowGrand : COLOR.rowAlt,
        color: isGrand ? 'FFFFFF' : COLOR.ink,
      }),
      cell(formatVND(amount), {
        mono: true, align: AlignmentType.RIGHT, bold: true,
        shading: isGrand ? COLOR.rowGrand : COLOR.rowAlt,
        color: isGrand ? 'FFFFFF' : COLOR.ok,
      }),
    ],
  });
}

function collectContent(data: ExportData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  out.push(p([txt(VCPMC.fullName, { bold: true, size: 22, color: COLOR.accent })], { align: AlignmentType.CENTER, spacing: 40 }));
  out.push(p([txt(`Trụ sở: ${VCPMC.hq}`, { size: 18, color: COLOR.mute })], { align: AlignmentType.CENTER, spacing: 30 }));
  out.push(p([txt(`Điện thoại: ${VCPMC.hqPhone} · Email: ${VCPMC.email} · Website: ${VCPMC.website}`, { size: 18, color: COLOR.mute })], { align: AlignmentType.CENTER, spacing: 30 }));
  out.push(p([txt(`Chi nhánh phía Nam: ${VCPMC.south} – ĐT: ${VCPMC.southPhone}`, { size: 18, color: COLOR.mute })], { align: AlignmentType.CENTER, spacing: 30 }));
  out.push(p([txt(`VP Đà Nẵng: ${VCPMC.daNang} – ĐT: ${VCPMC.daNangPhone}`, { size: 18, color: COLOR.mute })], { align: AlignmentType.CENTER, spacing: 200 }));

  out.push(p([txt('BẢNG BÁO GIÁ TIỀN BẢN QUYỀN ÂM NHẠC', { bold: true, size: 32, color: COLOR.ink })], { align: AlignmentType.CENTER, spacing: 40 }));
  out.push(p([txt('Căn cứ Nghị định 17/2023/NĐ-CP ngày 26/4/2023 — Phụ lục biểu mức tiền bản quyền', { italic: true, color: COLOR.mute, size: 20 })], { align: AlignmentType.CENTER, spacing: 240 }));

  if (data.quoteNo || data.quoteDate) {
    out.push(p([
      txt(`Số báo giá: ${data.quoteNo || '—'} `, { size: 20 }),
      txt(`Ngày: ${data.quoteDate || new Date().toLocaleDateString('vi-VN')}`, { size: 20 }),
    ], { align: AlignmentType.RIGHT, spacing: 200 }));
  }

  out.push(p([txt('THÔNG TIN KHÁCH HÀNG', { bold: true, size: 22, color: COLOR.accent })], { spacing: 80 }));
  out.push(p([txt('Tên đơn vị: ', { bold: true }), txt(data.customer.name || '………………………')]));
  out.push(p([txt('Địa chỉ: ', { bold: true }), txt(data.customer.address || '………………………')]));
  if (data.customer.representative) out.push(p([txt('Người đại diện: ', { bold: true }), txt(data.customer.representative)]));
  out.push(p([txt('Phân loại đô thị: ', { bold: true }), txt(`${data.urbanLabel} (${(data.urbanFactor * 100).toFixed(0)}% khung giá)`)]));
  out.push(p([txt('Thời hạn hợp đồng: ', { bold: true }), txt(`${data.contractMonths} tháng`)]));
  out.push(p([txt('Mức lương cơ sở áp dụng: ', { bold: true }), txt(formatVND(data.baseSalary))], { spacing: 200 }));

  out.push(p([txt('CHI TIẾT TÍNH TIỀN BẢN QUYỀN', { bold: true, size: 22, color: COLOR.accent })], { spacing: 120 }));

  for (const item of data.perField) {
    out.push(...fieldSection(item, data.baseSalary));
  }

  out.push(p([], { spacing: 240 }));
  out.push(p([txt('TỔNG HỢP BÁO GIÁ', { bold: true, size: 24, color: COLOR.accent })], { spacing: 120 }));

  out.push(new Table({
    width: { size: 10460, type: WidthType.DXA },
    columnWidths: [6960, 3500],
    rows: [
      summaryRow('Cộng tiền bản quyền (sau áp trần)', data.totals.rawSubTotal),
      summaryRow(`Hệ số đô thị (${data.urbanLabel}: ${(data.urbanFactor * 100).toFixed(0)}%)`, data.totals.afterUrban),
      summaryRow(`Hỗ trợ chung trước thuế GTGT: ${(data.supportPct * 100).toFixed(0)}%`, data.totals.afterSupport),
      summaryRow(`Thuế GTGT ${(data.vatPct * 100).toFixed(0)}%`, data.totals.vat),
      summaryRow('TỔNG GIÁ TRỊ HỢP ĐỒNG (đã gồm VAT)', data.totals.grandTotal, true),
    ],
  }));

  out.push(p([], { spacing: 120 }));
  out.push(p([
    txt('Bằng chữ: ', { bold: true }),
    txt(`${numberToVietnameseWords(data.totals.grandTotal)}./.`, { italic: true }),
  ]));

  out.push(p([], { spacing: 200 }));
  out.push(p([txt('GHI CHÚ', { bold: true, color: COLOR.accent })], { spacing: 60 }));
  out.push(p([txt('• Báo giá lập theo Nghị định 17/2023/NĐ-CP ngày 26/4/2023 — Phụ lục biểu mức tiền bản quyền.', { size: 20, color: COLOR.mute })]));
  out.push(p([txt('• Tỷ lệ áp dụng theo phân loại đô thị (NĐ 134/2026/NĐ-CP): HN/TP.HCM 100%; loại I 80%; loại II 50%; loại III 20% (vùng sâu, vùng xa, vùng ĐB khó khăn 10%).', { size: 20, color: COLOR.mute })]));
  out.push(p([txt('• Báo giá có hiệu lực 30 ngày kể từ ngày phát hành.', { size: 20, color: COLOR.mute })]));
  out.push(p([txt('• Mức lương cơ sở thay đổi theo quy định của Chính phủ tại từng thời điểm.', { size: 20, color: COLOR.mute })]));

  out.push(p([], { spacing: 360 }));
  out.push(new Table({
    width: { size: 10460, type: WidthType.DXA },
    columnWidths: [5230, 5230],
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 5230, type: WidthType.DXA },
          borders: b('FFFFFF', 0),
          children: [
            p([txt('ĐẠI DIỆN KHÁCH HÀNG', { bold: true })], { align: AlignmentType.CENTER }),
            p([txt('(Ký, ghi rõ họ tên, đóng dấu)', { italic: true, color: COLOR.mute, size: 18 })], { align: AlignmentType.CENTER }),
          ],
        }),
        new TableCell({
          width: { size: 5230, type: WidthType.DXA },
          borders: b('FFFFFF', 0),
          children: [
            p([txt('ĐẠI DIỆN VCPMC', { bold: true })], { align: AlignmentType.CENTER }),
            p([txt('(Ký, ghi rõ họ tên, đóng dấu)', { italic: true, color: COLOR.mute, size: 18 })], { align: AlignmentType.CENTER }),
          ],
        }),
      ],
    })],
  }));

  return out;
}

function buildDoc(data: ExportData): Document {
  const childrenAll = collectContent(data);
  return new Document({
    creator: 'VCPMC',
    title: 'Báo giá tiền bản quyền âm nhạc',
    description: 'Báo giá theo Nghị định 17/2023/NĐ-CP',
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: childrenAll,
    }],
  });
}

export function buildRoyaltyQuoteDoc(data: ExportData): Document {
  return buildDoc(data);
}

export async function exportRoyaltyQuoteDocx(data: ExportData): Promise<void> {
  const doc = buildDoc(data);
  const blob = await Packer.toBlob(doc);
  const filename = `BaoGia-VCPMC-${(data.customer.name || 'KhachHang').replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, filename);
}
