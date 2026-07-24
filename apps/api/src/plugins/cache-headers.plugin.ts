import fp from "fastify-plugin";

export const cacheHeadersPlugin = fp(
  async (app) => {
    app.addHook("onSend", async (request, reply, payload) => {
      const requestPath = request.url.split("?", 1)[0] || "/";
      const contentType = String(reply.getHeader("content-type") || "");

      if (contentType.includes("text/html")) {
        reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
        reply.header("Pragma", "no-cache");
        reply.header("Expires", "0");
      } else if (requestPath.startsWith("/assets/") && reply.statusCode < 400) {
        reply.header("Cache-Control", "public, max-age=31536000, immutable");
      }

      return payload;
    });
  },
  { name: "cache-headers" },
);
