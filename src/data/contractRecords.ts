/**
 * Contract record types — mirrors backend ContractRecordRow model.
 *
 * These types are kept for reference. In the new architecture, contract data
 * is fetched from /api/reports/summary (real-time from DB).
 * The old static CONTRACT_RECORDS array has been removed.
 */
export type RenewalStatus = 'NEW' | 'PENDING_RENEWAL' | 'RENEWED' | null;

export type ContractRecord = {
  id: number;
  contract_no: string;
  contract_year: number;
  don_vi_ten: string;
  ten_bang_hieu: string | null;
  dia_chi_su_dung: string;
  linh_vuc_hien_thi: string;
  region_code: string;
  field_code: string;
  ngay_lap_hop_dong: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  so_tien_value: number | null;
  renewal_status: RenewalStatus;
  is_renewable: boolean;
  loai_hinh_karaoke: string | null;
  tong_so_phong: number | null;
  tong_so_box: number | null;
};

// ---- Computed status helpers ----

export type ExpiryStatus = 'active' | 'expiring' | 'expired';

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(
  endIso: string,
  todayIso: string = new Date().toISOString().slice(0, 10)
): { status: ExpiryStatus; daysLeft: number } {
  const daysLeft = daysBetween(todayIso, endIso);
  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft <= 60) return { status: 'expiring', daysLeft };
  return { status: 'active', daysLeft };
}

export const RENEWAL_LABEL: Record<NonNullable<RenewalStatus> | 'UNKNOWN', string> = {
  NEW: 'Hợp đồng mới',
  PENDING_RENEWAL: 'Chờ tái ký',
  RENEWED: 'Đã tái ký',
  UNKNOWN: 'Chưa xác định',
};
