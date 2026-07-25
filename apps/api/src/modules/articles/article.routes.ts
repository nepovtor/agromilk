import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import {
  adminArticleListQuerySchema,
  articleInputSchema,
  articleUpdateSchema,
  idParamsSchema,
  publicArticleListQuerySchema,
  slugParamsSchema,
} from "@agromilk/shared";
import { db } from "../../db/index.js";
import { articles } from "../../db/schema.js";
import { requireAdmin } from "../../lib/auth.js";
import {
  ConflictError,
  isUniqueConstraintError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors.js";
import { parseOrThrow } from "../../lib/http.js";
import { serializeDates } from "../../lib/serialize.js";
import { hasInvalidArticleEmbed, sanitizeArticleContent } from "./article-content.service.js";

export const publicArticleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const { page, pageSize } = parseOrThrow(publicArticleListQuerySchema, request.query);
    const where = eq(articles.status, "published");
    const [items, totalRows] = await Promise.all([
      db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          excerpt: articles.excerpt,
          coverImageUrl: articles.coverImageUrl,
          coverImageScale: articles.coverImageScale,
          coverImagePositionX: articles.coverImagePositionX,
          coverImagePositionY: articles.coverImagePositionY,
          publishedAt: articles.publishedAt,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
        })
        .from(articles)
        .where(where)
        .orderBy(desc(articles.publishedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(articles).where(where),
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(serializeDates),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  });

  app.get("/:slug", async (request) => {
    const { slug } = parseOrThrow(slugParamsSchema, request.params);
    const [item] = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1);
    if (!item) throw new NotFoundError("Инструкция не найдена");
    return serializeDates(item);
  });
};

export const adminArticleRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = parseOrThrow(adminArticleListQuerySchema, request.query);
    const { page, pageSize } = query;
    const conditions = [];
    if (query.status) conditions.push(eq(articles.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(or(ilike(articles.title, pattern), ilike(articles.slug, pattern))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(where)
        .orderBy(desc(articles.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(articles).where(where),
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(serializeDates),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  });

  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [item] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!item) throw new NotFoundError("Статья не найдена");
    return serializeDates(item);
  });

  app.post("/", async (request, reply) => {
    const data = parseOrThrow(articleInputSchema, request.body);
    if (hasInvalidArticleEmbed(data.content))
      throw new ValidationError("Разрешены только корректные YouTube-видео", {
        content: ["Разрешены только корректные YouTube-видео"],
      });
    const content = sanitizeArticleContent(data.content);
    try {
      const [created] = await db
        .insert(articles)
        .values({
          ...data,
          content,
          coverImageUrl: data.coverImageUrl || null,
          authorId: request.admin!.id,
          publishedAt: data.status === "published" ? new Date() : null,
        })
        .returning();
      return reply.code(201).send(serializeDates(created));
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Статья с таким адресом уже существует");
      throw error;
    }
  });

  app.patch("/:id", async (request) => {
    const data = parseOrThrow(articleUpdateSchema, request.body);
    if (data.content !== undefined && hasInvalidArticleEmbed(data.content))
      throw new ValidationError("Разрешены только корректные YouTube-видео", {
        content: ["Разрешены только корректные YouTube-видео"],
      });
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [current] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!current) throw new NotFoundError("Статья не найдена");
    const values = {
      ...data,
      ...(data.content !== undefined ? { content: sanitizeArticleContent(data.content) } : {}),
      ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl || null } : {}),
      ...(data.status === "published" && !current.publishedAt ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    };
    try {
      const [updated] = await db
        .update(articles)
        .set(values)
        .where(eq(articles.id, id))
        .returning();
      return serializeDates(updated);
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Статья с таким адресом уже существует");
      throw error;
    }
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [deleted] = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning({ id: articles.id });
    if (!deleted) throw new NotFoundError("Статья не найдена");
    return { success: true };
  });
};
