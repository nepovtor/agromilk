import type { FastifyPluginAsync } from "fastify";
import { requireAdmin } from "../../lib/auth.js";
import { parseOrThrow } from "../../lib/http.js";
import {
  adminArticleListQuerySchema,
  articleInputSchema,
  articleUpdateSchema,
  idParamsSchema,
  publicArticleListQuerySchema,
  slugParamsSchema,
} from "./article.schemas.js";
import { ArticleService } from "./article.service.js";

const articleService = new ArticleService();

export const publicArticleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) =>
    articleService.publicList(parseOrThrow(publicArticleListQuerySchema, request.query)),
  );
  app.get("/:slug", async (request) => {
    const { slug } = parseOrThrow(slugParamsSchema, request.params);
    return articleService.publicGet(slug);
  });
};

export const adminArticleRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);
  app.get("/", async (request) =>
    articleService.adminList(parseOrThrow(adminArticleListQuerySchema, request.query)),
  );
  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return articleService.get(id);
  });
  app.post("/", async (request, reply) => {
    const data = parseOrThrow(articleInputSchema, request.body);
    const admin = request.admin;
    if (!admin)
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Требуется авторизация" });
    return reply.code(201).send(await articleService.create(data, admin.id));
  });
  app.patch("/:id", async (request) => {
    const data = parseOrThrow(articleUpdateSchema, request.body);
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return articleService.update(id, data);
  });
  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return articleService.delete(id);
  });
};
