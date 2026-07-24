import type { AdminUser, ApplicationRecord, ApplicationStatus, ArticleInput, ArticleRecord, Paginated, ProductInput, ProductRecord, StatisticsPoint, StatisticsSummary, UpdateApplicationInput } from "@landing/shared";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers: isForm || !hasBody
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers }
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("admin-session-expired"));
    throw new ApiError(response.status, (payload as { message?: string } | null)?.message || "Ошибка запроса", payload);
  }
  return payload as T;
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => request<{ user: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    googleStatus: () => request<{ enabled: boolean }>("/auth/google/status"),
    me: () => request<{ user: AdminUser }>("/auth/me"),
    logout: () => request<{ success: true }>("/auth/logout", { method: "POST" })
  },
  applications: {
    create: (data: unknown) => request<{ success: true; id: string }>("/applications", { method: "POST", body: JSON.stringify(data) }),
    list: (params: URLSearchParams) => request<Paginated<ApplicationRecord>>(`/admin/applications?${params}`),
    get: (id: string) => request<ApplicationRecord>(`/admin/applications/${id}`),
    update: (id: string, data: UpdateApplicationInput) => request<ApplicationRecord>(`/admin/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    bulkUpdate: (ids: string[], status: ApplicationStatus) => request<{ success: true; updated: number }>("/admin/applications/bulk", { method: "PATCH", body: JSON.stringify({ ids, status }) }),
    remove: (id: string) => request<{ success: true }>(`/admin/applications/${id}`, { method: "DELETE" })
  },
  articles: {
    publicList: (page = 1, pageSize = 12) =>
      request<Paginated<ArticleRecord>>(
        `/articles?page=${page}&pageSize=${pageSize}`,
      ),
    publicGet: (slug: string) => request<ArticleRecord>(`/articles/${encodeURIComponent(slug)}`),
    list: (params: URLSearchParams) => request<Paginated<ArticleRecord>>(`/admin/articles?${params}`),
    get: (id: string) => request<ArticleRecord>(`/admin/articles/${id}`),
    create: (data: ArticleInput) => request<ArticleRecord>("/admin/articles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ArticleInput>) => request<ArticleRecord>(`/admin/articles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: true }>(`/admin/articles/${id}`, { method: "DELETE" })
  },
  products: {
    publicList: () => request<{ items: ProductRecord[] }>("/products"),
    publicGet: (slug: string) => request<ProductRecord>(`/products/${encodeURIComponent(slug)}`),
    list: (params: URLSearchParams) => request<Paginated<ProductRecord>>(`/admin/products?${params}`),
    get: (id: string) => request<ProductRecord>(`/admin/products/${id}`),
    create: (data: ProductInput) => request<ProductRecord>("/admin/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ProductInput>) => request<ProductRecord>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ success: true }>(`/admin/products/${id}`, { method: "DELETE" })
  },
  media: {
    upload: (file: File) => {
      const form = new FormData(); form.append("file", file);
      return request<{ id: string; url: string }>("/admin/media", { method: "POST", body: form });
    }
  },
  assistant: {
    rewrite: (text: string, action: "polish" | "shorten" | "list" | "lead" | "format") =>
      request<{ text: string; model: string }>("/admin/assistant/rewrite", { method: "POST", body: JSON.stringify({ text, action }) })
  },
  statistics: {
    summary: (from: string, to: string) => request<StatisticsSummary>(`/admin/statistics/summary?from=${from}&to=${to}`),
    timeline: (from: string, to: string) => request<{ items: StatisticsPoint[] }>(`/admin/statistics/timeline?from=${from}&to=${to}`)
  },
  analytics: {
    pageView: (data: unknown) => request<{ success: true }>("/analytics/events", { method: "POST", body: JSON.stringify(data), keepalive: true })
  }
};
