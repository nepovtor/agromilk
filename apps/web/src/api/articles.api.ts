import type { ArticleInput, ArticleRecord, Paginated } from "@landing/shared";
import { request } from "./http";

export const articlesApi = {
  publicList: (page = 1, pageSize = 12) =>
    request<Paginated<ArticleRecord>>(`/articles?page=${page}&pageSize=${pageSize}`),
  publicGet: (slug: string) => request<ArticleRecord>(`/articles/${encodeURIComponent(slug)}`),
  list: (params: URLSearchParams) => request<Paginated<ArticleRecord>>(`/admin/articles?${params}`),
  get: (id: string) => request<ArticleRecord>(`/admin/articles/${id}`),
  create: (data: ArticleInput) =>
    request<ArticleRecord>("/admin/articles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ArticleInput>) =>
    request<ArticleRecord>(`/admin/articles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<{ success: true }>(`/admin/articles/${id}`, { method: "DELETE" }),
};
