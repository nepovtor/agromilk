import { and, count, countDistinct, eq, gte, lt, sql } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { analyticsEvents, applications } from "../../db/schema.js";
import type { StatisticsRange } from "./statistics.types.js";

export class StatisticsRepository {
  async summary(range: StatisticsRange) {
    const eventRange = and(
      eq(analyticsEvents.eventType, "page_view"),
      gte(analyticsEvents.createdAt, range.from),
      lt(analyticsEvents.createdAt, range.toExclusive),
    );
    const applicationRange = and(
      gte(applications.createdAt, range.from),
      lt(applications.createdAt, range.toExclusive),
    );
    const [eventStats, applicationStats, conversionStats] = await Promise.all([
      db
        .select({ visitors: countDistinct(analyticsEvents.visitorId), pageViews: count() })
        .from(analyticsEvents)
        .where(eventRange),
      db.select({ applications: count() }).from(applications).where(applicationRange),
      db
        .select({ convertedVisitors: countDistinct(applications.visitorId) })
        .from(applications)
        .innerJoin(
          analyticsEvents,
          and(
            eq(analyticsEvents.visitorId, applications.visitorId),
            eq(analyticsEvents.eventType, "page_view"),
            gte(analyticsEvents.createdAt, range.from),
            lt(analyticsEvents.createdAt, range.toExclusive),
          ),
        )
        .where(applicationRange),
    ]);
    return {
      visitors: Number(eventStats[0]?.visitors ?? 0),
      pageViews: Number(eventStats[0]?.pageViews ?? 0),
      applications: Number(applicationStats[0]?.applications ?? 0),
      convertedVisitors: Number(conversionStats[0]?.convertedVisitors ?? 0),
    };
  }

  async timeline(range: StatisticsRange) {
    const timeZone = sql.raw(`'${env.BUSINESS_TIME_ZONE.replaceAll("'", "''")}'`);
    const eventDay = sql<string>`to_char(${analyticsEvents.createdAt} AT TIME ZONE ${timeZone}, 'YYYY-MM-DD')`;
    const applicationDay = sql<string>`to_char(${applications.createdAt} AT TIME ZONE ${timeZone}, 'YYYY-MM-DD')`;
    return Promise.all([
      db
        .select({
          date: eventDay,
          visitors: countDistinct(analyticsEvents.visitorId),
          pageViews: count(),
        })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, "page_view"),
            gte(analyticsEvents.createdAt, range.from),
            lt(analyticsEvents.createdAt, range.toExclusive),
          ),
        )
        .groupBy(eventDay)
        .orderBy(eventDay),
      db
        .select({ date: applicationDay, applications: count() })
        .from(applications)
        .where(
          and(
            gte(applications.createdAt, range.from),
            lt(applications.createdAt, range.toExclusive),
          ),
        )
        .groupBy(applicationDay)
        .orderBy(applicationDay),
    ]);
  }
}
