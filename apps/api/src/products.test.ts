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

describe("products API", () => {
  it("creates, publishes, lists, updates and deletes a product", async () => {
    const slug = `product-${Date.now()}`;
    const payload = {
      name: "Integration product",
      slug,
      category: "Для телят",
      description: "Тестовое описание продукта достаточной длины для валидации.",
      uses: ["Тестовое применение"],
      composition: "Состав",
      preparation: "Приготовление",
      imageUrl: "/assets/agromilk/product-scene-bag.webp",
      status: "draft",
      sortOrder: 1,
      featured: false,
    };
    const created = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/products",
      headers: { cookie: context.cookie },
      payload,
    });
    expect(created.statusCode).toBe(201);
    const id: string = created.json().id;
    const duplicate = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/products",
      headers: { cookie: context.cookie },
      payload,
    });
    expect(duplicate.statusCode).toBe(409);
    expect((await context.app.inject({ method: "GET", url: `/api/v1/products/${slug}` })).statusCode)
      .toBe(404);
    const updated = await context.app.inject({
      method: "PATCH",
      url: `/api/v1/admin/products/${id}`,
      headers: { cookie: context.cookie },
      payload: { featured: true, sortOrder: 2, status: "published" },
    });
    expect(updated.json()).toMatchObject({ id, featured: true, sortOrder: 2 });
    const publicList = await context.app.inject({ method: "GET", url: "/api/v1/products" });
    expect(publicList.json().items).toEqual([
      expect.objectContaining({ id, featured: true, uses: ["Тестовое применение"] }),
    ]);
    const adminList = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/products?status=published&search=Integration",
      headers: { cookie: context.cookie },
    });
    expect(adminList.json().items).toEqual([expect.objectContaining({ id })]);
    const deleted = await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/products/${id}`,
      headers: { cookie: context.cookie },
    });
    expect(deleted.json()).toEqual({ success: true });
  });
});
