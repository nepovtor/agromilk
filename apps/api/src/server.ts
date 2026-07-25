import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";
import { MediaService } from "./modules/media/media.service.js";

const app = await buildApp();
await app.ready();
try {
  const result = await new MediaService().cleanupQuarantine();
  app.log.info(result, "Completed media quarantine cleanup");
} catch (error) {
  app.log.error({ err: error }, "Media quarantine cleanup failed during startup");
}

const close = async (signal: string) => {
  app.log.info({ signal }, "Завершение работы");
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGTERM", () => void close("SIGTERM"));
process.on("SIGINT", () => void close("SIGINT"));

try {
  const address = await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`Сервер запущен: ${address}`);
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}
