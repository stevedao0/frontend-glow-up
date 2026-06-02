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
  isNull?: boolean;
  isCurrent?: boolean;
  revenueBn?: number;
  forecastBn?: number;
  prevRevenueBn?: number;
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
// NEW: Employee options for filter/select
// =============================================================================

export type EmployeeOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  contract_count: number;
};

export type EmployeeOptionsResponse = {
  items: EmployeeOption[];
};

// =============================================================================
// NEW: Employee performance statistics
// =============================================================================

export type EmployeePerformanceItem = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  total_contracts: number;
  signed_contracts: number;
  pending_contracts: number;
  expiring_contracts: number;
  expired_contracts: number;
  total_revenue: number;
  avg_revenue_per_contract: number;
  last_contract_date: string | null;
};

export type EmployeePerformanceSummary = {
  total_employees: number;
  total_contracts: number;
  signed_contracts: number;
  pending_contracts: number;
  expiring_contracts: number;
  expired_contracts: number;
  total_revenue: number;
};

export type EmployeePerformanceResponse = {
  summary: EmployeePerformanceSummary;
  items: EmployeePerformanceItem[];
};

// =============================================================================
// NEW: Employee contracts detail
// =============================================================================

export type EmployeeContractItem = {
  contract_id: number;
  contract_no: string;
  legal_name: string | null;
  brand_name: string | null;
  domain: string | null;
  status: string;
  effective_date: string | null;
  expiry_date: string | null;
  total_amount: number | null;
  created_at: string | null;
};

