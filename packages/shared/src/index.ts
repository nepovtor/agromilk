import { z } from "zod";

z.config({ jitless: true });

export const applicationStatuses = ["new", "viewed", "in_progress", "completed", "rejected"] as const;
export const articleStatuses = ["draft", "published", "archived"] as const;
export const productStatuses = ["draft", "published", "archived"] as const;

const coverImageUrlSchema = z
  .string()
  .url()
  .or(z.string().regex(/^\/(?:uploads|assets\/[A-Za-z0-9/_-]+)\/[A-Za-z0-9._-]+$/, "Некорректный путь к изображению"))
  .or(z.literal(""));

export const createApplicationSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(100),
  phone: z.string().trim().min(7, "Укажите телефон").max(30),
  email: z.string().trim().email("Некорректный email").optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional(),
  consent: z.literal(true, { error: "Требуется согласие на обработку данных" }),
  sourcePage: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  website: z.string().max(0).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200)
});

export const updateApplicationSchema = z.object({
  status: z.enum(applicationStatuses).optional(),
  adminComment: z.string().max(5000).optional()
});

export const bulkUpdateApplicationsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Выберите хотя бы одну заявку").max(100),
  status: z.enum(applicationStatuses)
});

export const productInputSchema = z.object({
  name: z.string().trim().min(3, "Укажите название").max(200),
  slug: z.string().trim().toLowerCase().transform((value) => value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).pipe(z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug должен содержать латинские буквы, цифры и дефисы").max(220)),
  category: z.string().trim().max(120).optional().default("Заменители молока"),
  description: z.string().trim().min(20, "Добавьте описание").max(5000),
  uses: z.array(z.string().trim().min(2).max(500)).min(1, "Добавьте хотя бы один вариант применения").max(10),
  composition: z.string().trim().max(5000).optional().default(""),
  preparation: z.string().trim().max(5000).optional().default(""),
  imageUrl: coverImageUrlSchema.optional(),
  status: z.enum(productStatuses).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  featured: z.boolean().default(false)
});

const articleFields = {
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().toLowerCase().transform((value) => value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).pipe(z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug должен содержать латинские буквы, цифры и дефисы").max(220)),
  excerpt: z.string().trim().max(500),
  content: z.string().max(200_000),
  coverImageUrl: coverImageUrlSchema,
  coverImageScale: z.coerce.number().int().min(40).max(100),
  coverImagePositionX: z.coerce.number().int().min(0).max(100),
  coverImagePositionY: z.coerce.number().int().min(0).max(100),
  status: z.enum(articleStatuses)
};

export const articleInputSchema = z.object({
  ...articleFields,
  excerpt: articleFields.excerpt.optional().default(""),
  coverImageUrl: articleFields.coverImageUrl.optional(),
  coverImageScale: articleFields.coverImageScale.default(100),
  coverImagePositionX: articleFields.coverImagePositionX.default(50),
  coverImagePositionY: articleFields.coverImagePositionY.default(50),
  status: articleFields.status.default("draft")
});
export const articleUpdateSchema = z.object(articleFields).partial();

export const analyticsEventSchema = z.object({
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view"]),
  pagePath: z.string().max(500),
  referrer: z.string().max(1000).optional().default(""),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional()
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type BulkUpdateApplicationsInput = z.infer<typeof bulkUpdateApplicationsSchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type ArticleStatus = (typeof articleStatuses)[number];
export type ProductStatus = (typeof productStatuses)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type ApplicationRecord = {
  id: string;
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
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
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
