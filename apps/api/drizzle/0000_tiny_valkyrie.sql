CREATE TYPE "public"."application_status" AS ENUM('new', 'viewed', 'in_progress', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"ip_address" varchar(100),
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"page_path" varchar(500) NOT NULL,
	"referrer" text DEFAULT '' NOT NULL,
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"ip_address" varchar(100),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(320),
	"message" text DEFAULT '' NOT NULL,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"source_page" varchar(500),
	"utm_source" varchar(200),
	"utm_medium" varchar(200),
	"utm_campaign" varchar(200),
	"ip_address" varchar(100),
	"user_agent" text,
	"admin_comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"excerpt" varchar(500) DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"cover_image_url" text,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"author_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"stored_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_admins_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_admins_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_unique" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_unique" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "analytics_created_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_visitor_idx" ON "analytics_events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_unique" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "articles_published_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_stored_name_unique" ON "media_files" USING btree ("stored_name");