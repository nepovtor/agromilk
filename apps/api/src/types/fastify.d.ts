import "fastify";
import type { AdminUser } from "@landing/shared";

declare module "fastify" {
  interface FastifyRequest {
    admin: AdminUser | null;
  }
}
