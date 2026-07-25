import type { z } from "zod";
import { ValidationError } from "./errors.js";

export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw ValidationError.fromZod(parsed.error);
  return parsed.data;
}
