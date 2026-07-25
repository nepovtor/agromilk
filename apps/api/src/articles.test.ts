import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
    expect((await context.app.inject({ method: "GET", url: `/api/v1/articles/${slug}` })).statusCode)
      .toBe(404);
    const published = await context.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/articles/${id}`,
      headers: { cookie: context.cookie },
      payload: {
        status: "published",
        content: '<p onclick="alert(1)">Safe</p><script>alert(1)</script>',
        coverImageUrl: "/uploads/example-cover.webp",
      },
    });
    expect(published.json()).toMatchObject({
      content: "<p>Safe</p>",
      coverImageUrl: "/uploads/example-cover.webp",
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
