import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { env, isProduction } from "./config/env.js";
import { apiRoutesPlugin } from "./plugins/api-routes.plugin.js";
import { cacheHeadersPlugin } from "./plugins/cache-headers.plugin.js";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin.js";
import { securityPlugin } from "./plugins/security.plugin.js";
import { uploadsPlugin } from "./plugins/uploads.plugin.js";
import { webStaticPlugin } from "./plugins/web-static.plugin.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: isProduction ? "info" : "debug",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.password",
          "req.body.token",
          "req.body.accessToken",
          "req.body.refreshToken",
          "req.body.smtpPassword",
        ],
        censor: "[REDACTED]",
      },
    },
    genReqId: () => randomUUID(),
    trustProxy: env.TRUST_PROXY,
    bodyLimit: 1_000_000,
  });
  app.decorateRequest("admin", null);
  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
    request.log.info({ requestId: request.id }, "Request received");
  });

  await app.register(errorHandlerPlugin);
  await app.register(securityPlugin);
  await app.register(cacheHeadersPlugin);
  await app.register(uploadsPlugin);
  await app.register(apiRoutesPlugin);
  await app.register(webStaticPlugin);

  return app;
}
