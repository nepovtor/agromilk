import { and, count, countDistinct, eq, gte, lte, sql } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { analyticsEvents, applications } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";

function getRange(query: Record<string, string | undefined>) {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
  defaultFrom.setUTCHours(0, 0, 0, 0);
  const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : defaultFrom;
  const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : now;
  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) throw new Error("INVALID_DATE_RANGE");
  if (to.valueOf() - from.valueOf() > 366 * 24 * 60 * 60 * 1000) throw new Error("DATE_RANGE_TOO_LARGE");
  return { from, to };
}

export const statisticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/summary", async (request, reply) => {
    let range;
    try { range = getRange(request.query as Record<string, string | undefined>); }
    catch { return reply.code(400).send({ error: "INVALID_DATE_RANGE" }); }
    const eventWhere = and(
      eq(analyticsEvents.eventType, "page_view"),
      gte(analyticsEvents.createdAt, range.from),
      lte(analyticsEvents.createdAt, range.to)
    );
    const appWhere = and(gte(applications.createdAt, range.from), lte(applications.createdAt, range.to));
    const [eventStats, appStats] = await Promise.all([
      db.select({ visitors: countDistinct(analyticsEvents.visitorId), pageViews: count() }).from(analyticsEvents).where(eventWhere),
      db.select({ applications: count() }).from(applications).where(appWhere)
    ]);
    const visitors = Number(eventStats[0]?.visitors ?? 0);
    const pageViews = Number(eventStats[0]?.pageViews ?? 0);
    const applicationCount = Number(appStats[0]?.applications ?? 0);
    return {
      visitors,
      pageViews,
      applications: applicationCount,
      conversionRate: visitors > 0 ? Number(((applicationCount / visitors) * 100).toFixed(2)) : 0
    };
  });

  app.get("/timeline", async (request, reply) => {
    let range;
    try { range = getRange(request.query as Record<string, string | undefined>); }
    catch { return reply.code(400).send({ error: "INVALID_DATE_RANGE" }); }

    const [eventsByDate, applicationsByDate] = await Promise.all([
      db.select({
        date: sql<string>`to_char(date_trunc('day', ${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,
        visitors: countDistinct(analyticsEvents.visitorId),
        pageViews: count()
      }).from(analyticsEvents).where(and(
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.createdAt, range.from),
        lte(analyticsEvents.createdAt, range.to)
      )).groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`).orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`),
      db.select({
        date: sql<string>`to_char(date_trunc('day', ${applications.createdAt}), 'YYYY-MM-DD')`,
        applications: count()
      }).from(applications).where(and(
        gte(applications.createdAt, range.from),
        lte(applications.createdAt, range.to)
      )).groupBy(sql`date_trunc('day', ${applications.createdAt})`).orderBy(sql`date_trunc('day', ${applications.createdAt})`)
    ]);

    const map = new Map<string, { date: string; visitors: number; pageViews: number; applications: number }>();
    for (const row of eventsByDate) map.set(row.date, { date: row.date, visitors: Number(row.visitors), pageViews: Number(row.pageViews), applications: 0 });
    for (const row of applicationsByDate) {
      const item = map.get(row.date) ?? { date: row.date, visitors: 0, pageViews: 0, applications: 0 };
      item.applications = Number(row.applications);
      map.set(row.date, item);
    }
    const cursor = new Date(range.from);
    cursor.setUTCHours(0, 0, 0, 0);
    const lastDate = new Date(range.to);
    lastDate.setUTCHours(0, 0, 0, 0);
    while (cursor <= lastDate) {
      const date = cursor.toISOString().slice(0, 10);
      if (!map.has(date)) map.set(date, { date, visitors: 0, pageViews: 0, applications: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { items: [...map.values()].sort((a, b) => a.date.localeCompare(b.date)) };
  });
};
