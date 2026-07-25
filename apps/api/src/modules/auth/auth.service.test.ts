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
});
