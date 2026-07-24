import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import {
  bulkUpdateApplicationsSchema,
  createApplicationSchema,
  applicationListQuerySchema,
  idParamsSchema,
  updateApplicationSchema,
} from "@landing/shared";
import { db } from "../db/index.js";
import { applications } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { NotFoundError } from "../lib/errors.js";
import { getClientIp, parseOrThrow } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";
import { sendApplicationEmail, sendApplicationTelegram } from "../services/notification.service.js";

export const publicApplicationRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const data = parseOrThrow(createApplicationSchema, request.body);
      if (data.website) return { success: true };

      const [created] = await db
        .insert(applications)
        .values({
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          message: data.message || "",
          sourcePage: data.sourcePage || null,
          utmSource: data.utmSource || null,
          utmMedium: data.utmMedium || null,
          utmCampaign: data.utmCampaign || null,
          ipAddress: getClientIp(request.headers as Record<string, unknown>, request.ip),
          userAgent: request.headers["user-agent"],
        })
        .returning();

      const notificationResults = await Promise.allSettled([
        sendApplicationEmail(created),
        sendApplicationTelegram(created),
      ]);
      notificationResults.forEach((result) => {
        if (result.status === "rejected")
          request.log.error(result.reason, "Ошибка отправки уведомления");
      });

      return reply.code(201).send({ success: true, id: created.id });
    },
  );
};

export const adminApplicationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = parseOrThrow(applicationListQuerySchema, request.query);
    const { page, pageSize } = query;
    const conditions = [];
    if (query.status) conditions.push(eq(applications.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(applications.name, pattern),
          ilike(applications.phone, pattern),
          ilike(applications.email, pattern),
        )!,
      );
    }
    if (query.from)
      conditions.push(gte(applications.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
    if (query.to)
      conditions.push(lte(applications.createdAt, new Date(`${query.to}T23:59:59.999Z`)));
    const where = conditions.length ? and(...conditions) : undefined;
    const order = query.sort === "asc" ? asc(applications.createdAt) : desc(applications.createdAt);

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(applications)
        .where(where)
        .orderBy(order)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(applications).where(where),
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(serializeDates),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  });

  app.patch("/bulk", async (request) => {
    const data = parseOrThrow(bulkUpdateApplicationsSchema, request.body);
    const updated = await db
      .update(applications)
      .set({ status: data.status, updatedAt: new Date() })
      .where(inArray(applications.id, data.ids))
      .returning({ id: applications.id });
    return { success: true, updated: updated.length };
  });

  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [item] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    if (!item) throw new NotFoundError("Заявка не найдена");
    return serializeDates(item);
  });

  app.patch("/:id", async (request) => {
    const data = parseOrThrow(updateApplicationSchema, request.body);
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [updated] = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    if (!updated) throw new NotFoundError("Заявка не найдена");
    return serializeDates(updated);
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [deleted] = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    if (!deleted) throw new NotFoundError("Заявка не найдена");
    return { success: true };
  });
};
