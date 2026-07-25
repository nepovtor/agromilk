import fastify from "fastify";
import cookie from "@fastify/cookie";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Google OAuth routes", () => {
  it("starts OAuth, rejects mismatched state and maps an upstream failure", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
    vi.resetModules();
    const [{ authRoutes }, { AuthService }] = await Promise.all([
      import("./auth.routes.js"),
      import("./auth.service.js"),
    ]);
    const app = fastify();
    await app.register(cookie, { secret: "test-cookie-secret-at-least-32-characters" });
    await app.register(authRoutes, { prefix: "/auth" });
    expect((await app.inject("/auth/google/status")).json()).toEqual({ enabled: true });

    const start = await app.inject("/auth/google");
    expect(start.statusCode).toBe(302);
    const authorizationUrl = new URL(start.headers.location!);
    const state = authorizationUrl.searchParams.get("state");
    expect(state).toBeTruthy();
    const setCookie = start.headers["set-cookie"]!;
    const cookieHeader = (Array.isArray(setCookie) ? setCookie[0] : setCookie).split(";", 1)[0];
    const mismatch = await app.inject({
      url: `/auth/google/callback?code=code&state=wrong`,
      headers: { cookie: cookieHeader },
    });
    expect(mismatch.headers.location).toContain("google_error=invalid_state");

    vi.spyOn(AuthService.prototype, "authenticateGoogle").mockRejectedValue(new Error("offline"));
    const providerFailure = await app.inject({
      url: `/auth/google/callback?code=code&state=${state}`,
      headers: { cookie: cookieHeader },
    });
    expect(providerFailure.headers.location).toContain("google_error=provider_error");
    await app.close();
  });
});
