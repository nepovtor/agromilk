import type { FastifyPluginAsync } from "fastify";
import { analyticsEventSchema } from "@landing/shared";
import { db } from "../db/index.js";
import { analyticsEvents } from "../db/schema.js";
import { and, eq, gte } from "drizzle-orm";
import { getClientIp, sendValidationError } from "../lib/http.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/events", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = analyticsEventSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    const duplicateSince = new Date(Date.now() - 30_000);
    const [duplicate] = await db.select({ id: analyticsEvents.id }).from(analyticsEvents).where(and(
      eq(analyticsEvents.visitorId, parsed.data.visitorId),
      eq(analyticsEvents.sessionId, parsed.data.sessionId),
      eq(analyticsEvents.eventType, parsed.data.eventType),
      eq(analyticsEvents.pagePath, parsed.data.pagePath),
      gte(analyticsEvents.createdAt, duplicateSince)
    )).limit(1);
    if (duplicate) return reply.code(200).send({ success: true, deduplicated: true });
    await db.insert(analyticsEvents).values({
      ...parsed.data,
      utmSource: parsed.data.utmSource || null,
      utmMedium: parsed.data.utmMedium || null,
      utmCampaign: parsed.data.utmCampaign || null,
      ipAddress: getClientIp(request.headers as Record<string, unknown>, request.ip),
      userAgent: request.headers["user-agent"]
    });
    return reply.code(201).send({ success: true });
  });
};
