ALTER TABLE "courses" ADD COLUMN "offer_title" text;
ALTER TABLE "courses" ADD COLUMN "offer_price" numeric(12, 2);
ALTER TABLE "courses" ADD COLUMN "offer_starts_at" timestamptz;
ALTER TABLE "courses" ADD COLUMN "offer_ends_at" timestamptz;
ALTER TABLE "courses" ADD CONSTRAINT "courses_offer_price_non_negative" CHECK ("courses"."offer_price" IS NULL OR "courses"."offer_price" >= 0);
