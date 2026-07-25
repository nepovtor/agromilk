import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { articleMedia, articles, mediaFiles } from "./db/schema.js";
import { backfillArticleMedia } from "./modules/articles/article-media-backfill.service.js";
import type { createApiContext } from "./test/api-context.js";
import { createApiContext as setup } from "./test/api-context.js";

let context: Awaited<ReturnType<typeof createApiContext>>;

beforeAll(async () => {
  context = await setup();
});
afterAll(async () => {
  if (context) await context.app.close();
});

describe("articles API", () => {
  it("backfills content media relations for legacy articles idempotently", async () => {
    const storedName = `${crypto.randomUUID()}.webp`;
    const [media] = await db
      .insert(mediaFiles)
      .values({
        originalName: "legacy.webp",
        storedName,
        mimeType: "image/webp",
        size: 1,
        url: `/uploads/${storedName}`,
      })
      .returning();
    const [article] = await db
      .insert(articles)
      .values({
        title: "Legacy content media",
        slug: `legacy-media-${crypto.randomUUID()}`,
        content: `<p><img src="${media.url}" alt="Legacy image"></p>`,
      })
      .returning();

    await expect(backfillArticleMedia()).resolves.toMatchObject({ relationsCreated: 1 });
    await expect(backfillArticleMedia()).resolves.toMatchObject({ relationsCreated: 0 });
    await expect(
      db.select().from(articleMedia).where(eq(articleMedia.articleId, article.id)),
    ).resolves.toEqual([
      expect.objectContaining({ articleId: article.id, mediaId: media.id, usageType: "content" }),
    ]);
  });

  it("keeps drafts private and sanitizes published content", async () => {
    const slug = `article-${Date.now()}`;
    const created = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/articles",
      headers: { cookie: context.cookie },
      payload: {
        title: "Integration draft",
        slug,
        excerpt: "Draft",
        content: "<p>Draft</p>",
        coverImageScale: 75,
        coverImagePositionX: 40,
        coverImagePositionY: 60,
        status: "draft",
      },
    });
    expect(created.statusCode).toBe(201);
    const id: string = created.json().id;
    expect(created.json()).toMatchObject({
      coverImageScale: 75,
      coverImagePositionX: 40,
      coverImagePositionY: 60,
    });
    expect(
      (await context.app.inject({ method: "GET", url: `/api/v1/articles/${slug}` })).statusCode,
    ).toBe(404);
    const published = await context.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/articles/${id}`,
      headers: { cookie: context.cookie },
      payload: {
        status: "published",
        content: '<p onclick="alert(1)">Safe</p><script>alert(1)</script>',
        coverImageUrl: "https://example.com/example-cover.webp",
      },
    });
    expect(published.json()).toMatchObject({
      content: "<p>Safe</p>",
      coverImageUrl: "https://example.com/example-cover.webp",
    });
    const publicArticle = await context.app.inject({
      method: "GET",
      url: `/api/v1/articles/${slug}`,
    });
    expect(publicArticle.statusCode).toBe(200);
    expect(publicArticle.json().publishedAt).toBeTruthy();
    const list = await context.app.inject({
      method: "GET",
      url: "/api/v1/articles?page=1&pageSize=1",
    });
    expect(list.json().items[0]).not.toHaveProperty("content");
    const invalidIframe = await context.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/articles/${id}`,
      headers: { cookie: context.cookie },
      payload: { content: '<iframe src="https://example.com/embed/not-youtube"></iframe>' },
    });
    expect(invalidIframe.statusCode).toBe(400);
    expect(invalidIframe.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      fields: { content: expect.any(Array) },
    });
    const deleted = await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/articles/${id}`,
      headers: { cookie: context.cookie },
    });
    expect(deleted.json()).toEqual({ success: true });
  });
});
