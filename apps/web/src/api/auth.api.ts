import type { AdminUser } from "@agromilk/shared";
import { request } from "./http";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<{ user: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  googleStatus: () => request<{ enabled: boolean }>("/auth/google/status"),
  me: () => request<{ user: AdminUser }>("/auth/me"),
  logout: () => request<{ success: true }>("/auth/logout", { method: "POST" }),
};
