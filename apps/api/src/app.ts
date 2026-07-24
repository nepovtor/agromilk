import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { sql } from "drizzle-orm";
import { env, isProduction, useSecureCookies } from "./config/env.js";
import { db } from "./db/index.js";
import { ApiError, ValidationError } from "./lib/errors.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";
import { adminApplicationRoutes, publicApplicationRoutes } from "./routes/applications.routes.js";
import { adminArticleRoutes, publicArticleRoutes } from "./routes/articles.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { mediaRoutes } from "./routes/media.routes.js";
import { statisticsRoutes } from "./routes/statistics.routes.js";
import { assistantRoutes } from "./routes/assistant.routes.js";
import { adminProductRoutes, publicProductRoutes } from "./routes/products.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: { level: isProduction ? "info" : "debug" },
    trustProxy: env.TRUST_PROXY,
    bodyLimit: 1_000_000,
  });
  app.decorateRequest("admin", null);

  await app.register(helmet, {
    contentSecurityPolicy: useSecureCookies
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  });
  if (!isProduction) await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie, { secret: env.COOKIE_SECRET, hook: "onRequest" });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_SIZE, files: 1 } });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        ...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {}),
      });
    }

    request.log.error(error);
    if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
      return reply.code(413).send({
        error: "FILE_TOO_LARGE",
        message: `Максимальный размер файла: ${Math.floor(env.MAX_UPLOAD_SIZE / 1024 / 1024)} МБ`,
      });
    }
    const typedError = error as { statusCode?: number; message?: string };
    const statusCode =
      typedError.statusCode && typedError.statusCode >= 400 ? typedError.statusCode : 500;
    return reply.code(statusCode).send({
      error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
      message:
        statusCode === 500 ? "Внутренняя ошибка сервера" : typedError.message || "Ошибка запроса",
    });
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const requestPath = request.url.split("?", 1)[0] || "/";
    const contentType = String(reply.getHeader("content-type") || "");

    if (contentType.includes("text/html")) {
      reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");
    } else if (requestPath.startsWith("/assets/") && reply.statusCode < 400) {
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
    }

    return payload;
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!isProduction || ["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
    const origin = request.headers.origin;
    const sameRequestHost =
      origin &&
      (() => {
        try {
          return new URL(origin).host === request.headers.host;
        } catch {
          return false;
        }
      })();
    if (origin && !sameRequestHost && origin !== env.APP_ORIGIN && origin !== env.APP_URL) {
      return reply
        .code(403)
        .send({ error: "INVALID_ORIGIN", message: "Источник запроса не разрешён" });
    }
  });

  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  mkdirSync(uploadDir, { recursive: true });
  await app.register(fastifyStatic, { root: uploadDir, prefix: "/uploads/", decorateReply: false });

  app.get("/api/v1/health", async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: "ok", database: "ok", time: new Date().toISOString() };
    } catch {
      return reply
        .code(503)
        .send({ status: "error", database: "unavailable", time: new Date().toISOString() });
    }
  });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(publicApplicationRoutes, { prefix: "/api/v1/applications" });
  await app.register(publicArticleRoutes, { prefix: "/api/v1/articles" });
  await app.register(publicProductRoutes, { prefix: "/api/v1/products" });
  await app.register(analyticsRoutes, { prefix: "/api/v1/analytics" });
  await app.register(adminApplicationRoutes, { prefix: "/api/v1/admin/applications" });
  await app.register(adminArticleRoutes, { prefix: "/api/v1/admin/articles" });
  await app.register(adminProductRoutes, { prefix: "/api/v1/admin/products" });
  await app.register(mediaRoutes, { prefix: "/api/v1/admin/media" });
  await app.register(statisticsRoutes, { prefix: "/api/v1/admin/statistics" });
  await app.register(assistantRoutes, { prefix: "/api/v1/admin/assistant" });

  const webDist = path.resolve(process.cwd(), process.env.WEB_DIST_PATH || "../web/dist");
  if (existsSync(path.join(webDist, "index.html"))) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
      decorateReply: true,
      wildcard: false,
    });
    app.setNotFoundHandler((request, reply) => {
      const requestPath = request.url.split("?", 1)[0] || "/";
      const isStaticFile =
        requestPath.startsWith("/assets/") || /\.[a-z0-9]{1,8}$/i.test(requestPath);

      if (requestPath.startsWith("/api/") || requestPath.startsWith("/uploads/") || isStaticFile) {
        return reply.code(404).send({ error: "NOT_FOUND" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}
