import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type {
  ApplicationListQuery,
  BulkUpdateApplicationsInput,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@agromilk/shared";
import { db } from "../../db/index.js";
import { applications } from "../../db/schema.js";

export type Application = InferSelectModel<typeof applications>;

type CreateApplicationData = Omit<CreateApplicationInput, "consent" | "website"> & {
  ipAddress: string;
  userAgent: string | undefined;
};

export class ApplicationRepository {
  async create(data: CreateApplicationData) {
    const [created] = await db
      .insert(applications)
      .values({
        ...data,
        email: data.email || null,
        message: data.message || "",
        sourcePage: data.sourcePage || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      })
      .onConflictDoNothing({ target: applications.submissionId })
      .returning();
    if (created) return { record: created, created: true as const };
    if (!data.submissionId) throw new Error("Не удалось создать заявку");
    const [existing] = await db
      .select()
      .from(applications)
      .where(eq(applications.submissionId, data.submissionId))
      .limit(1);
    if (!existing) throw new Error("Не удалось найти ранее созданную заявку");
    return { record: existing, created: false as const };
  }

  async list(query: ApplicationListQuery) {
    const conditions = [];
    if (query.status) conditions.push(eq(applications.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(applications.name, pattern),
          ilike(applications.phone, pattern),
          ilike(applications.email, pattern),
        )!,
      );
    }
    if (query.from)
      conditions.push(gte(applications.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
    if (query.to)
      conditions.push(lte(applications.createdAt, new Date(`${query.to}T23:59:59.999Z`)));

    const where = conditions.length ? and(...conditions) : undefined;
    const order = query.sort === "asc" ? asc(applications.createdAt) : desc(applications.createdAt);
    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(applications)
        .where(where)
        .orderBy(order)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(applications).where(where),
    ]);

    return { items, totalItems: Number(totalRows[0]?.value ?? 0) };
  }

  async listForExport(query: ApplicationListQuery) {
    const conditions = [];
    if (query.status) conditions.push(eq(applications.status, query.status));
    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(applications.name, pattern),
          ilike(applications.phone, pattern),
          ilike(applications.email, pattern),
        )!,
      );
    }
    if (query.from)
      conditions.push(gte(applications.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
    if (query.to)
      conditions.push(lte(applications.createdAt, new Date(`${query.to}T23:59:59.999Z`)));
    const where = conditions.length ? and(...conditions) : undefined;
    const order = query.sort === "asc" ? asc(applications.createdAt) : desc(applications.createdAt);
    return db.select().from(applications).where(where).orderBy(order);
  }

  async findById(id: string) {
    const [item] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    return item;
  }

  async update(id: string, data: UpdateApplicationInput) {
    const [updated] = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async bulkUpdate(data: BulkUpdateApplicationsInput) {
    const updated = await db
      .update(applications)
      .set({ status: data.status, updatedAt: new Date() })
      .where(inArray(applications.id, data.ids))
      .returning({ id: applications.id });
    return updated.length;
  }

  async delete(id: string) {
    const [deleted] = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    return deleted;
  }
}
