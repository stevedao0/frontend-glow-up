import { apiRequest, apiBaseUrl } from "./apiClient";
import { getToken } from "./authClient";

// =============================================================================
// Authenticated file download (includes Bearer token)
// =============================================================================

export async function downloadFile(path: string): Promise<void> {
  const token = getToken();
  const url = getDownloadUrl(path);
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }
  const blob = await res.blob();
  // Extract filename from URL or path
  const urlObj = new URL(url, window.location.origin);
  const filename = urlObj.pathname.split("/").pop() || "download.docx";
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

// =============================================================================
// Types
// =============================================================================

export type EnvelopeLayoutConfig = {
  page_width_mm: number;
  page_height_mm: number;
  recipient_box_left_mm: number;
  recipient_box_bottom_mm: number;
  recipient_box_width_mm: number;
  recipient_box_height_mm: number;
  line_spacing_mm: number;
  printer_offset_x_mm: number;
  printer_offset_y_mm: number;
  non_printable_left_mm: number;
  non_printable_right_mm: number;
  non_printable_top_mm: number;
  non_printable_bottom_mm: number;
  resolved_left_mm: number;
  resolved_bottom_mm: number;
  resolved_top_mm: number;
  resolved_width_mm: number;
  resolved_height_mm: number;
  resolved_right_indent_mm: number;
};

export type DispatchItem = {
  id: number;
  batch_id: number;
  cong_van_no: string;
  issue_date: string;
  contract_no: string;
  recipient_unit: string;
  recipient_address: string;
  recipient_contact: string;
  recipient_phone: string;
  status: string;
  docx_path: string;
  download_url: string;
  batch_merged_download_url: string;
  batch_envelope_download_url: string;
  batch_envelope_calibration_download_url: string;
  batch_total_items: number;
  batch_envelope_total_items: number;
  batch_envelope_generated_at: string;
  note: string;
  contacted: boolean;
  contact_status: string;
  delivery_status: string;
  tracking_progress: string;
  latest_action: string;
};

export type DispatchDetail = DispatchItem & {
  expiry_date: string;
};

export type ExpiredContractItem = {
  contract_id: number;
  so_hop_dong: string;
  contract_no: string;
  contract_year: number;
  don_vi_ten: string;
  ngay_ky_hop_dong: string;
  ngay_het_hieu_luc_hd: string;
  days_expired: number;
  cong_van_count: number;
  recipient_address?: string;
  ten_bang_hieu?: string;
  latest_dispatch_no?: string;
  latest_dispatch_date?: string;
  latest_dispatch_status?: string;
};

export type PaginatedResponse<T> = {
  ok: boolean;
  rows: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type DispatchLog = {
  id: number;
  action_type: string;
  status_after: string;
  note: string;
  actor: string;
  created_at: string;
};

export type CreateRenewalResponse = {
  ok: boolean;
  rows: {
    id: number;
    batch_id: number;
    cong_van_no: string;
    contract_no: string;
    attempt_no: number;
    recipient_unit: string;
    download_url: string;
  }[];
  merged_download_url: string;
  envelope_download_url: string;
  total_created: number;
  batch_cong_van_no: string;
  batch_id: number;
  error?: string;
};

export type EnvelopeResponse = {
  ok: boolean;
  batch_id: number;
  envelope_download_url: string;
  envelope_total_items: number;
  envelope_generated_at: string;
  layout: EnvelopeLayoutConfig;
  error?: string;
};

export type EnvelopeCalibrationResponse = {
  ok: boolean;
  batch_id: number;
  calibration_download_url: string;
  envelope_total_items: number;
  envelope_calibration_generated_at: string;
  layout: EnvelopeLayoutConfig;
  error?: string;
};

// =============================================================================
// Batch types
// =============================================================================

export type BatchItem = {
  id: number;
  cong_van_no: string;
  contract_no: string;
  recipient_unit: string;
  recipient_address: string;
  attempt_no: number;
  dispatch_type: string;
  status: string;
  download_url: string;
  created_at: string;
  tracking_progress: string;
  latest_action: string;
  contact_status: string;
  delivery_status: string;
  contact_history: string;
};

export type BatchListItem = {
  id: number;
  cong_van_no: string;
  issue_date: string;
  dispatch_type: string;
  template_name: string;
  total_items: number;
  note: string;
  created_by: string;
  created_at: string;
  merged_download_url: string;
  envelope_download_url: string;
  envelope_generated_at: string;
  envelope_total_items: number;
};

export type BatchDetail = {
  id: number;
  cong_van_no: string;
  issue_date: string;
  dispatch_type: string;
  template_name: string;
  total_items: number;
  note: string;
  created_by: string;
  created_at: string;
  merged_download_url: string;
  envelope_download_url: string;
  items: BatchItem[];
};

export type UpdateStatusResponse = {
  ok: boolean;
  id: number;
  status: string;
  error?: string;
};

// =============================================================================
// API Functions
// =============================================================================

export async function getDispatches(params: {
  status?: string;
  year?: number;
  limit?: number;
}): Promise<DispatchItem[]> {
  const token = getToken();
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.year) query.set("year", String(params.year));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const data = await apiRequest<{ ok: boolean; rows: DispatchItem[] }>(
    `/dispatches${qs ? `?${qs}` : ""}`,
    { token }
  );
  return data.rows || [];
}

