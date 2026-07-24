import bcrypt from "bcryptjs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { db, pool } from "./db/index.js";
import { admins, adminSessions, analyticsEvents, applications, articles, mediaFiles, products } from "./db/schema.js";

const adminEmail = "admin@example.com";
const adminPassword = "TestPassword123!";
let app: Awaited<ReturnType<typeof buildApp>>;
let cookie = "";
let applicationId = "";
let draftId = "";
let productId = "";
const slug = `integration-${Date.now()}`;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.delete(adminSessions);
  await db.delete(analyticsEvents);
  await db.delete(applications);
  await db.delete(articles);
  await db.delete(products);
  await db.delete(mediaFiles);
  await db.delete(admins);
  await db.insert(admins).values({ email: adminEmail, name: "Test Admin", passwordHash: await bcrypt.hash(adminPassword, 4) });
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe.sequential("critical API scenarios", () => {
  it("returns a database-aware health check", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  it("rejects a wrong password and accepts correct credentials", async () => {
    const wrong = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: adminEmail, password: "WrongPassword123!" } });
    expect(wrong.statusCode).toBe(401);
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: adminEmail, password: adminPassword } });
    expect(login.statusCode).toBe(200);
    const setCookie = login.headers["set-cookie"];
    cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0] ?? "";
    expect(cookie).toContain("admin_session=");
  });

  it("protects the admin API without a session", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/admin/applications" });
    expect(response.statusCode).toBe(401);
  });

  it("creates and updates an application", async () => {
    const created = await app.inject({ method: "POST", url: "/api/v1/applications", payload: { name: "Test User", phone: "+375290000000", email: "user@example.com", message: "Test", consent: true } });
    expect(created.statusCode).toBe(201);
    applicationId = created.json().id;
    const updated = await app.inject({ method: "PATCH", url: `/api/v1/admin/applications/${applicationId}`, headers: { cookie }, payload: { status: "in_progress", adminComment: "В работе" } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({ status: "in_progress", adminComment: "В работе" });
  });

  it("bulk updates application statuses", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/admin/applications/bulk",
      headers: { cookie },
      payload: { ids: [applicationId], status: "completed" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, updated: 1 });
  });

  it("creates, publishes and exposes a product", async () => {
    const productSlug = `product-${Date.now()}`;
    const created = await app.inject({ method: "POST", url: "/api/v1/admin/products", headers: { cookie }, payload: {
      name: "Integration product", slug: productSlug, category: "Для телят",
      description: "Тестовое описание продукта достаточной длины для валидации.",
      uses: ["Тестовое применение"], composition: "Состав", preparation: "Приготовление",
      imageUrl: "/assets/agromilk/product-scene-bag.png", status: "draft", sortOrder: 1, featured: false
    } });
    expect(created.statusCode).toBe(201);
    productId = created.json().id;
    const hidden = await app.inject({ method: "GET", url: `/api/v1/products/${productSlug}` });
    expect(hidden.statusCode).toBe(404);
    const published = await app.inject({ method: "PATCH", url: `/api/v1/admin/products/${productId}`, headers: { cookie }, payload: { status: "published" } });
    expect(published.statusCode).toBe(200);
    const visible = await app.inject({ method: "GET", url: `/api/v1/products/${productSlug}` });
    expect(visible.statusCode).toBe(200);
    expect(visible.json().uses).toEqual(["Тестовое применение"]);
  });

  it("creates a draft that is not public", async () => {
    const created = await app.inject({ method: "POST", url: "/api/v1/admin/articles", headers: { cookie }, payload: { title: "Integration draft", slug, excerpt: "Draft", content: "<p>Draft</p>", coverImageScale: 75, coverImagePositionX: 40, coverImagePositionY: 60, status: "draft" } });
    expect(created.statusCode).toBe(201);
    expect(created.json().coverImageScale).toBe(75);
    expect(created.json()).toMatchObject({ coverImagePositionX: 40, coverImagePositionY: 60 });
    draftId = created.json().id;
    const hidden = await app.inject({ method: "GET", url: `/api/v1/articles/${slug}` });
    expect(hidden.statusCode).toBe(404);
  });

  it("publishes and sanitizes an article", async () => {
    const updated = await app.inject({ method: "PATCH", url: `/api/v1/admin/articles/${draftId}`, headers: { cookie }, payload: { status: "published", content: '<p onclick="alert(1)">Safe</p><script>alert(1)</script>' } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().content).toBe("<p>Safe</p>");
    const published = await app.inject({ method: "GET", url: `/api/v1/articles/${slug}` });
    expect(published.statusCode).toBe(200);
    expect(published.json().publishedAt).toBeTruthy();
    expect(published.json().coverImageScale).toBe(75);
    expect(published.json()).toMatchObject({ coverImagePositionX: 40, coverImagePositionY: 60 });
  });

  it("rejects an invalid YouTube iframe", async () => {
    const response = await app.inject({ method: "PATCH", url: `/api/v1/admin/articles/${draftId}`, headers: { cookie }, payload: { content: '<iframe src="https://example.com/embed/not-youtube"></iframe>' } });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_YOUTUBE_EMBED");
  });

  it("accepts a locally uploaded cover image path", async () => {
    const coverImageUrl = "/uploads/example-cover.jpg";
    const response = await app.inject({ method: "PATCH", url: `/api/v1/admin/articles/${draftId}`, headers: { cookie }, payload: { coverImageUrl } });
    expect(response.statusCode).toBe(200);
    expect(response.json().coverImageUrl).toBe(coverImageUrl);
  });

  it("rejects a dangerous uploaded file", async () => {
    const boundary = "----landing-test-boundary";
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="attack.html"\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script>\r\n--${boundary}--\r\n`);
    const response = await app.inject({ method: "POST", url: "/api/v1/admin/media", headers: { cookie, "content-type": `multipart/form-data; boundary=${boundary}` }, payload: body });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_FILE");
  });

  it("returns numeric statistics", async () => {
    const visitorId = crypto.randomUUID();
    await app.inject({ method: "POST", url: "/api/v1/analytics/events", payload: { visitorId, sessionId: crypto.randomUUID(), eventType: "page_view", pagePath: "/" } });
    const today = new Date().toISOString().slice(0, 10);
    const response = await app.inject({ method: "GET", url: `/api/v1/admin/statistics/summary?from=${today}&to=${today}`, headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.objectContaining({ visitors: expect.any(Number), pageViews: expect.any(Number), applications: expect.any(Number), conversionRate: expect.any(Number) }));

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - 2);
    const timeline = await app.inject({ method: "GET", url: `/api/v1/admin/statistics/timeline?from=${from.toISOString().slice(0, 10)}&to=${today}`, headers: { cookie } });
    expect(timeline.statusCode).toBe(200);
    expect(timeline.json().items).toHaveLength(3);
  });
});
