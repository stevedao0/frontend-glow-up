import { shouldUseDemoFetch, demoFetch } from "./demoMode";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || "GET";

  // Demo mode short-circuits real network calls so the frontend can be
  // previewed without a backend. Mocks for the main endpoints live in demoMode.ts.
  if (shouldUseDemoFetch(options.token)) {
    return demoFetch(path, method, options.body) as Promise<T>;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
    signal: options.signal ?? undefined,
  });


  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // ignore parse errors for non-json responses
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const apiBaseUrl = API_BASE_URL;
