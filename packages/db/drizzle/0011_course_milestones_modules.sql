-- Replace legacy course content while preserving users, enrollments, orders,
-- and payment records. New content is milestone -> module -> video.
DELETE FROM "sections";

CREATE TABLE "modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "milestone_id" uuid NOT NULL REFERENCES "sections"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text,
  "position" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "modules_position_non_negative" CHECK ("modules"."position" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "modules_milestone_position_unique" ON "modules" USING btree ("milestone_id", "position");
--> statement-breakpoint
CREATE INDEX "modules_milestone_id_idx" ON "modules" USING btree ("milestone_id");
--> statement-breakpoint
CREATE TABLE "videos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "module_id" uuid NOT NULL REFERENCES "modules"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "description" text,
  "position" integer NOT NULL,
  "video_provider" "video_provider" DEFAULT 'r2' NOT NULL,
  "video_ref" text,
  "pdf_url" text,
  "slides_url" text,
  "duration_seconds" integer,
  "is_preview" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "available_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "videos_position_non_negative" CHECK ("videos"."position" >= 0),
  CONSTRAINT "videos_duration_seconds_non_negative" CHECK ("videos"."duration_seconds" is null or "videos"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "videos_module_position_unique" ON "videos" USING btree ("module_id", "position");
--> statement-breakpoint
CREATE INDEX "videos_module_id_idx" ON "videos" USING btree ("module_id");
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "module_id" uuid REFERENCES "modules"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "module_id" uuid REFERENCES "modules"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "quizzes_module_id_unique" ON "quizzes" USING btree ("module_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_module_id_unique" ON "assignments" USING btree ("module_id");
