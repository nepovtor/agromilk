import type { AnalyticsEventInput } from "@agromilk/shared";
import { AnalyticsRepository } from "./analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly repository = new AnalyticsRepository()) {}

  async create(data: AnalyticsEventInput, metadata: { ipAddress: string; userAgent?: string }) {
    const created = await this.repository.create({ ...data, ...metadata });
    return { success: true as const, deduplicated: !created };
  }
}
