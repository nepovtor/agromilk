import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env, useSecureCookies } from "../config/env.js";
import { db } from "../db/index.js";
import { admins, adminSessions } from "../db/schema.js";
import { getClientIp } from "./http.js";

export const SESSION_COOKIE = "admin_session";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createAdminSession(
  adminId: string,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({
    adminId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: getClientIp(request.headers, request.ip),
    userAgent: request.headers["user-agent"],
  });
  await db
    .update(admins)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(admins.id, adminId));
  reply.setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    signed: true,
    expires: expiresAt,
  });
}

async function resolveAdmin(request: FastifyRequest) {
  const signed = request.cookies[SESSION_COOKIE];
  if (!signed) return null;
  const unsigned = request.unsignCookie(signed);
  if (!unsigned.valid || !unsigned.value) return null;

  const tokenHash = hashToken(unsigned.value);
  const [row] = await db
    .select({
      id: admins.id,
      email: admins.email,
      name: admins.name,
      role: admins.role,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gt(adminSessions.expiresAt, new Date()),
        eq(admins.isActive, 1),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const admin = await resolveAdmin(request);
  if (!admin)
    return reply.code(401).send({ error: "UNAUTHORIZED", message: "Требуется авторизация" });
  request.admin = admin;
}
