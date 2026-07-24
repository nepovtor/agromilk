import { productInputSchema } from "@landing/shared";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { sendValidationError } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";

function normalizeProduct<T extends { uses: unknown }>(product: T) {
  return {
    ...serializeDates(product),
    uses: Array.isArray(product.uses) ? product.uses.filter((item): item is string => typeof item === "string") : []
  };
}

export const publicProductRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const items = await db
      .select()
      .from(products)
      .where(eq(products.status, "published"))
      .orderBy(asc(products.sortOrder), desc(products.featured), asc(products.name));
    return { items: items.map(normalizeProduct) };
  });

  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [item] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.status, "published")))
      .limit(1);
    if (!item) return reply.code(404).send({ error: "NOT_FOUND", message: "Продукт не найден" });
    return normalizeProduct(item);
  });
};

export const adminProductRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const clauses = [];
    if (query.status && ["draft", "published", "archived"].includes(query.status)) {
      clauses.push(eq(products.status, query.status as "draft" | "published" | "archived"));
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      clauses.push(or(ilike(products.name, term), ilike(products.category, term), ilike(products.slug, term))!);
    }
    const where = clauses.length ? and(...clauses) : undefined;
    const [items, totalRows] = await Promise.all([
      db.select().from(products).where(where).orderBy(asc(products.sortOrder), desc(products.updatedAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ value: count() }).from(products).where(where)
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(normalizeProduct),
      pagination: { page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
    };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [item] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!item) return reply.code(404).send({ error: "NOT_FOUND", message: "Продукт не найден" });
    return normalizeProduct(item);
  });

  app.post("/", async (request, reply) => {
    const parsed = productInputSchema.safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    try {
      const [created] = await db.insert(products).values({
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null
      }).returning();
      return reply.code(201).send(normalizeProduct(created));
    } catch (error) {
      request.log.error(error);
      return reply.code(409).send({ error: "SLUG_CONFLICT", message: "Продукт с таким адресом уже существует" });
    }
  });

  app.patch("/:id", async (request, reply) => {
    const parsed = productInputSchema.partial().safeParse(request.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error);
    const { id } = request.params as { id: string };
    const [current] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    if (!current) return reply.code(404).send({ error: "NOT_FOUND", message: "Продукт не найден" });
    try {
      const [updated] = await db.update(products).set({
        ...parsed.data,
        ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl || null } : {}),
        updatedAt: new Date()
      }).where(eq(products.id, id)).returning();
      return normalizeProduct(updated);
    } catch (error) {
      request.log.error(error);
      return reply.code(409).send({ error: "SLUG_CONFLICT", message: "Продукт с таким адресом уже существует" });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (!deleted) return reply.code(404).send({ error: "NOT_FOUND", message: "Продукт не найден" });
    return { success: true };
  });
};
