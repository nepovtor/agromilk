import type { z } from "zod";
import { applicationStatuses, articleStatuses, productStatuses } from "../constants/statuses.js";
import { analyticsEventSchema, statisticsRangeQuerySchema } from "../schemas/analytics.js";
import {
  applicationListQuerySchema,
  bulkUpdateApplicationsSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from "../schemas/applications.js";
import { articleInputSchema } from "../schemas/articles.js";
import { loginSchema } from "../schemas/auth.js";
import { productInputSchema } from "../schemas/products.js";

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type BulkUpdateApplicationsInput = z.infer<typeof bulkUpdateApplicationsSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
export type StatisticsRangeQuery = z.infer<typeof statisticsRangeQuerySchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ArticleStatus = (typeof articleStatuses)[number];
export type ProductStatus = (typeof productStatuses)[number];

export type AdminUser = { id: string; email: string; name: string; role: string };

export type ApplicationRecord = {
  id: string;
  visitorId: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: ApplicationStatus;
  sourcePage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  adminComment: string;
  createdAt: string;
  updatedAt: string;
};

export type ArticleRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageScale: number;
  coverImagePositionX: number;
  coverImagePositionY: number;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  uses: string[];
  composition: string;
  preparation: string;
  imageUrl: string | null;
  status: ProductStatus;
  sortOrder: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};

export type StatisticsSummary = {
  visitors: number;
  pageViews: number;
  applications: number;
  conversionRate: number;
};

export type StatisticsPoint = {
  date: string;
  visitors: number;
  pageViews: number;
  applications: number;
};
