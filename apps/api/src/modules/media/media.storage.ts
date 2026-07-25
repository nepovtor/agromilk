import { mkdir, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
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

  async quarantineFiles(olderThan: Date) {
    await mkdir(this.directory, { recursive: true });
    const names = (await readdir(this.directory)).filter((name) => name.includes(".deleting-"));
    const stale: string[] = [];
    for (const name of names) {
      const details = await stat(this.resolve(name));
      if (details.mtime < olderThan) stale.push(name);
    }
    return stale;
  }

  private resolve(storedName: string) {
    return path.join(this.directory, path.basename(storedName));
  }
}
