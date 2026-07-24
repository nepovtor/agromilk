UPDATE "products"
SET "image_url" = regexp_replace("image_url", '\\.png$', '.webp')
WHERE "image_url" LIKE '/assets/agromilk/%.png';
--> statement-breakpoint
UPDATE "articles"
SET "cover_image_url" = regexp_replace("cover_image_url", '\\.png$', '.webp')
WHERE "cover_image_url" LIKE '/assets/agromilk/%.png';
