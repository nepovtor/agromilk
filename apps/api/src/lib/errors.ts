import type { ZodError } from "zod";

type ValidationFields = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Ресурс не найден") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Ресурс уже существует") {
    super(message, 409, "CONFLICT");
  }
}

export class LimitExceededError extends ApiError {
  constructor(message: string) {
    super(message, 413, "LIMIT_EXCEEDED");
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = "Проверьте введённые данные",
    public readonly fields?: ValidationFields,
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }

  static fromZod(error: ZodError) {
    return new ValidationError(undefined, error.flatten().fieldErrors);
  }
}

export class ConversionInvariantError extends Error {
  constructor(
    public readonly visitors: number,
    public readonly convertedVisitors: number,
  ) {
    super("Количество сконвертированных посетителей не может превышать количество посетителей");
    this.name = "ConversionInvariantError";
  }
}

export function isUniqueConstraintError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === "23505") return true;
  return isUniqueConstraintError(candidate.cause);
}
