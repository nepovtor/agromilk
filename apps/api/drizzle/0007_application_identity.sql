ALTER TABLE "applications" ADD COLUMN "submission_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "visitor_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_submission_unique" ON "applications" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "applications_visitor_idx" ON "applications" USING btree ("visitor_id");