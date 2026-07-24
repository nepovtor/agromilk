import { mkdirSync } from "node:fs";
import path from "node:path";
import fastifyStatic from "@fastify/static";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

export const uploadsPlugin = fp(
  async (app) => {
    const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    mkdirSync(uploadDir, { recursive: true });
    await app.register(fastifyStatic, {
      root: uploadDir,
      prefix: "/uploads/",
      decorateReply: false,
    });
  },
  { name: "uploads" },
);
