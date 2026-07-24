import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  ssl:
    (env.DATABASE_SSL ?? (env.NODE_ENV === "production" && !env.DATABASE_URL.includes("localhost")))
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool, { schema });
