import { afterEach, describe, expect, it, vi } from "vitest";

const application = {
  id: "application-id",
  name: "Иван <Фермер>",
  phone: "+375291112233",
  email: "ivan@example.com",
  message: "Молоко & корм",
  sourcePage: "/",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  createdAt: new Date("2026-01-02T03:04:05Z"),
} as never;

afterEach(() => {
  vi.doUnmock("nodemailer");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("application notifications", () => {
  it("skips delivery when channels are not configured", async () => {
    const { sendApplicationEmail, sendApplicationTelegram } =
      await import("./notification.service.js");
    await expect(sendApplicationEmail(application)).resolves.toEqual({ skipped: true });
    await expect(sendApplicationTelegram(application)).resolves.toEqual({ skipped: true });
  });

  it("escapes email HTML and handles successful and failed Telegram delivery", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASSWORD", "password");
    vi.stubEnv("MAIL_TO", "ops@example.com");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token");
    vi.stubEnv("TELEGRAM_CHAT_ID", "chat");
    vi.doMock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));
    const { sendApplicationEmail, sendApplicationTelegram } =
      await import("./notification.service.js");

    await expect(sendApplicationEmail(application)).resolves.toEqual({ skipped: false });
    expect(sendMail.mock.calls[0]?.[0].html).toContain("Иван &lt;Фермер&gt;");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
    await expect(sendApplicationTelegram(application)).resolves.toEqual({ skipped: false });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("bottoken/sendMessage"),
      expect.objectContaining({ method: "POST" }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("denied", { status: 403 })));
    await expect(sendApplicationTelegram(application)).rejects.toThrow("Telegram API: 403 denied");
  });
});
