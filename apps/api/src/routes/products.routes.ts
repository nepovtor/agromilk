import type { FastifyPluginAsync } from "fastify";
import {
  adminProductListQuerySchema,
  idParamsSchema,
  productInputSchema,
  slugParamsSchema,
} from "@landing/shared";
import { requireAdmin } from "../lib/auth.js";
import { parseOrThrow } from "../lib/http.js";
import { ProductRepository } from "../modules/products/product.repository.js";
import { ProductService } from "../modules/products/product.service.js";

const productService = new ProductService(new ProductRepository());

export const publicProductRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => productService.listPublished());

  app.get("/:slug", async (request) => {
    const { slug } = parseOrThrow(slugParamsSchema, request.params);
    return productService.getPublishedBySlug(slug);
  });
};

export const adminProductRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAdmin);

  app.get("/", async (request) => {
    const query = parseOrThrow(adminProductListQuerySchema, request.query);
    return productService.list(query);
  });

  app.get("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return productService.get(id);
  });

  app.post("/", async (request, reply) => {
    const data = parseOrThrow(productInputSchema, request.body);
    return reply.code(201).send(await productService.create(data));
  });

  app.patch("/:id", async (request) => {
    const data = parseOrThrow(productInputSchema.partial(), request.body);
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return productService.update(id, data);
  });

  app.delete("/:id", async (request) => {
    const { id } = parseOrThrow(idParamsSchema, request.params);
    return productService.delete(id);
  });
};
