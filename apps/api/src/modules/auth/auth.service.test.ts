import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("AuthService Google OAuth", () => {
  it("adds an abort timeout signal to the token request", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.resetModules();
    const fetchMock = vi.fn((_url: string | URL | Request, options?: RequestInit) => {
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      return Promise.reject(new DOMException("Request timed out", "TimeoutError"));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { AuthService } = await import("./auth.service.js");

    await expect(
      new AuthService().authenticateGoogle("code", "http://localhost/callback"),
    ).rejects.toMatchObject({ name: "TimeoutError" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects OAuth requests when credentials or upstream responses are invalid", async () => {
    const { AuthService } = await import("./auth.service.js");
    expect(() =>
      new AuthService().googleAuthorizationUrl("state", "http://localhost/callback"),
    ).toThrow("not configured");

    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    vi.resetModules();
    const configured = await import("./auth.service.js");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 502 })));
    await expect(
      new configured.AuthService().authenticateGoogle("code", "http://localhost/callback"),
    ).rejects.toThrow("token endpoint returned 502");

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: "token", token_type: "Bearer", expires_in: 60 }),
            {
              status: 200,
            },
          ),
        )
        .mockResolvedValueOnce(new Response("bad", { status: 503 })),
    );
    await expect(
      new configured.AuthService().authenticateGoogle("code", "http://localhost/callback"),
    ).rejects.toThrow("profile endpoint returned 503");
  });

  it("authenticates only active matching administrators and exposes no password", async () => {
    const { AuthService } = await import("./auth.service.js");
    const password = "CorrectPassword123!";
    const admin = {
      id: "admin-id",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(password, 4),
    };
    const repository = {
      findActiveAdmin: vi.fn().mockResolvedValue(admin),
      deleteSession: vi.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(repository);
    await expect(service.authenticate(admin.email, password)).resolves.toEqual(admin);
    await expect(service.authenticate(admin.email, "wrong")).resolves.toBeUndefined();
    repository.findActiveAdmin.mockResolvedValue(undefined);
    await expect(service.authenticate("missing@example.com", password)).resolves.toBeUndefined();
    expect(service.toPublicUser(admin)).toEqual({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    await service.logout("session-token");
    expect(repository.deleteSession).toHaveBeenCalledWith(expect.any(String));
  });
});
