import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type { InferSelectModel } from "drizzle-orm";
import type { applications } from "../db/schema.js";

type Application = InferSelectModel<typeof applications>;

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[char] ?? char,
  );
}

function applicationText(application: Application) {
  return [
    `Новая заявка №${application.id}`,
    `Имя: ${application.name}`,
    `Телефон: ${application.phone}`,
    `Email: ${application.email || "не указан"}`,
    `Сообщение: ${application.message || "не указано"}`,
    `Источник: ${application.sourcePage || "не указан"}`,
    `UTM: source=${application.utmSource || "—"}, medium=${application.utmMedium || "—"}, campaign=${application.utmCampaign || "—"}`,
    `Админ-панель: ${env.APP_URL}/admin/applications/${application.id}`,
    `Дата: ${application.createdAt.toISOString()}`,
  ].join("\n");
}

export async function sendApplicationEmail(application: Application) {
  if (!transporter || !env.MAIL_TO) return { skipped: true };
  const text = applicationText(application);
  await transporter.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to: env.MAIL_TO,
    subject: `Новая заявка: ${application.name}`,
    text,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.55"><h2>Новая заявка</h2><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(text)}</pre></div>`,
  });
  return { skipped: false };
}

export async function sendApplicationTelegram(application: Application) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)
    return { skipped: true };
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: applicationText(application).slice(0, 4000),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Telegram API: ${response.status} ${await response.text()}`,
    );
  return { skipped: false };
}
