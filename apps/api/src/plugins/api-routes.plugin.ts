import { sql } from "drizzle-orm";
import fp from "fastify-plugin";
import { db } from "../db/index.js";
import { analyticsRoutes } from "../modules/analytics/analytics.routes.js";
import { adminApplicationRoutes, publicApplicationRoutes } from "../routes/applications.routes.js";
import { adminArticleRoutes, publicArticleRoutes } from "../modules/articles/article.routes.js";
import { assistantRoutes } from "../routes/assistant.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { mediaRoutes } from "../modules/media/media.routes.js";
import { adminProductRoutes, publicProductRoutes } from "../routes/products.routes.js";
import { statisticsRoutes } from "../modules/statistics/statistics.routes.js";

export const apiRoutesPlugin = fp(
  async (app) => {
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
  },
  { name: "api-routes" },
);