export type EmployeeContractsResponse = {
  items: EmployeeContractItem[];
  total: number;
  page: number;
  page_size: number;
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
// NEW: Employee options for filter/select
// =============================================================================

/**
 * Get list of employees for filter/select.
 * GET /api/reports/employees/options
 *
 * Returns all employees from users table and contract assignees.
 */
export function getEmployeeOptions(
  token: string,
  params: { with_contracts_only?: boolean } = {}
): Promise<EmployeeOptionsResponse> {
  const qs = new URLSearchParams();
  if (params.with_contracts_only) qs.set("with_contracts_only", "true");
  const suffix = qs.toString();
  return apiRequest<EmployeeOptionsResponse>(
    `/reports/employees/options${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

// =============================================================================
// NEW: Employee performance statistics
// =============================================================================

export type EmployeePerformanceParams = {
  employee_id?: string;
  employee_email?: string;
  year?: number;
  date_from?: string;
  date_to?: string;
  domain?: string;
  status?: string;
};

/**
 * Get employee performance statistics.
 * GET /api/reports/employees/performance
 *
 * If no employee_id: returns summary for all employees.
 * If employee_id: returns detail for that employee.
 */
export function getEmployeePerformance(
  token: string,
  params: EmployeePerformanceParams = {}
): Promise<EmployeePerformanceResponse> {
  const qs = new URLSearchParams();
  if (params.employee_id) qs.set("employee_id", params.employee_id);
  if (params.employee_email) qs.set("employee_email", params.employee_email);
  if (params.year) qs.set("year", String(params.year));
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  if (params.domain) qs.set("domain", params.domain);
  if (params.status) qs.set("status", params.status);
  const suffix = qs.toString();
  return apiRequest<EmployeePerformanceResponse>(
    `/reports/employees/performance${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

// =============================================================================
// NEW: Employee contracts detail
// =============================================================================

export type EmployeeContractsParams = {
  year?: number;
  date_from?: string;
  date_to?: string;
  domain?: string;
  status?: string;
  page?: number;
  page_size?: number;
};

/**
 * Get contracts for a specific employee with pagination.
 * GET /api/reports/employees/{employee_id}/contracts
 */
export function getEmployeeContracts(
  token: string,
  employeeId: string,
  params: EmployeeContractsParams = {}
): Promise<EmployeeContractsResponse> {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  if (params.domain) qs.set("domain", params.domain);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const suffix = qs.toString();
  return apiRequest<EmployeeContractsResponse>(
    `/reports/employees/${encodeURIComponent(employeeId)}/contracts${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

// =============================================================================
// NEW: Pending contracts — contracts needing action
// =============================================================================

export type PendingContractItem = {
  id: number;
  contract_no: string;
  partner: string;
  brand: string | null;
  field: string | null;
  signed_date: string | null;
  renewal_status: string | null;
  value: number | null;
  nguoi_thuc_hien: string | null;
  days_pending: number;
  category: 'missing_finance' | 'awaiting_partner' | 'draft' | 'no_gcn';
};

export type PendingContractsResponse = {
  items: PendingContractItem[];
  total: number;
};

/**
 * Get pending contracts — contracts needing action (no value, pending renewal, etc.)
 * GET /api/reports/contracts/pending
 */
export function listPendingContracts(
  token: string,
  params: { page?: number; page_size?: number; year?: number; employee?: string; field?: string } = {}
): Promise<PendingContractsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.year) qs.set("year", String(params.year));
  if (params.employee) qs.set("employee", params.employee);
  if (params.field) qs.set("field", params.field);
  const suffix = qs.toString();
  return apiRequest<PendingContractsResponse>(
    `/reports/contracts/pending${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

// =============================================================================
// NEW: Signed contracts with filters
// =============================================================================

/**
 * Get signed contracts with optional filters.
 * GET /api/reports/contracts/signed
 */
export function listSignedContracts(
  token: string,
  params: {
    page?: number;
    page_size?: number;
    scope?: string;
    year?: number;
    employee?: string;
    field?: string;
  } = {}
): Promise<SignedContractsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.scope) qs.set("scope", params.scope);
  if (params.year) qs.set("year", String(params.year));
  if (params.employee) qs.set("employee", params.employee);
  if (params.field) qs.set("field", params.field);
  const suffix = qs.toString();
  return apiRequest<SignedContractsResponse>(
    `/reports/contracts/signed${suffix ? `?${suffix}` : ""}`,
    { token }
  );
}

export type SignedContractsResponse = {
  items: SignedContractItem[];
  total: number;
};

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
 * Generic export download using fetch with blob response.
 * The URL is relative to the API base (e.g. "/api/reports/contracts/export-xlsx").
 */
async function downloadExportFile(
  url: string,
  token: string,
  filename: string
): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
  // Strip any /api prefix from the url before prepending, to avoid double /api/api/
  const cleanPath = url.replace(/^\/?api\//, "");
  const fullUrl = `${apiBase}/${cleanPath}`;
  const response = await fetch(fullUrl, {
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

/**
 * Export signed contracts to Excel (.xlsx)
 * GET /api/reports/contracts/signed/export-xlsx
 */
export async function exportSignedContractsExcel(
  token: string,
  params: { scope?: string; year?: number; employee?: string; field?: string } = {}
): Promise<void> {
  const qs = new URLSearchParams();
  if (params.scope) qs.set("scope", params.scope);
  if (params.year) qs.set("year", String(params.year));
  if (params.employee) qs.set("employee", params.employee);
  if (params.field) qs.set("field", params.field);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const url = `/api/reports/contracts/signed/export-xlsx${suffix}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `hop_dong_da_ky_${today}.xlsx`);
}

/**
 * Export pending contracts to Excel (.xlsx)
 * GET /api/reports/contracts/pending/export-xlsx
 */
export async function exportPendingContractsExcel(
  token: string,
  params: { year?: number; employee?: string; field?: string } = {}
): Promise<void> {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.employee) qs.set("employee", params.employee);
  if (params.field) qs.set("field", params.field);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const url = `/api/reports/contracts/pending/export-xlsx${suffix}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `hop_dong_cho_xu_ly_${today}.xlsx`);
}

/**
 * Export full contract data to Excel (.xlsx)
 * GET /api/reports/full-data/export-xlsx
 * 
 * Columns: STT, Tên đơn vị, Địa chỉ, Bảng hiệu, Địa chỉ kinh doanh,
 *          Số điện thoại, Khu vực kinh doanh, Số tiền trước thuế
 */
export async function exportFullDataExcel(
  token: string,
  params: {
    year?: number;
    domain?: string;
    date_from?: string;
    date_to?: string;
  } = {}
): Promise<void> {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.domain) qs.set("domain", params.domain);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const url = `/api/reports/full_data/export-xlsx${suffix}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await downloadExportFile(url, token, `du_lieu_toan_bo_${today}.xlsx`);
}
