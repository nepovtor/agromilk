import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { articleMedia, articles, mediaFiles } from "../../db/schema.js";
import type { AdminArticleQuery, PublicArticleQuery } from "./article.types.js";

export class ArticleRepository {
  async publicList(query: PublicArticleQuery) {
    const where = eq(articles.status, "published");
    const [items, total] = await Promise.all([
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
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(articles).where(where),
    ]);
    return { items, total: Number(total[0]?.value ?? 0) };
  }

  publicGet(slug: string) {
    return db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .limit(1)
      .then(([item]) => item);
  }

  async adminList(query: AdminArticleQuery) {
    const conditions = [];
    if (query.status) conditions.push(eq(articles.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      const searchCondition = or(ilike(articles.title, pattern), ilike(articles.slug, pattern));
      if (searchCondition) conditions.push(searchCondition);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, total] = await Promise.all([
      db
        .select()
        .from(articles)
        .where(where)
        .orderBy(desc(articles.updatedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(articles).where(where),
    ]);
    return { items, total: Number(total[0]?.value ?? 0) };
  }

  findById(id: string) {
    return db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1)
      .then(([item]) => item);
  }

  create(values: typeof articles.$inferInsert) {
    return db
      .insert(articles)
      .values(values)
      .returning()
      .then(([item]) => item);
  }

  async mediaIdsForUrls(urls: string[]) {
    if (!urls.length) return [];
    return db
      .select({ id: mediaFiles.id, url: mediaFiles.url })
      .from(mediaFiles)
      .where(inArray(mediaFiles.url, urls));
  }

  listForMediaBackfill() {
    return db.select({ id: articles.id, content: articles.content }).from(articles);
  }

  async addContentMediaRelations(articleId: string, mediaIds: string[]) {
    if (!mediaIds.length) return 0;
    const inserted = await db
      .insert(articleMedia)
      .values(mediaIds.map((mediaId) => ({ articleId, mediaId, usageType: "content" })))
      .onConflictDoNothing()
      .returning({ mediaId: articleMedia.mediaId });
    return inserted.length;
  }

  async createWithMedia(
    values: typeof articles.$inferInsert,
    media: Array<{ id: string; usageType: "cover" | "content" }>,
  ) {
    return db.transaction(async (tx) => {
      const [item] = await tx.insert(articles).values(values).returning();
      if (media.length)
        await tx
          .insert(articleMedia)
          .values(
            media.map((itemMedia) => ({
              articleId: item.id,
              mediaId: itemMedia.id,
              usageType: itemMedia.usageType,
            })),
          )
          .onConflictDoNothing();
      return item;
    });
  }

  update(id: string, values: Partial<typeof articles.$inferInsert>) {
    return db
      .update(articles)
      .set(values)
      .where(eq(articles.id, id))
      .returning()
      .then(([item]) => item);
  }

  async updateWithMedia(
    id: string,
    values: Partial<typeof articles.$inferInsert>,
    media: Array<{ id: string; usageType: "cover" | "content" }>,
  ) {
    return db.transaction(async (tx) => {
      const [item] = await tx.update(articles).set(values).where(eq(articles.id, id)).returning();
      if (!item) return item;
      await tx.delete(articleMedia).where(eq(articleMedia.articleId, id));
      if (media.length)
        await tx
          .insert(articleMedia)
          .values(
            media.map((itemMedia) => ({
              articleId: id,
              mediaId: itemMedia.id,
              usageType: itemMedia.usageType,
            })),
          )
          .onConflictDoNothing();
      return item;
    });
  }

  delete(id: string) {
    return db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning({ id: articles.id })
      .then(([item]) => item);
  }
}
