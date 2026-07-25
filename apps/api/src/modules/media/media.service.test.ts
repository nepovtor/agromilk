import fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaRepository } from "./media.repository.js";
import { MediaService } from "./media.service.js";
import { MediaStorage } from "./media.storage.js";

afterEach(() => vi.restoreAllMocks());

describe("MediaService", () => {
  it("does not turn a committed DB deletion into a false error when final cleanup fails", async () => {
    const record = {
      id: crypto.randomUUID(),
      originalName: "image.webp",
      storedName: "stored.webp",
      mimeType: "image/webp",
      size: 100,
      url: "/uploads/stored.webp",
      uploadedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.spyOn(MediaRepository.prototype, "findById").mockResolvedValue(record);
    vi.spyOn(MediaRepository.prototype, "isReferenced").mockResolvedValue(false);
    vi.spyOn(MediaRepository.prototype, "delete").mockResolvedValue(record);
    vi.spyOn(MediaStorage.prototype, "quarantineFiles").mockResolvedValue([]);
    vi.spyOn(MediaStorage.prototype, "move").mockResolvedValue();
    vi.spyOn(MediaStorage.prototype, "remove").mockRejectedValue(new Error("disk unavailable"));
    const app = fastify();
    const log = vi.spyOn(app.log, "error");

    await expect(new MediaService().delete(record.id, app.log)).resolves.toEqual({
      success: true,
    });
    expect(log).toHaveBeenCalled();
    await app.close();
  });
});
