import { apiRequest } from "./apiClient";

export type ApiCertificateStatus = "draft" | "test_printed" | "final_printed" | string;

export type ApiCertificateRecord = {
  id: number;
  certificate_id: number;
  contract_id: number;
  certificate_no: string | null;
  certificate_issue_date: string | null;
  status: ApiCertificateStatus;
  domain_group: string;
  field_code: string;
  organization_name: string | null;
  business_registration_no: string | null;
  address: string | null;
  business_sign_name: string | null;
  business_location: string | null;
  contract_no: string | null;
  effective_from: string | null;
  effective_to: string | null;
  gcn_scope_col_1_text: string | null;
  gcn_scope_col_2_text: string | null;
  gcn_scope_col_3_text: string | null;
  offset_x_mm: number;
  offset_y_mm: number;
  printed_at: string | null;
  printed_by: string | null;
  print_count: number;
  created_at: string | null;
  updated_at: string | null;
  has_qr_image: boolean;
  qr_image_data?: string | null;
  contract_visible: boolean;
};

export type CertificatesSummary = {
  total: number;
  draft: number;
  test_printed: number;
  final_printed: number;
  missing_number: number;
  printed_multiple: number;
};

export type CertificatesListResponse = {
  items: ApiCertificateRecord[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  summary: CertificatesSummary;
  write_performed: boolean;
  print_enabled: boolean;
  qr_generation_enabled: boolean;
};

export type CertificateDetailResponse = {
  certificate: ApiCertificateRecord;
  write_performed: boolean;
  print_enabled: boolean;
  qr_generation_enabled: boolean;
};

export type CertificatePreviewContext = {
  mode: "existing_certificate" | "contract_preview" | string;
  certificate_id?: number | null;
  contract_id?: number | null;
  certificate_no?: string | null;
  certificate_issue_date?: string | null;
  certificate_issue_day?: string | null;
  certificate_issue_month?: string | null;
  certificate_issue_year?: string | null;
  contract_no: string;
  organization_name: string;
  business_registration_no: string;
  address: string;
  business_sign_name: string;
  business_location: string;
  gcn_scope_col_1_text: string;
  gcn_scope_col_2_text: string;
  gcn_scope_col_3_text: string;
  effective_from?: string | null;
  effective_to?: string | null;
  offset_x_mm: number;
  offset_y_mm: number;
  qr_image_data?: string | null;
  status: string;
  warnings: string[];
};

export type CertificateContextDryRunResponse = {
  ok: boolean;
  mode: "context_dry_run" | string;
  context: CertificatePreviewContext;
  locked_layout: Record<string, unknown>;
  write_performed: boolean;
  print_enabled: boolean;
  qr_generation_enabled: boolean;
  artifacts_generated: boolean;
};

export type CertificatesQuery = {
  page?: number;
  page_size?: number;
  q?: string;
  status?: string;
  year?: string;
  contract_no?: string;
};

export function listCertificates(token: string, query: CertificatesQuery): Promise<CertificatesListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.year) params.set("year", query.year);
  if (query.contract_no) params.set("contract_no", query.contract_no);
  const suffix = params.toString();
  return apiRequest<CertificatesListResponse>(`/certificates${suffix ? `?${suffix}` : ""}`, { token });
}

export function getCertificate(token: string, id: number): Promise<CertificateDetailResponse> {
  return apiRequest<CertificateDetailResponse>(`/certificates/${id}`, { token });
}

export function getCertificateContextDryRun(token: string, id: number): Promise<CertificateContextDryRunResponse> {
  return apiRequest<CertificateContextDryRunResponse>(`/certificates/${id}/context-dry-run`, { token });
}

export function getContractCertificateContextDryRun(token: string, id: number): Promise<CertificateContextDryRunResponse> {
  return apiRequest<CertificateContextDryRunResponse>(`/contracts/${id}/certificate-context-dry-run`, { token });
}

export type CertificateUpdatePayload = {
  certificate_no?: string | null;
  certificate_issue_date?: string | null;
  status?: string | null;
  organization_name?: string | null;
  business_registration_no?: string | null;
  address?: string | null;
  business_sign_name?: string | null;
  business_location?: string | null;
  contract_no?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  gcn_scope_col_1_text?: string | null;
  gcn_scope_col_2_text?: string | null;
  gcn_scope_col_3_text?: string | null;
  qr_image_data?: string | null;
  offset_x_mm?: number | null;
  offset_y_mm?: number | null;
};

export type CertificateUpdateResponse = {
  ok: boolean;
  mode: string;
  message: string;
  update_enabled: boolean;
  clone_only_enabled: boolean;
  write_performed: boolean;
  certificate_id: number | null;
  updated_fields: string[];
  errors: string[];
  warnings: string[];
};

export type CertificateSyncResponse = {
  ok: boolean;
  mode: string;
  message: string;
  sync_enabled: boolean;
  write_performed: boolean;
  certificate_id: number | null;
  synced_fields: string[];
  errors: string[];
};

export type CertificatePrintResponse = {
  ok: boolean;
  mode: string;
  message: string;
  print_enabled: boolean;
  write_performed: boolean;
  certificate_id: number | null;
  print_type: string;
  status_after: string;
  print_count: number;
  printed_at: string | null;
  printed_by: string | null;
};

export function updateCertificate(token: string, id: number, payload: CertificateUpdatePayload): Promise<CertificateUpdateResponse> {
  return apiRequest<CertificateUpdateResponse>(`/certificates/${id}`, {
    token,
    method: 'PATCH',
    body: payload,
  });
}

export function syncCertificate(token: string, id: number): Promise<CertificateSyncResponse> {
  return apiRequest<CertificateSyncResponse>(`/certificates/${id}/sync`, {
    token,
    method: 'POST',
  });
}

export function printCertificate(token: string, id: number, mode: 'test' | 'final' = 'test'): Promise<CertificatePrintResponse> {
  return apiRequest<CertificatePrintResponse>(`/certificates/${id}/print`, {
    token,
    method: 'POST',
    body: { mode },
  });
}
