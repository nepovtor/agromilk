import { z } from "zod";

z.config({ jitless: true });

export * from "./constants/statuses.js";
export * from "./schemas/analytics.js";
export * from "./schemas/applications.js";
export * from "./schemas/articles.js";
export * from "./schemas/auth.js";
export * from "./schemas/common.js";
export * from "./schemas/products.js";
export type * from "./types/domain.js";
