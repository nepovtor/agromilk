import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import type { ProductInput, ProductStatus } from "@landing/shared";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";

type ProductListQuery = {
  page: number;
  pageSize: number;
  status?: ProductStatus;
  search?: string;
};

export class ProductRepository {
  async listPublished() {
    return db
      .select()
      .from(products)
      .where(eq(products.status, "published"))
      .orderBy(asc(products.sortOrder), desc(products.featured), asc(products.name));
  }

  async findPublishedBySlug(slug: string) {
    const [item] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.status, "published")))
      .limit(1);
    return item;
  }

  async list(query: ProductListQuery) {
    const conditions = [];
    if (query.status) conditions.push(eq(products.status, query.status));
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(ilike(products.name, term), ilike(products.category, term), ilike(products.slug, term))!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(asc(products.sortOrder), desc(products.updatedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(products).where(where),
    ]);
    return { items, totalItems: Number(totalRows[0]?.value ?? 0) };
  }

  async findById(id: string) {
    const [item] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return item;
  }

  async create(data: ProductInput) {
    const [created] = await db
      .insert(products)
      .values({ ...data, imageUrl: data.imageUrl || null })
      .returning();
    return created;
  }

  async update(id: string, data: Partial<ProductInput>) {
    const [updated] = await db
      .update(products)
      .set({
        ...data,
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return deleted;
  }
}
