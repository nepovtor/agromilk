import bcrypt from "bcryptjs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { buildApp } from "../app.js";
import { db } from "../db/index.js";
import {
  admins,
  adminSessions,
  analyticsEvents,
  applications,
  articles,
  mediaFiles,
  products,
} from "../db/schema.js";

const adminEmail = "admin@example.com";
const adminPassword = "TestPassword123!";

export async function createApiContext() {
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.delete(adminSessions);
  await db.delete(analyticsEvents);
  await db.delete(applications);
  await db.delete(articles);
  await db.delete(products);
  await db.delete(mediaFiles);
  await db.delete(admins);
  await db.insert(admins).values({
    email: adminEmail,
    name: "Test Admin",
    passwordHash: await bcrypt.hash(adminPassword, 4),
  });
  const app = await buildApp();
  await app.ready();
  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: adminEmail, password: adminPassword },
  });
  const setCookie = login.headers["set-cookie"];
  const cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie)?.split(";")[0] ?? "";
  return { app, cookie, adminEmail, adminPassword };
}
