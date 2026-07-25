import { z } from "zod";
import { dateSchema } from "./common.js";

export const statisticsRangeQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const analyticsEventSchema = z.object({
  eventId: z.string().uuid(),
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view"]),
  pagePath: z.string().max(500),
  referrer: z.string().max(1000).optional().default(""),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});
