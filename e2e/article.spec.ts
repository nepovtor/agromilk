import { expect, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL4mQAAAABJRU5ErkJggg==",
  "base64",
);

test("published article keeps a single media relation and can be cleaned up", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Пароль").fill("TestPassword123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let articleId: string | undefined;
  let mediaId: string | undefined;
  try {
    const upload = await page.request.post("/api/v1/admin/media", {
      multipart: { file: { name: `article-${suffix}.png`, mimeType: "image/png", buffer: png } },
    });
    expect(upload.status()).toBe(201);
    const media = (await upload.json()) as { id: string; url: string };
    mediaId = media.id;
    const articleInput = {
      title: `E2E article ${suffix}`,
      slug: `e2e-article-${suffix}`,
      excerpt: "Проверка публикации статьи с изображением.",
      content: `<p>Материал</p><img src="${media.url}" alt="E2E image">`,
      coverImageUrl: media.url,
      status: "published",
    };
    const created = await page.request.post("/api/v1/admin/articles", { data: articleInput });
    expect(created.status()).toBe(201);
    articleId = ((await created.json()) as { id: string }).id;
    await page.goto(`/instructions/${articleInput.slug}`);
    await expect(page.getByRole("heading", { name: articleInput.title })).toBeVisible();
    await expect(page.getByRole("img", { name: "E2E image" })).toBeVisible();

    const saved = await page.request.patch(`/api/v1/admin/articles/${articleId}`, {
      data: articleInput,
    });
    expect(saved.ok()).toBeTruthy();
    expect((await page.request.delete(`/api/v1/admin/media/${mediaId}`)).status()).toBe(409);
    expect(
      (
        await page.request.patch(`/api/v1/admin/articles/${articleId}`, {
          data: { content: "<p>Материал без изображения</p>", coverImageUrl: "" },
        })
      ).ok(),
    ).toBeTruthy();
    expect((await page.request.delete(`/api/v1/admin/articles/${articleId}`)).ok()).toBeTruthy();
    articleId = undefined;
    expect((await page.request.delete(`/api/v1/admin/media/${mediaId}`)).ok()).toBeTruthy();
    mediaId = undefined;
  } finally {
    if (articleId) await page.request.delete(`/api/v1/admin/articles/${articleId}`);
    if (mediaId) await page.request.delete(`/api/v1/admin/media/${mediaId}`);
  }
});
