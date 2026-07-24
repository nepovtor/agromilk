import { z } from "zod";
import { articleStatuses } from "../constants/statuses.js";
import { coverImageUrlSchema, pageSchema, searchSchema } from "./common.js";

export const publicArticleListQuerySchema = z.object({
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const adminArticleListQuerySchema = z.object({
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(articleStatuses).optional(),
  search: searchSchema,
});

const articleFields = {
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .pipe(
      z
        .string()
        .min(1)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug должен содержать латинские буквы, цифры и дефисы",
        )
        .max(220),
    ),
  excerpt: z.string().trim().max(500),
  content: z.string().max(200_000),
  coverImageUrl: coverImageUrlSchema,
  coverImageScale: z.coerce.number().int().min(40).max(100),
  coverImagePositionX: z.coerce.number().int().min(0).max(100),
  coverImagePositionY: z.coerce.number().int().min(0).max(100),
  status: z.enum(articleStatuses),
};

export const articleInputSchema = z.object({
  ...articleFields,
  excerpt: articleFields.excerpt.optional().default(""),
  coverImageUrl: articleFields.coverImageUrl.optional(),
  coverImageScale: articleFields.coverImageScale.default(100),
  coverImagePositionX: articleFields.coverImagePositionX.default(50),
  coverImagePositionY: articleFields.coverImagePositionY.default(50),
  status: articleFields.status.default("draft"),
});

export const articleUpdateSchema = z.object(articleFields).partial();
