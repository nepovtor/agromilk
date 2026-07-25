import { articleContentMediaUrls, sanitizeArticleContent } from "./article-content.service.js";
import { ArticleRepository } from "./article.repository.js";

export async function backfillArticleMedia(repository = new ArticleRepository()) {
  const articles = await repository.listForMediaBackfill();
  let relationsCreated = 0;
  for (const article of articles) {
    const urls = articleContentMediaUrls(sanitizeArticleContent(article.content));
    const media = await repository.mediaIdsForUrls(urls);
    relationsCreated += await repository.addContentMediaRelations(
      article.id,
      media.map((item) => item.id),
    );
  }
  return { articlesScanned: articles.length, relationsCreated };
}
