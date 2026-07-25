import { randomUUID } from "node:crypto";
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
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

export class MediaService {
  constructor(
    private readonly repository = new MediaRepository(),
    private readonly storage = new MediaStorage(),
  ) {}

  async upload(input: UploadMediaInput) {
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
      await this.storage.remove(storedName).catch(() => undefined);
      throw error;
    }
  }

  async list() {
    const items = await this.repository.list();
    return { items: items.map(serializeDates) };
  }

  async delete(id: string) {
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
        await this.storage.move(quarantinedName, record.storedName).catch(() => undefined);
      throw error;
    }

    if (quarantined) await this.storage.remove(quarantinedName);
    return { success: true as const };
  }
}
