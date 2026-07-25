import type {
  ApplicationRecord,
  ApplicationStatus,
  Paginated,
  UpdateApplicationInput,
} from "@agromilk/shared";
import { request, requestBlob } from "./http";

export const applicationsApi = {
  create: (data: unknown) =>
    request<{ success: true; id: string; deduplicated?: boolean }>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (params: URLSearchParams) =>
    request<Paginated<ApplicationRecord>>(`/admin/applications?${params}`),
  exportCsv: (params: URLSearchParams) => requestBlob(`/admin/applications/export.csv?${params}`),
  get: (id: string, signal?: AbortSignal) =>
    request<ApplicationRecord>(`/admin/applications/${id}`, { signal }),
  update: (id: string, data: UpdateApplicationInput) =>
    request<ApplicationRecord>(`/admin/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  bulkUpdate: (ids: string[], status: ApplicationStatus) =>
    request<{ success: true; updated: number }>("/admin/applications/bulk", {
      method: "PATCH",
      body: JSON.stringify({ ids, status }),
    }),
  remove: (id: string) =>
    request<{ success: true }>(`/admin/applications/${id}`, { method: "DELETE" }),
};
