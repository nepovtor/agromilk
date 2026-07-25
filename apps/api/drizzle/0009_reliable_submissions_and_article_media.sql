UPDATE "applications" SET "submission_id" = gen_random_uuid() WHERE "submission_id" IS NULL;--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "submission_id" SET NOT NULL;--> statement-breakpoint
CREATE TABLE "article_media" (
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "media_id" uuid NOT NULL REFERENCES "media_files"("id"),
  "usage_type" varchar(20) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE UNIQUE INDEX "article_media_usage_unique" ON "article_media" USING btree ("article_id", "media_id", "usage_type");--> statement-breakpoint
CREATE INDEX "article_media_article_idx" ON "article_media" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "article_media_media_idx" ON "article_media" USING btree ("media_id");
--> statement-breakpoint
INSERT INTO "article_media" ("article_id", "media_id", "usage_type")
SELECT "articles"."id", "media_files"."id", 'cover'
FROM "articles"
INNER JOIN "media_files" ON "media_files"."url" = "articles"."cover_image_url"
ON CONFLICT ("article_id", "media_id", "usage_type") DO NOTHING;
