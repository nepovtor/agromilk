import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { idParamsSchema } from "@landing/shared";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { mediaFiles } from "../db/schema.js";
import { requireAdmin } from "../lib/auth.js";
import { NotFoundError } from "../lib/errors.js";
import { parseOrThrow } from "../lib/http.js";
import { serializeDates } from "../lib/serialize.js";

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.post("/", async (request, reply) => {
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
    await mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}.${detected.ext}`;
    await writeFile(path.join(uploadDir, storedName), buffer, { flag: "wx" });
    const url = `/uploads/${storedName}`;
    const [record] = await db
      .insert(mediaFiles)
      .values({
        originalName: part.filename.slice(0, 255),
        storedName,
        mimeType: detected.mime,
        size: buffer.length,
        url,
        uploadedBy: request.admin!.id,
      })
      .returning();
    return reply.code(201).send(serializeDates(record));
  });

  app.get("/", async () => {
    const items = await db.select().from(mediaFiles).orderBy(mediaFiles.createdAt);
    return { items: items.map(serializeDates) };
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    const [record] = await db.delete(mediaFiles).where(eq(mediaFiles.id, id)).returning();
    if (!record) throw new NotFoundError("Файл не найден");
    await unlink(path.join(uploadDir, record.storedName)).catch(() => undefined);
    return { success: true };
  });
};
