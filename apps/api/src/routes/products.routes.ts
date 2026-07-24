import {
  adminProductListQuerySchema,
  idParamsSchema,
  productInputSchema,
  slugParamsSchema,
} from "@landing/shared";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { ConflictError, isUniqueConstraintError, NotFoundError } from "../lib/errors.js";
import { parseOrThrow } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";

function normalizeProduct<T extends { uses: unknown }>(product: T) {
  return {
    ...serializeDates(product),
    uses: Array.isArray(product.uses)
      ? product.uses.filter((item): item is string => typeof item === "string")
      : [],
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

  app.get("/:slug", async (request) => {
    const { slug } = parseOrThrow(slugParamsSchema, request.params);
    const [item] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.status, "published")))
      .limit(1);
    if (!item) throw new NotFoundError("Продукт не найден");
    return normalizeProduct(item);
  });
};

export const adminProductRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = parseOrThrow(adminProductListQuerySchema, request.query);
    const { page, pageSize } = query;
    const clauses = [];
    if (query.status) clauses.push(eq(products.status, query.status));
    if (query.search) {
      const term = `%${query.search}%`;
      clauses.push(
        or(ilike(products.name, term), ilike(products.category, term), ilike(products.slug, term))!,
      );
    }
    const where = clauses.length ? and(...clauses) : undefined;
    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(asc(products.sortOrder), desc(products.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(products).where(where),
    ]);
    const totalItems = Number(totalRows[0]?.value ?? 0);
    return {
      items: items.map(normalizeProduct),
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
    const [item] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!item) throw new NotFoundError("Продукт не найден");
    return normalizeProduct(item);
  });

  app.post("/", async (request, reply) => {
    const data = parseOrThrow(productInputSchema, request.body);
    try {
      const [created] = await db
        .insert(products)
        .values({
          ...data,
          imageUrl: data.imageUrl || null,
        })
        .returning();
      return reply.code(201).send(normalizeProduct(created));
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Продукт с таким адресом уже существует");
      throw error;
    }
  });

  app.patch("/:id", async (request) => {
    const data = parseOrThrow(productInputSchema.partial(), request.body);
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [current] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!current) throw new NotFoundError("Продукт не найден");
    try {
      const [updated] = await db
        .update(products)
        .set({
          ...data,
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      return normalizeProduct(updated);
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Продукт с таким адресом уже существует");
      throw error;
    }
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    if (!deleted) throw new NotFoundError("Продукт не найден");
    return { success: true };
  });
};
