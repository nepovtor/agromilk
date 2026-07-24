import { z } from "zod";

export const pageSchema = z.coerce.number().int().min(1).default(1);
export const searchSchema = z.string().trim().min(1).max(200).optional();
export const dateSchema = z.iso.date();

export const idParamsSchema = z.object({ id: z.uuid() });
export const slugParamsSchema = z.object({ slug: z.string().trim().min(1).max(220) });

export const coverImageUrlSchema = z
  .string()
  .url()
  .or(
    z
      .string()
      .regex(
        /^\/(?:uploads|assets\/[A-Za-z0-9/_-]+)\/[A-Za-z0-9._-]+$/,
        "Некорректный путь к изображению",
      ),
  )
  .or(z.literal(""));
