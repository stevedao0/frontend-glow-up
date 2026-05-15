/**
 * Reports data — type definitions and helper functions.
 *
 * IMPORTANT: All real data is fetched from /api/reports/summary endpoint.
 * This file only contains:
 *   - Type definitions (mirroring backend Pydantic schemas)
 *   - Helper functions for field category mapping
 *   - Canonical field category definitions
 *
 * No hardcoded mock/clone data here.
 */

import type {
  RevenueYearItem,
  ExpiringContractItem,
  FieldCategoryCount,
  ReportsSummary,
} from '../lib/reportsClient';

// =============================================================================
// Field categories (canonical labels used in UI)
// Mirrors backend CANONICAL_FIELD_LABELS mapping
// =============================================================================

export type FieldCategoryKey =
  | 'karaoke'
  | 'phong_thu_am'
  | 'cafe'
  | 'nha_hang'
  | 'khach_san'
  | 'khu_vui_choi'
  | 'tttm'
  | 'bar'
  | 'van_phong'
  | 'cua_hang'
  | 'rap_phim'
  | 'phong_tra'
  | 'cssk'
  | 'sieu_thi'
  | 'bieu_dien';

export type FieldCategory = {
  key: FieldCategoryKey;
  label: string;
  description: string;
  rawMatches: string[];
};

// Canonical field categories shown in UI.
// Each maps to one or more raw DB values.
export const FIELD_CATEGORIES: FieldCategory[] = [
  {
    key: 'karaoke',
    label: 'Karaoke',
    description: 'Cơ sở có giấy phép phòng karaoke đạt chuẩn.',
    rawMatches: ['Karaoke', 'KARAOKE', 'karaoke'],
  },
  {
    key: 'phong_thu_am',
    label: 'Phòng thu âm',
    description:
      'Cơ sở không thuộc điều kiện phân loại Karaoke, ghi nhận theo nhóm phòng thu âm.',
    rawMatches: ['Phòng thu âm', 'Phòng Thu Âm', 'PTA', 'Phòng ghi âm'],
  },
  {
    key: 'cafe',
    label: 'Cà phê',
    description: 'Quán cà phê.',
    rawMatches: ['Cà phê', 'Cafe', 'Coffee', 'cafe'],
  },
  {
    key: 'nha_hang',
    label: 'Nhà hàng',
    description: 'Nhà hàng ăn uống.',
    rawMatches: ['Nhà hàng', 'restaurant'],
  },
  {
    key: 'khach_san',
    label: 'Khách sạn',
    description: 'Khách sạn lưu trú.',
    rawMatches: ['Khách sạn', 'Hotel', 'hotel'],
  },
  {
    key: 'khu_vui_choi',
    label: 'Khu vui chơi',
    description: 'Khu vui chơi giải trí.',
    rawMatches: ['Khu vui chơi', 'Khu vui chơi giải trí', 'entertainment'],
  },
  {
    key: 'tttm',
    label: 'Trung tâm thương mại',
    description: 'Trung tâm thương mại / Mall.',
    rawMatches: ['Trung tâm thương mại', 'TTTM', 'Mall', 'shopping_mall'],
  },
  {
    key: 'bar',
    label: 'Bar',
    description: 'Bar / Lounge / Club.',
    rawMatches: ['Bar', 'Lounge', 'Club'],
  },
  {
    key: 'van_phong',
    label: 'Văn phòng',
    description: 'Văn phòng làm việc.',
    rawMatches: ['Văn phòng', 'Office'],
  },
  {
    key: 'cua_hang',
    label: 'Cửa hàng',
    description: 'Cửa hàng bán lẻ.',
    rawMatches: ['Cửa hàng', 'Store', 'Shop'],
  },
  {
    key: 'rap_phim',
    label: 'Rạp phim',
    description: 'Rạp chiếu phim.',
    rawMatches: ['Rạp phim', 'Cinema'],
  },
  {
    key: 'phong_tra',
    label: 'Phòng trà',
    description: 'Phòng trà / Acoustic.',
    rawMatches: ['Phòng trà', 'Acoustic', 'Tea room'],
  },
  {
    key: 'cssk',
    label: 'Chăm sóc sức khỏe',
    description: 'Spa / Gym / Fitness.',
    rawMatches: ['Chăm sóc sức khỏe', 'Spa', 'Gym', 'Fitness'],
  },
  {
    key: 'sieu_thi',
    label: 'Siêu thị',
    description: 'Siêu thị / Supermarket.',
    rawMatches: ['Siêu thị', 'Supermarket'],
  },
  {
    key: 'bieu_dien',
    label: 'Biểu diễn',
    description: 'Sự kiện biểu diễn / Performance.',
    rawMatches: ['Biểu diễn', 'Performance', 'Event'],
  },
];

