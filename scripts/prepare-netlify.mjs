import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishDir = path.join(projectRoot, "apps/web/dist");
const redirectsPath = path.join(publishDir, "_redirects");

function getApiOrigin() {
  const rawValue = process.env.API_PROXY_URL?.trim();

  if (!rawValue) {
    throw new Error(
      "Не задана API_PROXY_URL. Добавьте HTTPS-адрес Fastify API в переменные окружения Netlify, например https://agromilk-api.onrender.com.",
    );
  }

  let url;
  try {
    url = new URL(rawValue);
  } catch {
    throw new Error("API_PROXY_URL должна быть корректным абсолютным URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("API_PROXY_URL должна использовать HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("API_PROXY_URL не должна содержать логин, пароль, query-параметры или hash.");
  }
  if (url.pathname !== "/") {
    throw new Error("API_PROXY_URL должна содержать только origin без пути, например https://agromilk-api.onrender.com.");
  }

  return url.origin;
}

try {
  const apiOrigin = getApiOrigin();
  await access(path.join(publishDir, "index.html"));

  const redirects = [
    `/api/*      ${apiOrigin}/api/:splat      200!`,
    `/uploads/*  ${apiOrigin}/uploads/:splat  200!`,
    "/*          /index.html                  200",
    "",
  ].join("\n");

  await writeFile(redirectsPath, redirects, "utf8");
  console.log(`Netlify redirects prepared for ${apiOrigin}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
