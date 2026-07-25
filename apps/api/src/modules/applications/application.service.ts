import type {
  ApplicationListQuery,
  BulkUpdateApplicationsInput,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@agromilk/shared";
import { env } from "../../config/env.js";
import { LimitExceededError, NotFoundError } from "../../lib/errors.js";
import { serializeDates } from "../../lib/serialize.js";
import type { ApplicationNotificationPublisher } from "./application-notification.publisher.js";
import { ApplicationRepository } from "./application.repository.js";

type CreateApplicationContext = {
  ipAddress: string;
  userAgent: string | undefined;
  logger: Parameters<ApplicationNotificationPublisher["publishCreated"]>[1];
};

export class ApplicationService {
  constructor(
    private readonly repository: ApplicationRepository,
    private readonly notifications: ApplicationNotificationPublisher,
  ) {}

  async create(data: CreateApplicationInput, context: CreateApplicationContext) {
    if (data.website) return null;
    const { logger, ...requestMetadata } = context;
    const result = await this.repository.create({ ...data, ...requestMetadata });
    if (result.created) await this.notifications.publishCreated(result.record, logger);
    return result;
  }

  async list(query: ApplicationListQuery) {
    const { items, totalItems } = await this.repository.list(query);
    return {
      items: items.map(serializeDates),
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
    if (!item) throw new NotFoundError("Заявка не найдена");
    return serializeDates(item);
  }

  async exportCsv(query: ApplicationListQuery) {
    const items = await this.repository.listForExport(query);
    if (items.length > env.CSV_EXPORT_LIMIT)
      throw new LimitExceededError(
        `Экспорт ограничен ${env.CSV_EXPORT_LIMIT} заявками. Уточните фильтры.`,
      );
    const statusLabels = {
      new: "Новая",
      viewed: "Просмотрена",
      in_progress: "В работе",
      completed: "Завершена",
      rejected: "Отклонена",
    } as const;
    const escape = (value: string | null | undefined) =>
      `"${(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Дата", "Клиент", "Телефон", "Email", "Сообщение", "Статус", "Комментарий", "Источник"],
      ...items.map((item) => [
        item.createdAt.toISOString(),
        item.name,
        item.phone,
        item.email,
        item.message,
        statusLabels[item.status],
        item.adminComment,
        item.sourcePage,
      ]),
    ];
    return `\ufeff${rows.map((row) => row.map(escape).join(";")).join("\n")}`;
  }

  async update(id: string, data: UpdateApplicationInput) {
    const updated = await this.repository.update(id, data);
    if (!updated) throw new NotFoundError("Заявка не найдена");
    return serializeDates(updated);
  }

  async bulkUpdate(data: BulkUpdateApplicationsInput) {
    const updated = await this.repository.bulkUpdate(data);
    return { success: true, updated };
  }

  async delete(id: string) {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Заявка не найдена");
    return { success: true };
  }
}
