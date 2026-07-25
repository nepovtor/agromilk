import type { AnalyticsEventInput } from "@agromilk/shared";

export type CreateAnalyticsEvent = AnalyticsEventInput & {
  ipAddress: string;
  userAgent?: string;
};
