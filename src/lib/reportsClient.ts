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

export type EmployeeStatsItem = {
  name: string;
  signed_this_week: number;
  signed_this_month: number;
  signed_this_quarter: number;
  signed_this_year: number;
  total_value: number;
  avg_value: number;
  pending_count: number;
  expiring_soon: number;
};

export type EmployeeStatsResponse = {
  employees: EmployeeStatsItem[];
  total_employees: number;
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

/**
 * Get employee performance statistics.
 * GET /api/reports/employees
 *
 * Returns stats per employee: signed contracts, values, pending, expiring soon.
 */
export function getEmployeeStats(token: string): Promise<EmployeeStatsResponse> {
  return apiRequest<EmployeeStatsResponse>("/reports/employees", { token });
}

// =============================================================================
// Export functions — download Excel (.xlsx) files
// =============================================================================

export type ExportContractsParams = {
  q?: string;
  year?: number;
  domain?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
};

export type ExportExpiringParams = {
  days?: number;
  domain?: string;
  q?: string;
};

export type ExportRevenueParams = {
  year?: number;
  domain?: string;
  date_from?: string;
  date_to?: string;
};

/**
 * Build query string from params
 */
function buildExportParams(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  const suffix = qs.toString();
  return suffix ? `?${suffix}` : "";
}

/**
 * Generic export download using fetch with blob response
 */
async function downloadExportFile(
  url: string,
  token: string,
  filename: string
): Promise<void> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Try to parse error from JSON response
    let errorMessage = `Export failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Not JSON, use default message
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("spreadsheetml") && !contentType.includes("excel")) {
    throw new Error(`Invalid content-type: ${contentType}. Expected Excel file.`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

/**
 * Export contracts to Excel (.xlsx)
 * GET /api/reports/contracts/export-xlsx
 */
export async function exportContractsExcel(
  token: string,
  params: ExportContractsParams = {}
): Promise<void> {
  const suffix = buildExportParams(params);
  const url = `/api/reports/contracts/export-xlsx${suffix}`;
  // Generate filename with current date
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `bao_cao_hop_dong_${today}.xlsx`);
}

/**
 * Export expiring contracts to Excel (.xlsx)
 * GET /api/reports/contracts/expiring/export-xlsx
 */
export async function exportExpiringContractsExcel(
  token: string,
  params: ExportExpiringParams = {}
): Promise<void> {
  const suffix = buildExportParams(params);
  const url = `/api/reports/contracts/expiring/export-xlsx${suffix}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `hop_dong_sap_het_han_${today}.xlsx`);
}

/**
 * Export revenue summary to Excel (.xlsx)
 * GET /api/reports/revenue/export-xlsx
 */
export async function exportRevenueExcel(
  token: string,
  params: ExportRevenueParams = {}
): Promise<void> {
  const suffix = buildExportParams(params);
  const url = `/api/reports/revenue/export-xlsx${suffix}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `bao_cao_doanh_thu_${today}.xlsx`);
}
