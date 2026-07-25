import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db/index.js";
import { analyticsEvents, applications } from "./db/schema.js";
import type { createApiContext } from "./test/api-context.js";
import { createApiContext as setup } from "./test/api-context.js";

let context: Awaited<ReturnType<typeof createApiContext>>;

beforeAll(async () => {
  context = await setup();
});
afterAll(async () => {
  if (context) await context.app.close();
});
beforeEach(async () => {
  await db.delete(analyticsEvents);
  await db.delete(applications);
});

describe("analytics and statistics API", () => {
  it("deduplicates concurrent-safe analytics events by eventId", async () => {
    const payload = {
      eventId: crypto.randomUUID(),
      visitorId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      eventType: "page_view",
      pagePath: "/deduplicated",
    };
    const [first, duplicate] = await Promise.all([
      context.app.inject({ method: "POST", url: "/api/v1/analytics/events", payload }),
      context.app.inject({ method: "POST", url: "/api/v1/analytics/events", payload }),
    ]);
    expect([first.statusCode, duplicate.statusCode].sort()).toEqual([200, 201]);
    expect([first.json(), duplicate.json()]).toContainEqual(
      expect.objectContaining({ deduplicated: true }),
    );
  });

  it("calculates conversion only for page-view visitors and caps it at 100%", async () => {
    const visitorId = crypto.randomUUID();
    await context.app.inject({
      method: "POST",
      url: "/api/v1/analytics/events",
      payload: {
        eventId: crypto.randomUUID(),
        visitorId,
        sessionId: crypto.randomUUID(),
        eventType: "page_view",
        pagePath: "/",
      },
    });
    for (const linkedVisitorId of [visitorId, visitorId, crypto.randomUUID()]) {
      await context.app.inject({
        method: "POST",
        url: "/api/v1/applications",
        payload: {
          submissionId: crypto.randomUUID(),
          visitorId: linkedVisitorId,
          name: "Analytics User",
          phone: "+375290000001",
          consent: true,
        },
      });
    }
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Minsk",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const response = await context.app.inject({
      method: "GET",
      url: `/api/v1/admin/statistics/summary?from=${today}&to=${today}`,
      headers: { cookie: context.cookie },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ visitors: 1, applications: 3, conversionRate: 100 });
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - 2);
    const timeline = await context.app.inject({
      method: "GET",
      url: `/api/v1/admin/statistics/timeline?from=${from.toISOString().slice(0, 10)}&to=${today}`,
      headers: { cookie: context.cookie },
    });
    expect(timeline.statusCode).toBe(200);
    expect(timeline.json().items).toHaveLength(3);
  });

  it("uses the same Minsk midnight boundaries for statistics", async () => {
    await db.insert(analyticsEvents).values([
      {
        eventId: crypto.randomUUID(),
        visitorId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        eventType: "page_view",
        pagePath: "/before",
        createdAt: new Date("2026-07-24T20:59:59.000Z"),
      },
      {
        eventId: crypto.randomUUID(),
        visitorId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        eventType: "page_view",
        pagePath: "/after",
        createdAt: new Date("2026-07-24T21:00:01.000Z"),
      },
    ]);
    await db.insert(applications).values([
      {
        submissionId: crypto.randomUUID(),
        name: "Before midnight",
        phone: "+375290000020",
        createdAt: new Date("2026-07-24T20:59:59.000Z"),
      },
      {
        submissionId: crypto.randomUUID(),
        name: "After midnight",
        phone: "+375290000021",
        createdAt: new Date("2026-07-24T21:00:01.000Z"),
      },
    ]);
    const response = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/statistics/summary?from=2026-07-25&to=2026-07-25",
      headers: { cookie: context.cookie },
    });
    expect(response.json()).toMatchObject({ visitors: 1, pageViews: 1, applications: 1 });
  });
});
