import { analyticsApi } from "./analytics.api";
import { applicationsApi } from "./applications.api";
import { articlesApi } from "./articles.api";
import { assistantApi } from "./assistant.api";
import { authApi } from "./auth.api";
import { mediaApi } from "./media.api";
import { productsApi } from "./products.api";
import { statisticsApi } from "./statistics.api";

export const api = {
  auth: authApi,
  applications: applicationsApi,
  articles: articlesApi,
  products: productsApi,
  media: mediaApi,
  assistant: assistantApi,
  statistics: statisticsApi,
  analytics: analyticsApi,
};
