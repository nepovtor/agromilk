import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";

export class MediaStorage {
  readonly directory = path.resolve(process.cwd(), env.UPLOAD_DIR);

  async write(storedName: string, buffer: Buffer) {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.resolve(storedName), buffer, { flag: "wx" });
  }

  remove(storedName: string) {
    return unlink(this.resolve(storedName));
  }

  move(source: string, target: string) {
    return rename(this.resolve(source), this.resolve(target));
  }

  private resolve(storedName: string) {
    return path.join(this.directory, path.basename(storedName));
  }
}
