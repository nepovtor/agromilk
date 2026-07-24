import fp from "fastify-plugin";
import { env } from "../config/env.js";
import { ApiError, ValidationError } from "../lib/errors.js";

export const errorHandlerPlugin = fp(
  async (app) => {
    app.setErrorHandler((error, request, reply) => {
      if (error instanceof ApiError) {
        return reply.code(error.statusCode).send({
          error: error.code,
          message: error.message,
          ...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {}),
        });
      }

      request.log.error(error);
      if ((error as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          error: "FILE_TOO_LARGE",
          message: `Максимальный размер файла: ${Math.floor(env.MAX_UPLOAD_SIZE / 1024 / 1024)} МБ`,
        });
      }

      const typedError = error as { statusCode?: number; message?: string };
      const statusCode =
        typedError.statusCode && typedError.statusCode >= 400 ? typedError.statusCode : 500;
      return reply.code(statusCode).send({
        error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
        message:
          statusCode === 500 ? "Внутренняя ошибка сервера" : typedError.message || "Ошибка запроса",
      });
    });
  },
  { name: "error-handler" },
);
