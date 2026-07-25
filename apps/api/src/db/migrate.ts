import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

const lockName = "agromilk_migrations";
await pool.query("select pg_advisory_lock(hashtext($1))", [lockName]);
try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Миграции применены");
} finally {
  await pool.query("select pg_advisory_unlock(hashtext($1))", [lockName]);
  await pool.end();
}
