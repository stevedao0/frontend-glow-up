/**
 * Dashboard contract helpers — provides typed contract rows for the Dashboard page.
 *
 * NOTE: In the new architecture, contract data should come from the API.
 * This file is a transitional shim. It will be replaced by real API data
 * once the Dashboard page is migrated to use /api/reports/summary.
 *
 * No new static data should be added here.
 */
import { getExpiryStatus } from './contractRecords';
import type { ContractRecord } from './contractRecords';

export type DashboardContractRow = {
  id: string;
  contractNo: string;
  partner: string;
  field: string;
  signedDate: string;
  value: number | null;
  status: 'active' | 'expiring' | 'expired' | 'draft' | 'pending';
  brand: string | null;
};

const FEATURED_IDS = [4119, 4114, 4113, 4112, 4111, 4109];

/**
 * Build dashboard rows from a list of contract records.
 * This function is the new way — call this with data from /api/reports/summary.
 */
export function buildDashboardRows(contracts: ContractRecord[]): DashboardContractRow[] {
  return FEATURED_IDS.map((id) => contracts.find((r) => r.id === id))
    .filter((r): r is ContractRecord => Boolean(r))
    .map((r) => {
      const exp = getExpiryStatus(r.ngay_ket_thuc);
      let status: DashboardContractRow['status'] = exp.status;
      if (r.renewal_status === 'PENDING_RENEWAL') status = 'pending';
      return {
        id: String(r.id),
        contractNo: r.contract_no,
        partner: r.don_vi_ten,
        brand: r.ten_bang_hieu,
        field: r.linh_vuc_hien_thi,
        signedDate: r.ngay_lap_hop_dong,
        value: r.so_tien_value,
        status,
      };
    });
}

/**
 * @deprecated Use buildDashboardRows(contracts) with real data from API.
 * Static fallback — kept to avoid breaking DashboardPage imports.
 */
export const RECENT_CONTRACTS: DashboardContractRow[] = [];
