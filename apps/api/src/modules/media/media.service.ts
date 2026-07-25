import { randomUUID } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import { ConflictError, NotFoundError } from "../../lib/errors.js";
import { serializeDates } from "../../lib/serialize.js";
import { MediaRepository } from "./media.repository.js";
import { MediaStorage } from "./media.storage.js";

type UploadMediaInput = {
  buffer: Buffer;
  extension: string;
  mimeType: string;
  originalName: string;
  uploadedBy: string;
};

function isMissingFile(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

export class MediaService {
  constructor(
    private readonly repository = new MediaRepository(),
    private readonly storage = new MediaStorage(),
  ) {}

  async upload(input: UploadMediaInput, logger: FastifyBaseLogger) {
    const storedName = `${randomUUID()}.${input.extension}`;
    await this.storage.write(storedName, input.buffer);
    try {
      const record = await this.repository.create({
        originalName: input.originalName.slice(0, 255),
        storedName,
        mimeType: input.mimeType,
        size: input.buffer.length,
        url: `/uploads/${storedName}`,
        uploadedBy: input.uploadedBy,
      });
      return serializeDates(record);
    } catch (error) {
      await this.storage.remove(storedName).catch((cleanupError: unknown) =>
        logger.error({ err: cleanupError, storedName }, "Failed to roll back media file"),
      );
      throw error;
    }
  }

  async list() {
    const items = await this.repository.list();
    return { items: items.map(serializeDates) };
  }

  async cleanupOrphans(logger: FastifyBaseLogger) {
    const olderThan = new Date(Date.now() - 60 * 60 * 1000);
    const files = await this.storage.quarantineFiles(olderThan).catch((error: unknown) => {
      logger.error({ err: error }, "Failed to inspect media quarantine files");
      return [];
    });
    await Promise.all(
      files.map((name) =>
        this.storage.remove(name).catch((error: unknown) =>
          logger.error({ err: error, name }, "Failed to remove orphaned media quarantine file"),
        ),
      ),
    );
  }

  async delete(id: string, logger: FastifyBaseLogger) {
    await this.cleanupOrphans(logger);
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundError("Файл не найден");
    if (await this.repository.isReferenced(record.url))
      throw new ConflictError("Файл используется в опубликованном контенте");

    const quarantinedName = `${record.storedName}.deleting-${randomUUID()}`;
    let quarantined = false;
    try {
      await this.storage.move(record.storedName, quarantinedName);
      quarantined = true;
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }

    try {
      const deleted = await this.repository.delete(id);
      if (!deleted) throw new NotFoundError("Файл не найден");
    } catch (error) {
      if (quarantined)
        await this.storage.move(quarantinedName, record.storedName).catch((restoreError: unknown) =>
          logger.error({ err: restoreError, quarantinedName }, "Failed to restore quarantined media"),
        );
      throw error;
    }

    if (quarantined)
      await this.storage.remove(quarantinedName).catch((cleanupError: unknown) =>
        logger.error({ err: cleanupError, quarantinedName }, "Failed to finalize media cleanup"),
      );
    return { success: true };
  }
}
