import { MediaService } from "../modules/media/media.service.js";

try {
  const result = await new MediaService().cleanupQuarantine();
  console.log(`Media quarantine cleanup: removed ${result.removed} file(s)`);
} catch (error) {
  console.error("Media quarantine cleanup failed", error);
  process.exitCode = 1;
}
