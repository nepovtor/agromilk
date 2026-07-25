import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../../lib/auth.js";
import { parseOrThrow } from "../../lib/http.js";
import { statisticsRangeQuerySchema } from "./statistics.schemas.js";
import { StatisticsService } from "./statistics.service.js";

const statisticsService = new StatisticsService();

export const statisticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/summary", async (request) => {
    const query = parseOrThrow(statisticsRangeQuerySchema, request.query);
    return statisticsService.summary(query);
  });

  app.get("/timeline", async (request) => {
    const query = parseOrThrow(statisticsRangeQuerySchema, request.query);
    return statisticsService.timeline(query);
  });
};
