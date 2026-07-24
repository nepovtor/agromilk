import { request } from "./http";

export const mediaApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ id: string; url: string }>("/admin/media", { method: "POST", body: form });
  },
};
