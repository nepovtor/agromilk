import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "viewed",
  "in_progress",
  "completed",
  "rejected",
]);
export const articleStatusEnum = pgEnum("article_status", ["draft", "published", "archived"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "published", "archived"]);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    role: varchar("role", { length: 50 }).notNull().default("admin"),
    isActive: integer("is_active").notNull().default(1),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("admins_email_unique").on(table.email)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    ipAddress: varchar("ip_address", { length: 100 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_unique").on(table.tokenHash),
    index("admin_sessions_admin_idx").on(table.adminId),
    index("admin_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id"),
    visitorId: uuid("visitor_id"),
    name: varchar("name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 320 }),
    message: text("message").notNull().default(""),
    status: applicationStatusEnum("status").notNull().default("new"),
    sourcePage: varchar("source_page", { length: 500 }),
    utmSource: varchar("utm_source", { length: 200 }),
    utmMedium: varchar("utm_medium", { length: 200 }),
    utmCampaign: varchar("utm_campaign", { length: 200 }),
    ipAddress: varchar("ip_address", { length: 100 }),
    userAgent: text("user_agent"),
    adminComment: text("admin_comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("applications_submission_unique").on(table.submissionId),
    index("applications_visitor_idx").on(table.visitorId),
    index("applications_created_idx").on(table.createdAt),
    index("applications_status_idx").on(table.status),
  ],
);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    excerpt: varchar("excerpt", { length: 500 }).notNull().default(""),
    content: text("content").notNull().default(""),
    coverImageUrl: text("cover_image_url"),
    coverImageScale: integer("cover_image_scale").notNull().default(100),
    coverImagePositionX: integer("cover_image_position_x").notNull().default(50),
    coverImagePositionY: integer("cover_image_position_y").notNull().default(50),
    status: articleStatusEnum("status").notNull().default("draft"),
    authorId: uuid("author_id").references(() => admins.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_slug_unique").on(table.slug),
    index("articles_status_idx").on(table.status),
    index("articles_published_idx").on(table.publishedAt),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    category: varchar("category", { length: 120 }).notNull().default("Заменители молока"),
    description: text("description").notNull(),
    uses: jsonb("uses").$type<string[]>().notNull().default([]),
    composition: text("composition").notNull().default(""),
    preparation: text("preparation").notNull().default(""),
    imageUrl: text("image_url"),
    status: productStatusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_status_idx").on(table.status),
    index("products_sort_idx").on(table.sortOrder),
  ],
);

export const mediaFiles = pgTable(
  "media_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    storedName: varchar("stored_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    size: integer("size").notNull(),
    url: text("url").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("media_stored_name_unique").on(table.storedName)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: uuid("visitor_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    pagePath: varchar("page_path", { length: 500 }).notNull(),
    referrer: text("referrer").notNull().default(""),
    utmSource: varchar("utm_source", { length: 200 }),
    utmMedium: varchar("utm_medium", { length: 200 }),
    utmCampaign: varchar("utm_campaign", { length: 200 }),
    ipAddress: varchar("ip_address", { length: 100 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_created_idx").on(table.createdAt),
    index("analytics_visitor_idx").on(table.visitorId),
    index("analytics_visitor_created_idx").on(table.visitorId, table.createdAt),
    index("analytics_event_type_idx").on(table.eventType),
  ],
);
