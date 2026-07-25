import "fastify";
import type { AdminUser } from "@agromilk/shared";

declare module "fastify" {
  interface FastifyRequest {
    admin: AdminUser | null;
  }
}
