import type { StatisticsPoint, StatisticsSummary } from "@agromilk/shared";
import { request } from "./http";

export const statisticsApi = {
  summary: (from: string, to: string) =>
    request<StatisticsSummary>(`/admin/statistics/summary?from=${from}&to=${to}`),
  timeline: (from: string, to: string) =>
    request<{ items: StatisticsPoint[] }>(`/admin/statistics/timeline?from=${from}&to=${to}`),
};
