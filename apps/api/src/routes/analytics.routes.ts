import type { FastifyPluginAsync } from "fastify";
import { analyticsEventSchema } from "@agromilk/shared";
import { db } from "../db/index.js";
import { analyticsEvents } from "../db/schema.js";
import { and, eq, gte } from "drizzle-orm";
import { getClientIp, parseOrThrow } from "../lib/http.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/events",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const data = parseOrThrow(analyticsEventSchema, request.body);
      const duplicateSince = new Date(Date.now() - 30_000);
      const [duplicate] = await db
        .select({ id: analyticsEvents.id })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.visitorId, data.visitorId),
            eq(analyticsEvents.sessionId, data.sessionId),
            eq(analyticsEvents.eventType, data.eventType),
            eq(analyticsEvents.pagePath, data.pagePath),
            gte(analyticsEvents.createdAt, duplicateSince),
          ),
        )
        .limit(1);
      if (duplicate) return reply.code(200).send({ success: true, deduplicated: true });
      await db.insert(analyticsEvents).values({
        ...data,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        ipAddress: getClientIp(request.headers, request.ip),
        userAgent: request.headers["user-agent"],
      });
      return reply.code(201).send({ success: true });
    },
  );
};
