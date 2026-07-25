import type { admins } from "../../db/schema.js";

export type Admin = typeof admins.$inferSelect;
