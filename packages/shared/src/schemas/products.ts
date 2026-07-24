import { z } from "zod";
import { productStatuses } from "../constants/statuses.js";
import { coverImageUrlSchema, pageSchema, searchSchema } from "./common.js";

export const adminProductListQuerySchema = z.object({
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(productStatuses).optional(),
  search: searchSchema,
});

export const productInputSchema = z.object({
  name: z.string().trim().min(3, "Укажите название").max(200),
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
  category: z.string().trim().max(120).optional().default("Заменители молока"),
  description: z.string().trim().min(20, "Добавьте описание").max(5000),
  uses: z
    .array(z.string().trim().min(2).max(500))
    .min(1, "Добавьте хотя бы один вариант применения")
    .max(10),
  composition: z.string().trim().max(5000).optional().default(""),
  preparation: z.string().trim().max(5000).optional().default(""),
  imageUrl: coverImageUrlSchema.optional(),
  status: z.enum(productStatuses).default("draft"),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
  featured: z.boolean().default(false),
});
