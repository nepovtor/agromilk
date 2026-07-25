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

describe("auth API", () => {
  it("uses the same response for a missing user and a wrong password", async () => {
    const wrong = await context.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: context.adminEmail, password: "WrongPassword123!" },
    });
    const missing = await context.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "missing@example.com", password: "WrongPassword123!" },
    });
    expect(wrong.statusCode).toBe(401);
    expect(missing.statusCode).toBe(wrong.statusCode);
    expect(missing.json()).toEqual(wrong.json());
  });

  it("authenticates valid credentials and protects unauthenticated admin routes", async () => {
    const login = await context.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: context.adminEmail, password: context.adminPassword },
    });
    expect(login.statusCode).toBe(200);
    expect(context.cookie).toContain("admin_session=");
    const unauthorized = await context.app.inject({
      method: "GET",
      url: "/api/v1/admin/applications",
    });
    expect(unauthorized.statusCode).toBe(401);
  });

  it("returns a database-aware health check", async () => {
    const response = await context.app.inject({ method: "GET", url: "/api/v1/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", database: "ok" });
  });

  it("handles sessions, logout and disabled Google OAuth without exposing credentials", async () => {
    const login = await context.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: context.adminEmail, password: context.adminPassword },
    });
    expect(login.json()).toEqual({
      user: expect.not.objectContaining({ passwordHash: expect.anything() }),
    });
    const me = await context.app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: context.cookie },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe(context.adminEmail);
    expect(
      (
        await context.app.inject({
          method: "GET",
          url: "/api/v1/auth/me",
          headers: { cookie: "admin_session=corrupted" },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (await context.app.inject({ method: "GET", url: "/api/v1/auth/google/status" })).json(),
    ).toEqual({
      enabled: false,
    });
    expect(
      (await context.app.inject({ method: "GET", url: "/api/v1/auth/google" })).statusCode,
    ).toBe(404);
    const callback = await context.app.inject({
      method: "GET",
      url: "/api/v1/auth/google/callback?code=code&state=bad",
    });
    expect(callback.statusCode).toBe(302);
    expect(callback.headers.location).toContain("google_error=not_configured");
    const logout = await context.app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: context.cookie },
    });
    expect(logout.json()).toEqual({ success: true });
    expect(logout.headers["set-cookie"]).toContain("admin_session=");
  });
});
