import { fileTypeFromBuffer } from "file-type";
import type { FastifyPluginAsync } from "fastify";
import { idParamsSchema } from "@agromilk/shared";
import { env } from "../../config/env.js";
import { requireAdmin } from "../../lib/auth.js";
import { parseOrThrow } from "../../lib/http.js";
import { MediaService } from "./media.service.js";
import { validateImageDimensions } from "./image-dimensions.js";

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const mediaService = new MediaService();

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.post("/", async (request, reply) => {
    const admin = request.admin;
    if (!admin)
      return reply.code(401).send({ error: "UNAUTHORIZED", message: "Требуется авторизация" });
    const part = await request.file({ limits: { fileSize: env.MAX_UPLOAD_SIZE, files: 1 } });
    if (!part)
      return reply.code(400).send({ error: "FILE_REQUIRED", message: "Выберите изображение" });
    const buffer = await part.toBuffer();
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !allowedMime.has(detected.mime)) {
      return reply
        .code(400)
        .send({ error: "INVALID_FILE", message: "Разрешены JPG, PNG, WebP и GIF" });
    }
    validateImageDimensions(buffer, detected.mime);
    const record = await mediaService.upload(
      {
        buffer,
        extension: detected.ext,
        mimeType: detected.mime,
        originalName: part.filename,
        uploadedBy: admin.id,
      },
      request.log,
    );
    return reply.code(201).send(record);
  });

  app.get("/", async () => mediaService.list());

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return mediaService.delete(id, request.log);
  });
};