// Reverse-lookup: raw DB value -> canonical category
const RAW_TO_CATEGORY: Record<string, FieldCategoryKey> = (() => {
  const map: Record<string, FieldCategoryKey> = {};
  for (const cat of FIELD_CATEGORIES) {
    for (const raw of cat.rawMatches) {
      map[raw.toLowerCase()] = cat.key;
    }
  }
  return map;
})();

/**
 * Map a raw DB linh_vuc_hien_thi value to a canonical category key.
 * Returns null if no mapping found.
 */
export function mapRawFieldToCategory(
  raw: string | null | undefined
): FieldCategoryKey | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  // "Phòng ghi âm" is dirty legacy data — excluded from mapping
  if (key === 'phòng ghi âm') return null;
  return RAW_TO_CATEGORY[key] ?? null;
}

// =============================================================================
// Types for reports UI (mirroring backend response)
// =============================================================================

export type { RevenueYearItem, ExpiringContractItem, FieldCategoryCount };

export type ExpiringReportRow = ExpiringContractItem;

// =============================================================================
// Insight bullets — generated from real data in ReportsPage.tsx
// These are computed dynamically, not stored here.
// =============================================================================

export type ReportInsight = {
  id: string;
  tone: 'rose' | 'amber' | 'indigo' | 'violet' | 'emerald';
  title: string;
  description: string;
};

/**
 * Build insight bullets from real ReportsSummary data.
 */
export function buildReportInsights(data: ReportsSummary): ReportInsight[] {
  const insights: ReportInsight[] = [];

  if (data.expired_count > 0) {
    insights.push({
      id: 'i1',
      tone: 'rose',
      title: `${data.expired_count.toLocaleString('vi-VN')} hợp đồng đã hết hạn`,
      description:
        'Cần ưu tiên rà soát và đưa vào quy trình tái ký để khôi phục doanh thu.',
    });
  }

  if (data.expiring_60d_count > 0) {
    insights.push({
      id: 'i2',
      tone: 'amber',
      title: `${data.expiring_60d_count} hợp đồng sẽ hết hạn trong 60 ngày`,
      description:
        data.expiring_30d_count > 0
          ? `Trong đó ${data.expiring_30d_count} hợp đồng sẽ hết hạn trong 30 ngày — cần xử lý sớm.`
          : 'Cần theo dõi và chuẩn bị tái ký.',
    });
  }

  const currentYear = new Date().getFullYear();
  const currentYearRevenue = data.revenue_by_year.find(
    (y) => y.year === currentYear && y.total_revenue != null
  );
  if (currentYearRevenue && currentYearRevenue.total_revenue != null) {
    const revenueBn = (currentYearRevenue.total_revenue / 1_000_000_000).toFixed(2);
    insights.push({
      id: 'i3',
      tone: 'emerald',
      title: `Doanh thu ${currentYear} đạt ${revenueBn} tỷ`,
      description: `Từ ${currentYearRevenue.contract_count} hợp đồng — dữ liệu lũy kế tính đến hôm nay.`,
    });
  }

  if (data.gcn_draft > 0) {
    insights.push({
      id: 'i4',
      tone: 'violet',
      title: `${data.gcn_draft.toLocaleString('vi-VN')} GCN ở trạng thái bản nháp`,
      description:
        'Phần lớn GCN chưa được cấp số. Cần đẩy nhanh quy trình cấp số & in.',
    });
  }

  if (data.unknown_status_count > 0) {
    insights.push({
      id: 'i5',
      tone: 'indigo',
      title: `${data.unknown_status_count} hợp đồng chưa xác định trạng thái`,
      description:
        'Các hợp đồng này không có renewal_status và ngày kết thúc. Cần rà soát dữ liệu.',
    });
  }

  return insights;
}
