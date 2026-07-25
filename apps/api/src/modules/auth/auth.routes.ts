import { randomBytes } from "node:crypto";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { env, useSecureCookies } from "../../config/env.js";
import { createAdminSession, requireAdmin, SESSION_COOKIE } from "../../lib/auth.js";
import { parseOrThrow } from "../../lib/http.js";
import { googleCallbackQuerySchema, loginSchema } from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const googleCallbackUrl = `${env.APP_URL.replace(/\/$/, "")}/api/v1/auth/google/callback`;
const authService = new AuthService();

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
      const admin = await authService.authenticate(data.email, data.password);
      if (!admin)
        return reply
          .code(401)
          .send({ error: "INVALID_CREDENTIALS", message: "Неверный email или пароль" });
      await createAdminSession(admin.id, request, reply);
      return { user: authService.toPublicUser(admin) };
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
      return reply.redirect(authService.googleAuthorizationUrl(state, googleCallbackUrl));
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
    )
      return redirectToLogin(clearState(), "invalid_state");
    clearState();

    try {
      const admin = await authService.authenticateGoogle(query.data.code, googleCallbackUrl);
      if (!admin) return redirectToLogin(reply, "access_denied");
      await createAdminSession(admin.id, request, reply);
      return reply.redirect(appRedirect("/admin"));
    } catch (error) {
      request.log.error(
        {
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { name: "UnknownError" },
        },
        "Google OAuth failed",
      );
      return redirectToLogin(reply, "provider_error");
    }
  });

  app.get("/me", { preHandler: requireAdmin }, async (request) => ({ user: request.admin }));

  app.post("/logout", async (request, reply) => {
    const signed = request.cookies[SESSION_COOKIE];
    if (signed) {
      const unsigned = request.unsignCookie(signed);
      if (unsigned.valid && unsigned.value) await authService.logout(unsigned.value);
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { success: true };
  });
};
