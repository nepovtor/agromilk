import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
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

describe("media API", () => {
  it("rejects files without an allowed image signature", async () => {
    const boundary = "----agromilk-dangerous-media";
    const body = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="attack.html"\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script>\r\n--${boundary}--\r\n`,
    );
    const response = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/media",
      headers: {
        cookie: context.cookie,
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: body,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("INVALID_FILE");
  });

  it("blocks deletion when HTML content references media", async () => {
    const boundary = "----agromilk-valid-media";
    const image = await readFile("../web/public/assets/agromilk/logo-desktop.webp");
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="logo.webp"\r\nContent-Type: image/webp\r\n\r\n`,
      ),
      image,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const uploaded = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/media",
      headers: {
        cookie: context.cookie,
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: body,
    });
    expect(uploaded.statusCode).toBe(201);
    const record = uploaded.json();
    expect(existsSync(path.resolve("uploads", record.storedName))).toBe(true);
    const article = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/articles",
      headers: { cookie: context.cookie },
      payload: {
        title: "Embedded media",
        slug: `embedded-media-${Date.now()}`,
        excerpt: "Embedded media",
        content: `<p><img src="${record.url}" alt="test"></p>`,
        status: "draft",
      },
    });
    const blocked = await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/media/${record.id}`,
      headers: { cookie: context.cookie },
    });
    expect(blocked.statusCode).toBe(409);
    await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/articles/${article.json().id}`,
      headers: { cookie: context.cookie },
    });
    const deleted = await context.app.inject({
      method: "DELETE",
      url: `/api/v1/admin/media/${record.id}`,
      headers: { cookie: context.cookie },
    });
    expect(deleted.statusCode).toBe(200);
    expect(existsSync(path.resolve("uploads", record.storedName))).toBe(false);
  });
});
