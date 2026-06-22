/**
 * Demo Mode — lets the frontend run without a real backend.
 *
 * Activation:
 *   • URL contains ?demo=1
 *   • localStorage flag "vcpmc_demo_mode" === "1"
 *   • Bearer token equals DEMO_TOKEN
 *
 * When active, apiRequest() short-circuits network calls and returns
 * deterministic mock data so Dashboard, Contracts, Print GCN and Users
 * remain navigable. The normal login flow is untouched.
 */

export const DEMO_TOKEN = "demo-mode-token";
export const DEMO_FLAG_KEY = "vcpmc_demo_mode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(DEMO_FLAG_KEY) === "1") return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") return true;
  } catch {
    // ignore
  }
  return false;
}

export function enableDemoMode(): void {
  try {
    window.localStorage.setItem(DEMO_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

export function disableDemoMode(): void {
  try {
    window.localStorage.removeItem(DEMO_FLAG_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Demo identity
// ---------------------------------------------------------------------------

export const DEMO_ME = {
  user: {
    id: 9001,
    username: "demo",
    email: "demo@vcpmc.local",
    display_name: "Demo User",
    role: "admin",
    is_active: true,
  },
  permissions: [
    "contracts.view",
    "contracts.create",
    "contracts.edit",
    "contracts.delete",
    "certificates.view",
    "certificates.print_test",
    "certificates.print_final",
    "users.view",
    "users.manage",
    "reports.view",
    "dispatch.view",
  ],
  domains: [],
  active_domain_id: null,
  active_workspace_group_code: null,
};

const DEMO_LOGIN_RESPONSE = {
  access_token: DEMO_TOKEN,
  token_type: "bearer",
  user: DEMO_ME.user,
};

// ---------------------------------------------------------------------------
// Mock data builders
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

const REPORTS_SUMMARY = {
  total_contracts: 1284,
  active_count: 1097,
  expiring_30d_count: 38,
  expired_count: 149,
  pending_renewal_count: 22,
  gcn_draft: 47,
  gcn_test_printed: 19,
  gcn_final_printed: 1031,
  total_works: 412800,
  revenue_2026: 4812330000,
  revenue_2025: 4156870000,
  revenue_by_year: [
    { year: CURRENT_YEAR - 2, total_revenue: 3742150000, contract_count: 980 },
    { year: CURRENT_YEAR - 1, total_revenue: 4156870000, contract_count: 1102 },
    { year: CURRENT_YEAR,     total_revenue: 4812330000, contract_count: 1284 },
  ],
  status_breakdown: [
    { key: "active",   name: "Còn hiệu lực",   value: 1097, tone: "emerald" },
    { key: "expiring", name: "Sắp hết hạn",    value: 38,   tone: "amber" },
    { key: "expired",  name: "Đã hết hạn",     value: 149,  tone: "rose" },
  ],
  recent_activities: [
    { id: "a1", actor: "Demo User", action: "cấp GCN cho", target: "HĐ-2026-0118 · Trần Cafe", time: "10 phút trước", kind: "certificate" },
    { id: "a2", actor: "Demo User", action: "tạo hợp đồng",  target: "HĐ-2026-0119 · Karaoke Vega", time: "32 phút trước", kind: "contract" },
    { id: "a3", actor: "Demo User", action: "in thử GCN",   target: "GCN-2026-0091",            time: "1 giờ trước",   kind: "certificate" },
    { id: "a4", actor: "Demo User", action: "gia hạn",      target: "HĐ-2024-0773",             time: "2 giờ trước",   kind: "contract" },
  ],
};

function makeDemoContract(i: number) {
  const year = i % 5 === 0 ? CURRENT_YEAR - 1 : CURRENT_YEAR;
  const no = `HĐ-${year}-${String(1000 + i).padStart(4, "0")}`;
  const start = new Date(year, (i * 7) % 12, 1 + (i % 27));
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  const royalty = 1_500_000 + ((i * 73_000) % 12_000_000);
  const vat = Math.round(royalty * 0.05);
  const fields = ["karaoke", "kvc", "background"];
  const statuses = ["active", "active", "active", "expiring", "expired"];
  const gcn = ["final_printed", "final_printed", "test_printed", "draft", "no_gcn"];
  return {
    id: i,
    contract_no: no,
    customer_name: [
      "Karaoke Vega", "Café Trần Quốc", "Khách sạn Thiên Hà", "Beer Club Phố Cũ",
      "Nhà hàng Hương Sen", "Spa Lotus", "Resort Hạ Long Pearl", "Bar 88",
    ][i % 8],
    domain: fields[i % fields.length],
    status: statuses[i % statuses.length],
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    created_at: start.toISOString(),
    contract_year: year,
    field_code: fields[i % fields.length],
    region_code: ["HN", "HCM", "DN", "HP"][i % 4],
    ten_bang_hieu: null,
    dia_chi_su_dung: ["12 Lê Lợi, Q1, HCM", "88 Bà Triệu, HN", "5 Trần Phú, ĐN"][i % 3],
    so_tien_value: royalty + vat,
    renewal_status: i % 7 === 0 ? "pending" : null,
    is_renewable: true,
    loai_hinh_karaoke: null,
    tong_so_phong: 0,
    tong_so_box: 0,
    royalty_amount_before_vat: royalty,
    vat_rate: 5,
    vat_amount: vat,
    royalty_amount_after_vat: royalty + vat,
    music_usage_areas: [],
    gcn_status: gcn[i % gcn.length],
    gcn_certificate_no: gcn[i % gcn.length] === "no_gcn" ? null : `GCN-${year}-${String(900 + i).padStart(4, "0")}`,
    gcn_certificate_id: gcn[i % gcn.length] === "no_gcn" ? null : 10000 + i,
  };
}

function buildContractsList(query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page") || "1"));
  const pageSize = Math.max(1, Number(query.get("page_size") || "20"));
  const total = 142;
  const items = Array.from({ length: total }, (_, i) => makeDemoContract(i + 1));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    page_size: pageSize,
    total,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function makeDemoCertificate(i: number) {
  const issued = new Date(CURRENT_YEAR, (i * 5) % 12, 1 + (i % 27));
  const effFrom = new Date(issued); effFrom.setDate(effFrom.getDate() + 3);
  const effTo = new Date(effFrom); effTo.setFullYear(effTo.getFullYear() + 1);
  const statuses: Array<"draft" | "test_printed" | "final_printed"> = ["final_printed", "final_printed", "test_printed", "draft"];
  return {
    id: 10000 + i,
    certificate_id: 10000 + i,
    contract_id: i,
    certificate_no: `GCN-${CURRENT_YEAR}-${String(900 + i).padStart(4, "0")}`,
    certificate_issue_date: issued.toISOString().slice(0, 10),
    status: statuses[i % statuses.length],
    domain_group: "background",
    field_code: ["karaoke", "kvc", "background"][i % 3],
    organization_name: ["Karaoke Vega", "Café Trần Quốc", "Beer Club 88"][i % 3],
    business_registration_no: `0${100000000 + i}`,
    address: "12 Lê Lợi, Q1, TP.HCM",
    business_sign_name: "VEGA",
    business_location: "Tầng 2, 12 Lê Lợi, Q1, TP.HCM",
    contract_no: `HĐ-${CURRENT_YEAR}-${String(1000 + i).padStart(4, "0")}`,
    effective_from: effFrom.toISOString().slice(0, 10),
    effective_to: effTo.toISOString().slice(0, 10),
    gcn_scope_col_1_text: "Sử dụng nhạc nền",
    gcn_scope_col_2_text: "Quán cà phê — diện tích 80 m²",
    gcn_scope_col_3_text: "Áp dụng cho phạm vi đăng ký",
    offset_x_mm: 0,
    offset_y_mm: 0,
    printed_at: null,
    printed_by: null,
    print_count: i % 3,
    last_printed_at: null,
    last_print_file: null,
    last_print_reason: null,
    created_at: issued.toISOString(),
    updated_at: issued.toISOString(),
    has_qr_image: true,
    qr_image_data: null,
    contract_visible: true,
  };
}

function buildCertificatesList(query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page") || "1"));
  const pageSize = Math.max(1, Number(query.get("page_size") || "20"));
  const total = 97;
  const items = Array.from({ length: total }, (_, i) => makeDemoCertificate(i + 1));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    page_size: pageSize,
    total,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
    summary: {
      total,
      draft: 12,
      numbered: 85,
      official_printed: 73,
      final_printed: 73,
      missing_number: 4,
      printed_multiple: 6,
    },
    write_performed: false,
    print_enabled: true,
    qr_generation_enabled: true,
  };
}

const DEMO_USERS = [
  { id: 9001, username: "demo",     display_name: "Demo User",     email: "demo@vcpmc.local", role: "admin", is_active: true,  last_seen_at: new Date().toISOString(), created_at: "2025-01-12T08:30:00Z", domains: ["__all__"] },
  { id: 9002, username: "kha.tran", display_name: "Trần Khanh",    email: "kha.tran@vcpmc.org", role: "mod",  is_active: true,  last_seen_at: new Date(Date.now() - 36e5).toISOString(),  created_at: "2024-09-04T08:30:00Z", domains: ["background", "karaoke"] },
  { id: 9003, username: "linh.ng",  display_name: "Nguyễn Linh",   email: "linh.ng@vcpmc.org",  role: "user", is_active: true,  last_seen_at: new Date(Date.now() - 7200_000).toISOString(), created_at: "2025-02-14T08:30:00Z", domains: ["background"] },
  { id: 9004, username: "hung.le",  display_name: "Lê Quốc Hùng",  email: "hung.le@vcpmc.org",  role: "user", is_active: false, last_seen_at: null, created_at: "2024-11-22T08:30:00Z", domains: ["kvc"] },
  { id: 9005, username: "mai.do",   display_name: "Đỗ Mai",        email: "mai.do@vcpmc.org",   role: "mod",  is_active: true,  last_seen_at: new Date(Date.now() - 86400_000).toISOString(), created_at: "2024-07-09T08:30:00Z", domains: ["karaoke"] },
];

// ---------------------------------------------------------------------------
// Path dispatcher
// ---------------------------------------------------------------------------

type DemoHandler = (params: { method: string; body: unknown; query: URLSearchParams; match: RegExpMatchArray }) => unknown;

const ROUTES: Array<{ method: string | "*"; pattern: RegExp; handler: DemoHandler }> = [
  { method: "POST", pattern: /^\/auth\/login$/,    handler: () => DEMO_LOGIN_RESPONSE },
  { method: "POST", pattern: /^\/dev\/auth-token$/, handler: () => DEMO_LOGIN_RESPONSE },
  { method: "GET",  pattern: /^\/me$/,              handler: () => DEMO_ME },
  { method: "GET",  pattern: /^\/reports\/summary$/, handler: () => REPORTS_SUMMARY },
  { method: "GET",  pattern: /^\/contracts(\?|$)/,   handler: ({ query }) => buildContractsList(query) },
  { method: "GET",  pattern: /^\/contracts\/(\d+)$/, handler: ({ match }) => {
      const id = Number(match[1]);
      const c = makeDemoContract(id || 1);
      return {
        id: c.id,
        contract_no: c.contract_no,
        contract_year: c.contract_year,
        customer: {
          name: c.customer_name,
          signage: c.ten_bang_hieu,
          address: c.dia_chi_su_dung,
          legal_address: c.dia_chi_su_dung,
          usage_address: c.dia_chi_su_dung,
          phone: "0909 000 000",
          email: "lienhe@khachhang.vn",
          representative: "Nguyễn Văn A",
          position: "Giám đốc",
          mst: "0312345678",
        },
        domain: { display: c.domain, field_code: c.field_code, domain_group: "background" },
        dates: { signed_date: c.start_date, start_date: c.start_date, end_date: c.end_date },
        financial: {
          amount: c.royalty_amount_after_vat,
          total_amount: c.royalty_amount_after_vat,
          currency: "VND",
          amount_before_gtgt: c.royalty_amount_before_vat,
          gtgt_percent: c.vat_rate,
          gtgt_amount: c.vat_amount,
        },
        karaoke: { type: null, room_count: 0, box_count: 0 },
        status: c.status,
        raw: {},
        music_usage_areas: [],
        royalty_amount_before_vat: c.royalty_amount_before_vat,
        vat_rate: c.vat_rate,
        vat_amount: c.vat_amount,
        royalty_amount_after_vat: c.royalty_amount_after_vat,
        royalty_amount_in_words: "Demo data — không có số liệu thực",
      };
    } },
  { method: "GET",  pattern: /^\/certificates(\?|$)/, handler: ({ query }) => buildCertificatesList(query) },
  { method: "GET",  pattern: /^\/certificates\/(\d+)$/, handler: ({ match }) => ({
      certificate: makeDemoCertificate(Number(match[1]) - 10000 || 1),
      print_logs: [],
      write_performed: false,
      print_enabled: true,
      qr_generation_enabled: true,
    }) },
  { method: "GET",  pattern: /^\/users$/,         handler: () => DEMO_USERS },
  { method: "GET",  pattern: /^\/roles\/permissions$/, handler: () => ({
      admin: DEMO_ME.permissions,
      mod: DEMO_ME.permissions.filter((p) => !p.startsWith("users.")),
      user: ["contracts.view", "certificates.view", "reports.view"],
    }) },
  { method: "GET",  pattern: /^\/audit/, handler: () => [] },
  { method: "GET",  pattern: /^\/reports\/employees/, handler: () => ({ items: [], total: 0 }) },
];

function isListPath(path: string): boolean {
  return /\/(items|list|contracts|certificates|users|dispatches|audit|reports)(\?|$|\/)/.test(path);
}

export async function demoFetch(path: string, method: string, body: unknown): Promise<any> {
  const url = path.startsWith("/") ? path : `/${path}`;
  const [pathname, search = ""] = url.split("?");
  const query = new URLSearchParams(search);

  for (const route of ROUTES) {
    if (route.method !== "*" && route.method !== method.toUpperCase()) continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const result = route.handler({ method, body, query, match });
      return Promise.resolve(result);
    }
  }

  // Permissive fallback so unknown endpoints don't crash the UI.
  if (method.toUpperCase() === "GET") {
    if (isListPath(pathname)) {
      return Promise.resolve({ items: [], page: 1, page_size: 20, total: 0, total_pages: 1 });
    }
    return Promise.resolve({});
  }
  return Promise.resolve({ ok: true, demo: true, message: "Demo mode: write operations are disabled." });
}
