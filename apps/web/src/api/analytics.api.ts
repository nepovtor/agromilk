import { request } from "./http";

export const analyticsApi = {
  pageView: (data: unknown) =>
    request<{ success: true }>("/analytics/events", {
      method: "POST",
      body: JSON.stringify(data),
      keepalive: true,
    }),
};
