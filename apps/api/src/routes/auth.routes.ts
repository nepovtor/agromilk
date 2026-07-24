import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { googleCallbackQuerySchema, loginSchema } from "@landing/shared";
import { env, useSecureCookies } from "../config/env.js";
import { db } from "../db/index.js";
import { admins, adminSessions } from "../db/schema.js";
import { createAdminSession, hashToken, requireAdmin, SESSION_COOKIE } from "../lib/auth.js";
import { parseOrThrow } from "../lib/http.js";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const googleCallbackUrl = `${env.APP_URL.replace(/\/$/, "")}/api/v1/auth/google/callback`;

function appRedirect(path: string) {
  return `${env.APP_ORIGIN.replace(/\/$/, "")}${path}`;
}

function redirectToLogin(reply: FastifyReply, error: string) {
  return reply.redirect(appRedirect(`/admin/login?google_error=${encodeURIComponent(error)}`));
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/login",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      const data = parseOrThrow(loginSchema, request.body);

      const email = data.email.toLowerCase();
      const [admin] = await db
        .select()
        .from(admins)
        .where(and(eq(admins.email, email), eq(admins.isActive, 1)))
        .limit(1);
      if (!admin || !(await bcrypt.compare(data.password, admin.passwordHash))) {
        return reply
          .code(401)
          .send({ error: "INVALID_CREDENTIALS", message: "Неверный email или пароль" });
      }

      await createAdminSession(admin.id, request, reply);

      return { user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } };
    },
  );

  app.get("/google/status", async () => ({ enabled: googleEnabled }));

  app.get(
    "/google",
    { config: { rateLimit: { max: 20, timeWindow: "15 minutes" } } },
    async (_request, reply) => {
      if (!googleEnabled)
        return reply
          .code(404)
          .send({ error: "GOOGLE_AUTH_DISABLED", message: "Вход через Google не настроен" });
      const state = randomBytes(32).toString("base64url");
      reply.setCookie(GOOGLE_STATE_COOKIE, state, {
        path: "/api/v1/auth/google/callback",
        httpOnly: true,
        secure: useSecureCookies,
        sameSite: "lax",
        signed: true,
        maxAge: 10 * 60,
      });
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        redirect_uri: googleCallbackUrl,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      });
      return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    },
  );

  app.get("/google/callback", async (request, reply) => {
    const clearState = () =>
      reply.clearCookie(GOOGLE_STATE_COOKIE, { path: "/api/v1/auth/google/callback" });
    const query = googleCallbackQuerySchema.safeParse(request.query);
    if (!googleEnabled) return redirectToLogin(clearState(), "not_configured");
    if (!query.success || query.data.error) return redirectToLogin(clearState(), "cancelled");
    const signedState = request.cookies[GOOGLE_STATE_COOKIE];
    const savedState = signedState ? request.unsignCookie(signedState) : null;
    if (
      !query.data.code ||
      !query.data.state ||
      !savedState?.valid ||
      savedState.value !== query.data.state
    ) {
      return redirectToLogin(clearState(), "invalid_state");
    }
    clearState();

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: query.data.code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: googleCallbackUrl,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok)
        throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
      const token = (await tokenResponse.json()) as { access_token?: string };
      if (!token.access_token) throw new Error("Google did not return an access token");
      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { authorization: `Bearer ${token.access_token}` },
      });
      if (!profileResponse.ok)
        throw new Error(`Google profile request failed: ${profileResponse.status}`);
      const profile = (await profileResponse.json()) as {
        email?: string;
        email_verified?: boolean;
      };
      if (!profile.email || profile.email_verified !== true)
        return redirectToLogin(reply, "email_not_verified");
      const email = profile.email.toLowerCase();
      const [admin] = await db
        .select()
        .from(admins)
        .where(and(eq(admins.email, email), eq(admins.isActive, 1)))
        .limit(1);
      if (!admin) return redirectToLogin(reply, "access_denied");
      await createAdminSession(admin.id, request, reply);
      return reply.redirect(appRedirect("/admin"));
    } catch (error) {
      request.log.error({ err: error }, "Google OAuth failed");
      return redirectToLogin(reply, "provider_error");
    }
  });

  app.get("/me", { preHandler: requireAdmin }, async (request) => ({ user: request.admin }));

  app.post("/logout", async (request, reply) => {
    const signed = request.cookies[SESSION_COOKIE];
    if (signed) {
      const unsigned = request.unsignCookie(signed);
      if (unsigned.valid && unsigned.value) {
        await db
          .delete(adminSessions)
          .where(eq(adminSessions.tokenHash, hashToken(unsigned.value)));
      }
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { success: true };
  });
};
