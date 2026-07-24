UPDATE "articles"
SET
  "cover_image_url" = '/assets/agromilk/cow-face-hero-v2.webp',
  "updated_at" = now()
WHERE
  "slug" = 'perevod-telenka-na-zcm'
  AND "cover_image_url" = '/assets/agromilk/hero-animals-mobile.webp';
