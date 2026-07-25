import { expect, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL4mQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Пароль").fill("TestPassword123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("media cannot be deleted while a product references it", async ({ page }) => {
  await login(page);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let mediaId: string | undefined;
  let productId: string | undefined;
  let mediaUrl: string | undefined;
  try {
    const upload = await page.request.post("/api/v1/admin/media", {
      multipart: { file: { name: `e2e-${suffix}.png`, mimeType: "image/png", buffer: png } },
    });
    expect(upload.status()).toBe(201);
    const media = (await upload.json()) as { id: string; url: string };
    mediaId = media.id;
    mediaUrl = media.url;
    const listed = (await (await page.request.get("/api/v1/admin/media")).json()) as {
      items: Array<{ id: string }>;
    };
    expect(listed.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: mediaId })]),
    );

    const product = await page.request.post("/api/v1/admin/products", {
      data: {
        name: `E2E product ${suffix}`,
        slug: `e2e-product-${suffix}`,
        description: "Тестовый продукт для проверки связи изображения с товаром.",
        uses: ["Тестовое применение"],
        imageUrl: mediaUrl,
      },
    });
    expect(product.status()).toBe(201);
    productId = ((await product.json()) as { id: string }).id;
    expect((await page.request.delete(`/api/v1/admin/media/${mediaId}`)).status()).toBe(409);

    expect(
      (
        await page.request.patch(`/api/v1/admin/products/${productId}`, { data: { imageUrl: "" } })
      ).ok(),
    ).toBeTruthy();
    expect((await page.request.delete(`/api/v1/admin/media/${mediaId}`)).ok()).toBeTruthy();
    expect((await page.request.get(mediaUrl)).status()).toBe(404);
    mediaId = undefined;
  } finally {
    if (productId) await page.request.delete(`/api/v1/admin/products/${productId}`);
    if (mediaId) await page.request.delete(`/api/v1/admin/media/${mediaId}`);
  }
});
