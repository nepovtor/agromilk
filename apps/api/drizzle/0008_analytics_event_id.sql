ALTER TABLE "analytics_events" ADD COLUMN "event_id" uuid;--> statement-breakpoint
UPDATE "analytics_events" SET "event_id" = gen_random_uuid() WHERE "event_id" IS NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_event_id_unique" ON "analytics_events" USING btree ("event_id");
