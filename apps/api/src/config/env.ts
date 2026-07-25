import path from "node:path";
import { isIP } from "node:net";
import { config } from "dotenv";
import { z } from "zod";

config({
  path: [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "../../.env")],
  quiet: true,
});

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}, z.boolean());
const optionalSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

function isProxyAddress(value: string) {
  const [address, prefix, ...extra] = value.split("/");
  const version = isIP(address);
  if (!version || extra.length) return false;
  if (prefix === undefined) return true;
  const prefixLength = Number(prefix);
  return (
    Number.isInteger(prefixLength) &&
    prefixLength >= 0 &&
    prefixLength <= (version === 4 ? 32 : 128)
  );
}

const trustProxyFromEnv = z.preprocess(
  (value) => {
    if (value === undefined || value === "" || value === false || value === "false") return false;
    if (typeof value !== "string") return value;
    if (["1", "true", "yes", "on"].includes(value.toLowerCase())) return true;
    const proxies = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return proxies.length === 1 ? proxies[0] : proxies;
  },
  z.union([
    z.literal(false),
    z.string().refine(isProxyAddress, "Укажите IP-адрес или CIDR доверенного proxy"),
    z
      .array(z.string().refine(isProxyAddress, "Укажите IP-адрес или CIDR доверенного proxy"))
      .min(1),
  ]),
);
const timeZoneSchema = z
  .string()
  .default("Europe/Minsk")
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Некорректный часовой пояс");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
    GOOGLE_OAUTH_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),
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
    MAX_IMAGE_WIDTH: z.coerce.number().int().positive().max(20000).default(8000),
    MAX_IMAGE_HEIGHT: z.coerce.number().int().positive().max(20000).default(8000),
    MAX_IMAGE_PIXELS: z.coerce.number().int().positive().max(100_000_000).default(40_000_000),
    CSV_EXPORT_LIMIT: z.coerce.number().int().positive().max(100_000).default(10_000),
    BUSINESS_TIME_ZONE: timeZoneSchema,
    TRUST_PROXY: trustProxyFromEnv.default(false),
    OLLAMA_URL: z.string().url().default("http://127.0.0.1:11434"),
    OLLAMA_MODEL: z.string().min(1).default("qwen2.5:3b"),
  })
  .superRefine((value, context) => {
    if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET))
      context.addIssue({
        code: "custom",
        path: [value.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
        message:
          "для Google OAuth необходимо задать GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET вместе",
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
  console.error("Некорректные переменные окружения:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
export const useSecureCookies = isProduction && env.APP_URL.startsWith("https://");
