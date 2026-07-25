import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { createApiContext } from "../test/api-context.js";
import { createApiContext as setup } from "../test/api-context.js";

let context: Awaited<ReturnType<typeof createApiContext>>;
beforeAll(async () => {
  context = await setup();
});
afterAll(async () => context?.app.close());

describe("assistant routes", () => {
  it("requires a session, validates input and reports unavailable Ollama", async () => {
    expect(
      (await context.app.inject({ method: "POST", url: "/api/v1/admin/assistant/rewrite" }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await context.app.inject({
          method: "POST",
          url: "/api/v1/admin/assistant/rewrite",
          headers: { cookie: context.cookie },
          payload: { text: "x", action: "polish" },
        })
      ).statusCode,
    ).toBe(400);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 503 })));
    const unavailable = await context.app.inject({
      method: "POST",
      url: "/api/v1/admin/assistant/rewrite",
      headers: { cookie: context.cookie },
      payload: { text: "Текст для улучшения", action: "shorten" },
    });
    expect(unavailable.statusCode).toBe(503);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ response: " Готово " }))),
    );
    expect(
      (
        await context.app.inject({
          method: "POST",
          url: "/api/v1/admin/assistant/rewrite",
          headers: { cookie: context.cookie },
          payload: { text: "Текст для улучшения", action: "list" },
        })
      ).json(),
    ).toMatchObject({ text: "Готово" });
    vi.unstubAllGlobals();
  });
});
