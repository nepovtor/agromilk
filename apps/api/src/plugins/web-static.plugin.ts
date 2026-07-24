import { existsSync } from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import fp from "fastify-plugin";

export const webStaticPlugin = fp(
  async (app) => {
    const webDist = path.resolve(process.cwd(), process.env.WEB_DIST_PATH || "../web/dist");
    if (!existsSync(path.join(webDist, "index.html"))) return;

    await app.register(fastifyStatic, {
      root: webDist,
      prefix: "/",
      decorateReply: true,
      wildcard: false,
    });
    app.setNotFoundHandler((request, reply) => {
      const requestPath = request.url.split("?", 1)[0] || "/";
      const isStaticFile =
        requestPath.startsWith("/assets/") || /\.[a-z0-9]{1,8}$/i.test(requestPath);

      if (requestPath.startsWith("/api/") || requestPath.startsWith("/uploads/") || isStaticFile) {
        return reply.code(404).send({ error: "NOT_FOUND" });
      }
      return reply.sendFile("index.html");
    });
  },
  { name: "web-static" },
);
