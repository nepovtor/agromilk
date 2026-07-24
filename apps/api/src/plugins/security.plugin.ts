import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import { env, isProduction, useSecureCookies } from "../config/env.js";

export const securityPlugin = fp(
  async (app) => {
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
  },
  { name: "security" },
);
