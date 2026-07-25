import type { z } from "zod";
import type {
  adminArticleListQuerySchema,
  articleInputSchema,
  articleUpdateSchema,
  publicArticleListQuerySchema,
} from "./article.schemas.js";

export type ArticleInput = z.output<typeof articleInputSchema>;
export type ArticleUpdate = z.output<typeof articleUpdateSchema>;
export type AdminArticleQuery = z.output<typeof adminArticleListQuerySchema>;
export type PublicArticleQuery = z.output<typeof publicArticleListQuerySchema>;
