import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";

const app = await buildApp();

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
