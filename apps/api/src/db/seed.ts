import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db, pool } from "./index.js";
import { admins } from "./schema.js";

const email = env.ADMIN_EMAIL;
const [existing] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

if (existing && env.ADMIN_FORCE_RESET) {
  await db.update(admins).set({ passwordHash, name: env.ADMIN_NAME, isActive: 1, updatedAt: new Date() }).where(eq(admins.id, existing.id));
  console.log(`Пароль администратора ${email} обновлён`);
} else if (existing) {
  console.log(`Администратор ${email} уже существует`);
} else {
  await db.insert(admins).values({ email, passwordHash, name: env.ADMIN_NAME });
  console.log(`Администратор ${email} создан`);
}

await pool.end();
