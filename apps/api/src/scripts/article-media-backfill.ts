import { pool } from "../db/index.js";
import { backfillArticleMedia } from "../modules/articles/article-media-backfill.service.js";

try {
  const result = await backfillArticleMedia();
  console.log(
    `Article media backfill: scanned ${result.articlesScanned} article(s), created ${result.relationsCreated} relation(s)`,
  );
} catch (error) {
  console.error("Article media backfill failed", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
