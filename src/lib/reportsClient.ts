/**
 * Reports API client — fetches real data from /api/reports endpoints.
 *
 * All endpoints are READ-ONLY. No DB writes, no file generation, no GCN creation.
 */
import { apiRequest } from "./apiClient";

// =============================================================================
// Response types — match backend Pydantic schemas
// =============================================================================

export type RevenueYearItem = {
  year: number;
  contract_count: number;
  total_revenue: number | null;
  cumulative: boolean;
};

export type ExpiringContractItem = {
  id: number;
  contract_no: string;
  partner: string;
  field: string;
  expire_date: string | null;
  days_left: number;
  value: number | null;
};

export type FieldCategoryCount = {
  key: string;
  label: string;
  count: number;
};

export type GcnStatusCount = {
  status: string;
  label: string;
  count: number;
};

export type SignedContractItem = {
  id: number;
  contract_no: string;
  signed_date: string | null;
  partner: string;
  brand: string | null;
  field: string | null;
  value: number | null;
  gcn_status: string;
  renewal_status: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type CertificateListItem = {
  id: number;
  certificate_no: string | null;
  contract_no: string;
  organization_name: string;
  status: string;
  print_count: number;
  printed_at: string | null;
};

export type ReportsSummary = {
  total_contracts: number;
  active_count: number;
  expiring_30d_count: number;
  expiring_60d_count: number;
  expired_count: number;
  pending_renewal_count: number;
  new_count: number;
  unknown_status_count: number;
  revenue_by_year: RevenueYearItem[];
  expiring_contracts: ExpiringContractItem[];
  field_breakdown: FieldCategoryCount[];
  signed_contracts: SignedContractItem[];
  certificate_total: number;
  certificate_by_status: GcnStatusCount[];
  certificate_recent: CertificateListItem[];
  total_works: number;
  gcn_draft: number;
  gcn_test_printed: number;
  gcn_final_printed: number;
};

export type ExpiringContractsResponse = {
  items: ExpiringContractItem[];
  total: number;
};

export type CertificateListResponse = {
  items: CertificateListItem[];
  total: number;
};

// =============================================================================
// API calls
// =============================================================================

/**
 * Fetch real-time report summary from database.
 * GET /api/reports/summary
 *
 * Returns KPIs, revenue by year, expiring contracts, field breakdown,
 * signed contracts, and certificate stats — all computed live from DB.
 */
export function getReportsSummary(token: string): Promise<ReportsSummary> {
  return apiRequest<ReportsSummary>("/reports/summary", { token });
}

/**
 * List certificates for the Reports page GCN table.
 * GET /api/reports/certificates
 *
 * Supports filtering by status (draft, test_printed, final_printed).
 */
export function listReportsCertificates(
  token: string,
  params: { page?: number; page_size?: number; status?: string } = {}
): Promise<CertificateListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.status) qs.set("status", params.status);
  const suffix = qs.toString();
  return apiRequest<CertificateListResponse>(
    `/reports/certificates${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

/**
 * List contracts expiring within N days.
 * GET /api/reports/contracts/expiring
 *
 * Sorted by end_date ascending.
 */
export function listExpiringContracts(
  token: string,
  params: { days?: number; page?: number; page_size?: number } = {}
): Promise<ExpiringContractsResponse> {
  const qs = new URLSearchParams();
  if (params.days) qs.set("days", String(params.days));
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const suffix = qs.toString();
  return apiRequest<ExpiringContractsResponse>(
    `/reports/contracts/expiring${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}
