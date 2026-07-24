import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

config({
  path: [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ],
  quiet: true,
});

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}, z.boolean());
const optionalSecret = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    DATABASE_SSL: booleanFromEnv.optional(),
    APP_URL: z.string().url().default("http://localhost:3000"),
    APP_ORIGIN: z.string().url().default("http://localhost:5173"),
    COOKIE_SECRET: z.string().min(32),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(14),
    GOOGLE_CLIENT_ID: optionalSecret,
    GOOGLE_CLIENT_SECRET: optionalSecret,
    ADMIN_EMAIL: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase())
      .default("admin@example.com"),
    ADMIN_PASSWORD: z
      .string()
      .min(12)
      .max(200)
      .regex(/[a-z]/, "нужна строчная буква")
      .regex(/[A-Z]/, "нужна заглавная буква")
      .regex(/\d/, "нужна цифра")
      .regex(/[^A-Za-z0-9]/, "нужен специальный символ")
      .default("ChangeMe123!"),
    ADMIN_NAME: z.string().default("Администратор"),
    ADMIN_FORCE_RESET: booleanFromEnv.default(false),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: booleanFromEnv.default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    MAIL_TO: z.string().email().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    UPLOAD_DIR: z.string().default("uploads"),
    MAX_UPLOAD_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .max(25 * 1024 * 1024)
      .default(5 * 1024 * 1024),
    TRUST_PROXY: booleanFromEnv.default(true),
    OLLAMA_URL: z.string().url().default("http://127.0.0.1:11434"),
    OLLAMA_MODEL: z.string().min(1).default("qwen2.5:3b"),
  })
  .superRefine((value, context) => {
    if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET))
      context.addIssue({
        code: "custom",
        path: [value.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
        message: "для Google OAuth необходимо задать GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET вместе",
      });
    if (value.NODE_ENV !== "production") return;
    if (value.ADMIN_PASSWORD === "ChangeMe123!")
      context.addIssue({
        code: "custom",
        path: ["ADMIN_PASSWORD"],
        message: "стандартный пароль запрещён в production",
      });
    if (value.COOKIE_SECRET === "replace-with-at-least-32-random-characters")
      context.addIssue({
        code: "custom",
        path: ["COOKIE_SECRET"],
        message: "задайте случайный production-секрет",
      });
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "Некорректные переменные окружения:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const useSecureCookies = isProduction && env.APP_URL.startsWith("https://");
