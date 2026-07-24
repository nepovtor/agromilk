import type {
  ApplicationRecord,
  ApplicationStatus,
  Paginated,
  UpdateApplicationInput,
} from "@landing/shared";
import { request } from "./http";

export const applicationsApi = {
  create: (data: unknown) =>
    request<{ success: true; id: string }>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (params: URLSearchParams) =>
    request<Paginated<ApplicationRecord>>(`/admin/applications?${params}`),
  get: (id: string) => request<ApplicationRecord>(`/admin/applications/${id}`),
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
