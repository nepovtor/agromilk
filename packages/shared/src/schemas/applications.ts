import { z } from "zod";
import { applicationStatuses } from "../constants/statuses.js";
import { dateSchema, pageSchema, searchSchema } from "./common.js";

export const applicationListQuerySchema = z.object({
  page: pageSchema,
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(applicationStatuses).optional(),
  search: searchSchema,
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sort: z.enum(["asc", "desc"]).optional(),
});

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
  website: z.string().max(0).optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(applicationStatuses).optional(),
  adminComment: z.string().max(5000).optional(),
});

export const bulkUpdateApplicationsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Выберите хотя бы одну заявку").max(100),
  status: z.enum(applicationStatuses),
});
