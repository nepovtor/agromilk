import type { ProductRecord } from "@landing/shared";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "../../db/schema.js";

type Product = InferSelectModel<typeof products>;

export function toProductRecord(product: Product): ProductRecord {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    uses: Array.isArray(product.uses)
      ? product.uses.filter((item): item is string => typeof item === "string")
      : [],
    composition: product.composition,
    preparation: product.preparation,
    imageUrl: product.imageUrl,
    status: product.status,
    sortOrder: product.sortOrder,
    featured: product.featured,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
