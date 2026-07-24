import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { articleInputSchema, articleUpdateSchema } from "@landing/shared";
import { db } from "../db/index.js";
import { articles } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { sendValidationError } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";
import { hasInvalidArticleEmbed, sanitizeArticleContent } from "../services/article.service.js";

export const publicArticleRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 12));
    const where = eq(articles.status, "published");
    const [items, totalRows] = await Promise.all([
      db.select({
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
        updatedAt: articles.updatedAt
      }).from(articles).where(where).orderBy(desc(articles.publishedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ value: count() }).from(articles).where(where)
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(serializeDates),
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
    };
  });

  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [item] = await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).limit(1);
    if (!item) return reply.code(404).send({ error: "NOT_FOUND", message: "Инструкция не найдена" });
    return serializeDates(item);
  });
};

export const adminArticleRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const conditions = [];
    if (query.status) conditions.push(eq(articles.status, query.status as "draft" | "published" | "archived"));
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(or(ilike(articles.title, pattern), ilike(articles.slug, pattern))!);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, totalRows] = await Promise.all([
      db.select().from(articles).where(where).orderBy(desc(articles.updatedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ value: count() }).from(articles).where(where)
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(serializeDates),
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
    };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [item] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!item) return reply.code(404).send({ error: "NOT_FOUND" });
    return serializeDates(item);
  });

  app.post("/", async (request, reply) => {
    const parsed = articleInputSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    if (hasInvalidArticleEmbed(parsed.data.content)) return reply.code(400).send({ error: "INVALID_YOUTUBE_EMBED", message: "Разрешены только корректные YouTube-видео" });
    const content = sanitizeArticleContent(parsed.data.content);
    try {
      const [created] = await db.insert(articles).values({
        ...parsed.data,
        content,
        coverImageUrl: parsed.data.coverImageUrl || null,
        authorId: request.admin!.id,
        publishedAt: parsed.data.status === "published" ? new Date() : null
      }).returning();
      return reply.code(201).send(serializeDates(created));
    } catch (error) {
      request.log.error(error);
      return reply.code(409).send({ error: "SLUG_CONFLICT", message: "Статья с таким адресом уже существует" });
    }
  });

  app.patch("/:id", async (request, reply) => {
    const parsed = articleUpdateSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    if (parsed.data.content !== undefined && hasInvalidArticleEmbed(parsed.data.content)) return reply.code(400).send({ error: "INVALID_YOUTUBE_EMBED", message: "Разрешены только корректные YouTube-видео" });
    const { id } = request.params as { id: string };
    const [current] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!current) return reply.code(404).send({ error: "NOT_FOUND" });
    const values = {
      ...parsed.data,
      ...(parsed.data.content !== undefined ? { content: sanitizeArticleContent(parsed.data.content) } : {}),
      ...(parsed.data.coverImageUrl !== undefined ? { coverImageUrl: parsed.data.coverImageUrl || null } : {}),
      ...(parsed.data.status === "published" && !current.publishedAt ? { publishedAt: new Date() } : {}),
      updatedAt: new Date()
    };
    try {
      const [updated] = await db.update(articles).set(values).where(eq(articles.id, id)).returning();
      return serializeDates(updated);
    } catch (error) {
      request.log.error(error);
      return reply.code(409).send({ error: "SLUG_CONFLICT", message: "Статья с таким адресом уже существует" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [deleted] = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id });
    if (!deleted) return reply.code(404).send({ error: "NOT_FOUND" });
    return { success: true };
  });
};
