import type { Paginated, ProductInput, ProductRecord } from "@agromilk/shared";
import { request } from "./http";

export const productsApi = {
  publicList: () => request<{ items: ProductRecord[] }>("/products"),
  publicGet: (slug: string) => request<ProductRecord>(`/products/${encodeURIComponent(slug)}`),
  list: (params: URLSearchParams) => request<Paginated<ProductRecord>>(`/admin/products?${params}`),
  get: (id: string) => request<ProductRecord>(`/admin/products/${id}`),
  create: (data: ProductInput) =>
    request<ProductRecord>("/admin/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ProductInput>) =>
    request<ProductRecord>(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<{ success: true }>(`/admin/products/${id}`, { method: "DELETE" }),
};
