import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import {
  bulkUpdateApplicationsSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "@landing/shared";
import { db } from "../db/index.js";
import { applications } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { getClientIp, sendValidationError } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";
import {
  sendApplicationEmail,
  sendApplicationTelegram,
} from "../services/notification.service.js";

export const publicApplicationRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = createApplicationSchema.safeParse(request.body);
      if (!parsed.success) return sendValidationError(reply, parsed.error);
      if (parsed.data.website) return { success: true };

      const [created] = await db
        .insert(applications)
        .values({
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          message: parsed.data.message || "",
          sourcePage: parsed.data.sourcePage || null,
          utmSource: parsed.data.utmSource || null,
          utmMedium: parsed.data.utmMedium || null,
          utmCampaign: parsed.data.utmCampaign || null,
          ipAddress: getClientIp(
            request.headers as Record<string, unknown>,
            request.ip,
          ),
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
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const conditions = [];
    if (query.status)
      conditions.push(
        eq(
          applications.status,
          query.status as (typeof applications.status.enumValues)[number],
        ),
      );
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
      conditions.push(
        gte(applications.createdAt, new Date(`${query.from}T00:00:00.000Z`)),
      );
    if (query.to)
      conditions.push(
        lte(applications.createdAt, new Date(`${query.to}T23:59:59.999Z`)),
      );
    const where = conditions.length ? and(...conditions) : undefined;
    const order =
      query.sort === "asc"
        ? asc(applications.createdAt)
        : desc(applications.createdAt);

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

  app.patch("/bulk", async (request, reply) => {
    const parsed = bulkUpdateApplicationsSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    const updated = await db
      .update(applications)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(inArray(applications.id, parsed.data.ids))
      .returning({ id: applications.id });
    return { success: true, updated: updated.length };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [item] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    if (!item) return reply.code(404).send({ error: "NOT_FOUND" });
    if (item.status === "new")
      await db
        .update(applications)
        .set({ status: "viewed", updatedAt: new Date() })
        .where(eq(applications.id, id));
    return serializeDates({
      ...item,
      status: item.status === "new" ? "viewed" : item.status,
    });
  });

  app.patch("/:id", async (request, reply) => {
    const parsed = updateApplicationSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    const { id } = request.params as { id: string };
    const [updated] = await db
      .update(applications)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: "NOT_FOUND" });
    return serializeDates(updated);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [deleted] = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    if (!deleted) return reply.code(404).send({ error: "NOT_FOUND" });
    return { success: true };
  });
};
