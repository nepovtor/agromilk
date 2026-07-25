import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "./db/index.js";
import { applications } from "./db/schema.js";
import type { createApiContext } from "./test/api-context.js";
import { createApiContext as setup } from "./test/api-context.js";

let context: Awaited<ReturnType<typeof createApiContext>>;

beforeAll(async () => {
  context = await setup();
});
afterAll(async () => {
  if (context) await context.app.close();
});

describe("applications API", () => {
  it("creates idempotently and supports the complete admin lifecycle", async () => {
    const payload = {
      submissionId: crypto.randomUUID(),
      visitorId: crypto.randomUUID(),
      name: "Test User",
      phone: "+375290000000",
      email: "user@example.com",
      message: "Test",
      consent: true,
    };
    const created = await context.app.inject({
      method: "POST",
      url: "/api/v1/applications",
      payload,
    });
    expect(created.statusCode).toBe(201);
    const id: string = created.json().id;
    const duplicate = await context.app.inject({
      method: "POST",
      url: "/api/v1/applications",
      payload,
    });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json()).toMatchObject({ id, deduplicated: true });

    const updated = await context.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/applications/${id}`,
      headers: { cookie: context.cookie },
      payload: { status: "in_progress", adminComment: "В работе" },
    });
    expect(updated.json()).toMatchObject({ status: "in_progress", adminComment: "В работе" });
    const listed = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/applications?status=in_progress&search=Test%20User&page=1&pageSize=1",
      headers: { cookie: context.cookie },
    });
    expect(listed.json()).toMatchObject({
      items: [expect.objectContaining({ id, name: "Test User" })],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
    });
    const bulk = await context.app.inject({
      method: "PATCH",
      url: "/api/v1/admin/applications/bulk",
      headers: { cookie: context.cookie },
      payload: { ids: [id], status: "completed" },
    });
    expect(bulk.json()).toEqual({ success: true, updated: 1 });
    const csv = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/applications/export.csv?status=completed&search=Test%20User",
      headers: { cookie: context.cookie },
    });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body).toContain("Test User");
    expect(csv.body).toContain("Завершена");
    const deleted = await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/applications/${id}`,
      headers: { cookie: context.cookie },
    });
    expect(deleted.json()).toEqual({ success: true });
    const missing = await context.app.inject({
      method: "GET",
      url: `/api/v1/admin/applications/${id}`,
      headers: { cookie: context.cookie },
    });
    expect(missing.statusCode).toBe(404);
  });

  it("returns standardized validation errors", async () => {
    const response = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/applications/not-a-uuid",
      headers: { cookie: context.cookie },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      fields: { id: expect.any(Array) },
    });
  });

  it("uses Minsk calendar boundaries for lists and CSV export", async () => {
    await db.insert(applications).values([
      {
        name: "Before midnight",
        phone: "+375290000010",
        createdAt: new Date("2026-07-24T20:59:59.000Z"),
      },
      {
        name: "After midnight",
        phone: "+375290000011",
        createdAt: new Date("2026-07-24T21:00:01.000Z"),
      },
    ]);
    const query = "from=2026-07-25&to=2026-07-25&search=midnight";
    const list = await context.app.inject({
      method: "GET",
      url: `/api/v1/admin/applications?${query}`,
      headers: { cookie: context.cookie },
    });
    expect(list.json().items).toEqual([
      expect.objectContaining({ name: "After midnight" }),
    ]);
    const csv = await context.app.inject({
      method: "GET",
      url: `/api/v1/admin/applications/export.csv?${query}`,
      headers: { cookie: context.cookie },
    });
    expect(csv.body).toContain("After midnight");
    expect(csv.body).not.toContain("Before midnight");
  });
});
