import { ConflictError, isUniqueConstraintError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { serializeDates } from "../../lib/serialize.js";
import { hasInvalidArticleEmbed, sanitizeArticleContent } from "./article-content.service.js";
import { ArticleRepository } from "./article.repository.js";
import type { AdminArticleQuery, ArticleInput, ArticleUpdate, PublicArticleQuery } from "./article.types.js";

function validateContent(content: string) {
  if (hasInvalidArticleEmbed(content))
    throw new ValidationError("Разрешены только корректные YouTube-видео", {
      content: ["Разрешены только корректные YouTube-видео"],
    });
  return sanitizeArticleContent(content);
}

export class ArticleService {
  constructor(private readonly repository = new ArticleRepository()) {}

  async publicList(query: PublicArticleQuery) {
    const result = await this.repository.publicList(query);
    return this.paginated(result, query.page, query.pageSize);
  }

  async publicGet(slug: string) {
    const item = await this.repository.publicGet(slug);
    if (!item) throw new NotFoundError("Инструкция не найдена");
    return serializeDates(item);
  }

  async adminList(query: AdminArticleQuery) {
    const result = await this.repository.adminList(query);
    return this.paginated(result, query.page, query.pageSize);
  }

  async get(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError("Статья не найдена");
    return serializeDates(item);
  }

  async create(data: ArticleInput, authorId: string) {
    try {
      const item = await this.repository.create({
        ...data,
        content: validateContent(data.content),
        coverImageUrl: data.coverImageUrl || null,
        authorId,
        publishedAt: data.status === "published" ? new Date() : null,
      });
      return serializeDates(item);
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new ConflictError("Статья с таким адресом уже существует");
      throw error;
    }
  }

  async update(id: string, data: ArticleUpdate) {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError("Статья не найдена");
    try {
      const item = await this.repository.update(id, {
        ...data,
        ...(data.content !== undefined ? { content: validateContent(data.content) } : {}),
        ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl || null } : {}),
        ...(data.status === "published" && !current.publishedAt ? { publishedAt: new Date() } : {}),
        updatedAt: new Date(),
      });
      return serializeDates(item);
    } catch (error) {
      if (isUniqueConstraintError(error)) throw new ConflictError("Статья с таким адресом уже существует");
      throw error;
    }
  }

  async delete(id: string) {
    if (!(await this.repository.delete(id))) throw new NotFoundError("Статья не найдена");
    return { success: true as const };
  }

  private paginated<T extends Record<string, unknown>>(
    result: { items: T[]; total: number },
    page: number,
    pageSize: number,
  ) {
    return {
      items: result.items.map((item) => serializeDates(item)),
      pagination: { page, pageSize, totalItems: result.total, totalPages: Math.max(1, Math.ceil(result.total / pageSize)) },
    };
  }
}
