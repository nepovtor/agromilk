import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { hashToken } from "../../lib/auth.js";
import { AuthRepository } from "./auth.repository.js";
import { googleProfileSchema, googleTokenResponseSchema } from "./auth.schemas.js";

const DUMMY_PASSWORD_HASH = "$2b$12$PIHzo7P/mllN3Qv4FAWqC.3TldzaUWzX7jVz/GBORLeQqfu8apzY.";

export class AuthService {
  constructor(private readonly repository = new AuthRepository()) {}

  private googleCredentials() {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
      throw new Error("Google OAuth is not configured");
    return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  }

  async authenticate(email: string, password: string) {
    const admin = await this.repository.findActiveAdmin(email);
    const passwordMatches = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
    return admin && passwordMatches ? admin : undefined;
  }

  toPublicUser(admin: { id: string; email: string; name: string; role: string }) {
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
  }

  googleAuthorizationUrl(state: string, callbackUrl: string) {
    const { clientId } = this.googleCredentials();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async authenticateGoogle(code: string, callbackUrl: string) {
    const { clientId, clientSecret } = this.googleCredentials();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(env.GOOGLE_OAUTH_TIMEOUT_MS),
    });
    if (!tokenResponse.ok) throw new Error(`Google token endpoint returned ${tokenResponse.status}`);
    const token = googleTokenResponseSchema.parse(await tokenResponse.json());
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(env.GOOGLE_OAUTH_TIMEOUT_MS),
    });
    if (!profileResponse.ok) throw new Error(`Google profile endpoint returned ${profileResponse.status}`);
    const profile = googleProfileSchema.parse(await profileResponse.json());
    return this.repository.findActiveAdmin(profile.email);
  }

  logout(token: string) {
    return this.repository.deleteSession(hashToken(token));
  }
}
