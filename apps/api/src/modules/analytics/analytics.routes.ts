import type { FastifyPluginAsync } from "fastify";
import { parseOrThrow } from "../../lib/http.js";
import { analyticsEventSchema } from "./analytics.schemas.js";
import { AnalyticsService } from "./analytics.service.js";

const analyticsService = new AnalyticsService();

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/events",
    { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const data = parseOrThrow(analyticsEventSchema, request.body);
      const result = await analyticsService.create(data, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
      });
      return reply.code(result.deduplicated ? 200 : 201).send(result);
    },
  );
};
