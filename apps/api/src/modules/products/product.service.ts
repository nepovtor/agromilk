import type { ProductInput } from "@landing/shared";
import { ConflictError, isUniqueConstraintError, NotFoundError } from "../../lib/errors.js";
import { toProductRecord } from "./product.mapper.js";
import { ProductRepository } from "./product.repository.js";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async listPublished() {
    const items = await this.repository.listPublished();
    return { items: items.map(toProductRecord) };
  }

  async getPublishedBySlug(slug: string) {
    const item = await this.repository.findPublishedBySlug(slug);
    if (!item) throw new NotFoundError("Продукт не найден");
    return toProductRecord(item);
  }

  async list(query: {
    page: number;
    pageSize: number;
    status?: ProductInput["status"];
    search?: string;
  }) {
    const { items, totalItems } = await this.repository.list(query);
    return {
      items: items.map(toProductRecord),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
      },
    };
  }

  async get(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError("Продукт не найден");
    return toProductRecord(item);
  }

  async create(data: ProductInput) {
    try {
      return toProductRecord(await this.repository.create(data));
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Продукт с таким адресом уже существует");
      throw error;
    }
  }

  async update(id: string, data: Partial<ProductInput>) {
    if (!(await this.repository.findById(id))) throw new NotFoundError("Продукт не найден");
    try {
      const updated = await this.repository.update(id, data);
      if (!updated) throw new NotFoundError("Продукт не найден");
      return toProductRecord(updated);
    } catch (error) {
      if (isUniqueConstraintError(error))
        throw new ConflictError("Продукт с таким адресом уже существует");
      throw error;
    }
  }

  async delete(id: string) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Продукт не найден");
    return { success: true };
  }
}
