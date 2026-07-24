import type {
  ApplicationListQuery,
  BulkUpdateApplicationsInput,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@landing/shared";
import { NotFoundError } from "../../lib/errors.js";
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
    const created = await this.repository.create({ ...data, ...requestMetadata });
    await this.notifications.publishCreated(created, logger);
    return created;
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
