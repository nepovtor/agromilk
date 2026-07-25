import { db } from "../../db/index.js";
import { analyticsEvents } from "../../db/schema.js";
import type { CreateAnalyticsEvent } from "./analytics.types.js";

export class AnalyticsRepository {
  async create(data: CreateAnalyticsEvent) {
    const [created] = await db
      .insert(analyticsEvents)
      .values({
        ...data,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      })
      .onConflictDoNothing({ target: analyticsEvents.eventId })
      .returning({ id: analyticsEvents.id });
    return Boolean(created);
  }
}