export async function getDispatch(id: number): Promise<DispatchDetail> {
  const token = getToken();
  const data = await apiRequest<{ ok: boolean; row: DispatchDetail }>(
    `/dispatches/${id}`,
    { token }
  );
  return data.row;
}

export async function deleteDispatch(id: number): Promise<void> {
  const token = getToken();
  await apiRequest(`/dispatches/${id}`, { method: "DELETE", token });
}

export async function getExpiredContracts(params: {
  filter_mode?: string;
  filter_year?: number;
  filter_quarter?: number;
  filter_month?: number;
  filter_week?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<ExpiredContractItem>> {
  const token = getToken();
  const query = new URLSearchParams();
  if (params.filter_mode) query.set("filter_mode", params.filter_mode);
  if (params.filter_year) query.set("filter_year", String(params.filter_year));
  if (params.filter_quarter) query.set("filter_quarter", String(params.filter_quarter));
  if (params.filter_month) query.set("filter_month", String(params.filter_month));
  if (params.filter_week) query.set("filter_week", String(params.filter_week));
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  const qs = query.toString();
  const data = await apiRequest<PaginatedResponse<ExpiredContractItem>>(
    `/dispatches/expired-contracts${qs ? `?${qs}` : ""}`,
    { token }
  );
  return data;
}

export async function getEnvelopeLayoutConfig(): Promise<EnvelopeLayoutConfig> {
  const token = getToken();
  const data = await apiRequest<{ ok: boolean; layout: EnvelopeLayoutConfig }>(
    "/dispatches/envelope-layout-config",
    { token }
  );
  return data.layout;
}

export async function saveEnvelopeLayoutConfig(layout: Partial<EnvelopeLayoutConfig>): Promise<EnvelopeLayoutConfig> {
  const token = getToken();
  const data = await apiRequest<{ ok: boolean; layout: EnvelopeLayoutConfig }>(
    "/dispatches/envelope-layout-config",
    { method: "PUT", token, body: { layout } }
  );
  return data.layout;
}

export async function createRenewalBatch(params: {
  contract_ids: number[];
  issue_date?: string;
  start_cong_van_no?: string;
  merge_output?: boolean;
  create_envelope?: boolean;
  note?: string;
}): Promise<CreateRenewalResponse> {
  const token = getToken();
  const data = await apiRequest<CreateRenewalResponse>(
    "/dispatches/create-renewal",
    { method: "POST", token, body: params }
  );
  return data;
}

export async function generateBatchEnvelope(
  batchId: number,
  options: { force_regenerate?: boolean } = {}
): Promise<EnvelopeResponse> {
  const token = getToken();
  const data = await apiRequest<EnvelopeResponse>(
    `/dispatches/batches/${batchId}/envelope`,
    { method: "POST", token, body: { force_regenerate: options.force_regenerate ?? true } }
  );
  return data;
}

export async function generateBatchEnvelopeCalibration(
  batchId: number,
  options: { force_regenerate?: boolean } = {}
): Promise<EnvelopeCalibrationResponse> {
  const token = getToken();
  const data = await apiRequest<EnvelopeCalibrationResponse>(
    `/dispatches/batches/${batchId}/envelope-calibration`,
    { method: "POST", token, body: { force_regenerate: options.force_regenerate ?? true } }
  );
  return data;
}

export async function getDispatchLogs(dispatchId: number): Promise<DispatchLog[]> {
  const token = getToken();
  const data = await apiRequest<{ ok: boolean; rows: DispatchLog[] }>(
    `/dispatches/${dispatchId}/logs`,
    { token }
  );
  return data.rows || [];
}

export async function addDispatchLog(
  dispatchId: number,
  params: { action_type?: string; status_after?: string; note?: string }
): Promise<void> {
  const token = getToken();
  await apiRequest(`/dispatches/${dispatchId}/logs`, {
    method: "POST",
    token,
    body: params,
  });
}

export async function getBatches(params: {
  year?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<BatchListItem>> {
  const token = getToken();
  const query = new URLSearchParams();
  if (params.year) query.set("year", String(params.year));
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  const qs = query.toString();
  const data = await apiRequest<PaginatedResponse<BatchListItem>>(
    `/dispatches/batches${qs ? `?${qs}` : ""}`,
    { token }
  );
  return data;
}

export async function getBatchDetail(batchId: number): Promise<BatchDetail> {
  const token = getToken();
  const data = await apiRequest<{ ok: boolean; batch: BatchDetail; items: BatchItem[] }>(
    `/dispatches/batches/${batchId}`,
    { token }
  );
  return { ...data.batch, items: data.items };
}

export async function updateDispatchStatus(
  itemId: number,
  status: string
): Promise<UpdateStatusResponse> {
  const token = getToken();
  const data = await apiRequest<UpdateStatusResponse>(
    `/dispatches/items/${itemId}/status`,
    { method: "PATCH", token, body: { status } }
  );
  return data;
}

export function getDownloadUrl(path: string): string {
  if (!path) return "";
  // If path already starts with /api, it's already a full path from backend
  if (path.startsWith("/api")) return path;
  // Otherwise prepend base URL
  return `${apiBaseUrl}${path}`;
}
