import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { articleMedia, mediaFiles, products } from "../../db/schema.js";

type CreateMediaFile = typeof mediaFiles.$inferInsert;

export class MediaRepository {
  create(data: CreateMediaFile) {
    return db
      .insert(mediaFiles)
      .values(data)
      .returning()
      .then(([record]) => record);
  }

  async list() {
    return db.select().from(mediaFiles).orderBy(mediaFiles.createdAt);
  }

  findById(id: string) {
    return db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .limit(1)
      .then(([record]) => record);
  }

  async isReferenced(mediaId: string, url: string) {
    const [article, product] = await Promise.all([
      db
        .select({ id: articleMedia.articleId })
        .from(articleMedia)
        .where(eq(articleMedia.mediaId, mediaId))
        .limit(1),
      db.select({ id: products.id }).from(products).where(eq(products.imageUrl, url)).limit(1),
    ]);
    return Boolean(article[0] || product[0]);
  }

  delete(id: string) {
    return db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, id))
      .returning()
      .then(([record]) => record);
  }
}
