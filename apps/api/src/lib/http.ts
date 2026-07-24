import type { FastifyReply } from "fastify";
import type { ZodError } from "zod";

export function sendValidationError(reply: FastifyReply, error: ZodError) {
  return reply.code(400).send({
    error: "VALIDATION_ERROR",
    message: "Проверьте введённые данные",
    fields: error.flatten().fieldErrors
  });
}

export function getClientIp(headers: Record<string, unknown>, fallback: string) {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || fallback;
  return fallback;
}
