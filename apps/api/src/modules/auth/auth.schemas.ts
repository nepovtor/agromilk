import { z } from "zod";

export { googleCallbackQuerySchema, loginSchema } from "@agromilk/shared";
export const googleTokenResponseSchema = z.object({ access_token: z.string().min(1) });
export const googleProfileSchema = z.object({
  email: z.string().email(),
  email_verified: z.literal(true),
});
