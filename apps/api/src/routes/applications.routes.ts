import type { FastifyPluginAsync } from "fastify";
import {
  applicationListQuerySchema,
  bulkUpdateApplicationsSchema,
  createApplicationSchema,
  idParamsSchema,
  updateApplicationSchema,
} from "@agromilk/shared";
import { requireAdmin } from "../lib/auth.js";
import { getClientIp, parseOrThrow } from "../lib/http.js";
import { applicationNotificationPublisher } from "../modules/applications/application-notification.publisher.js";
import { ApplicationRepository } from "../modules/applications/application.repository.js";
import { ApplicationService } from "../modules/applications/application.service.js";

const applicationService = new ApplicationService(
  new ApplicationRepository(),
  applicationNotificationPublisher,
);

export const publicApplicationRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const data = parseOrThrow(createApplicationSchema, request.body);
      const result = await applicationService.create(data, {
        ipAddress: getClientIp(request.headers, request.ip),
        userAgent: request.headers["user-agent"],
        logger: request.log,
      });
      if (!result) return { success: true };
      return reply
        .code(result.created ? 201 : 200)
        .send({ success: true, id: result.record.id, deduplicated: !result.created });
    },
  );
};

export const adminApplicationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = parseOrThrow(applicationListQuerySchema, request.query);
    return applicationService.list(query);
  });

  app.patch("/bulk", async (request) => {
    const data = parseOrThrow(bulkUpdateApplicationsSchema, request.body);
    return applicationService.bulkUpdate(data);
  });

  app.get("/export.csv", async (request, reply) => {
    const query = parseOrThrow(applicationListQuerySchema, request.query);
    const csv = await applicationService.exportCsv(query);
    const date = new Date().toISOString().slice(0, 10);
    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="agromilk-applications-${date}.csv"`)
      .send(csv);
  });

  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return applicationService.get(id);
  });

  app.patch("/:id", async (request) => {
    const data = parseOrThrow(updateApplicationSchema, request.body);
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return applicationService.update(id, data);
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return applicationService.delete(id);
  });
};
