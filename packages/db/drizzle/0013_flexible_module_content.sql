ALTER TABLE "modules" ADD COLUMN "content_types" text[] DEFAULT ARRAY[]::text[] NOT NULL;
--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "pdf_url" text;
--> statement-breakpoint
ALTER TABLE "modules" ADD COLUMN "slides_url" text;
