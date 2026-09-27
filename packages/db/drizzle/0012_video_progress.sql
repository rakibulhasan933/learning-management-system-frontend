CREATE TABLE "video_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "video_id" uuid NOT NULL REFERENCES "videos"("id") ON DELETE cascade,
  "position_seconds" integer DEFAULT 0 NOT NULL,
  "is_completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamp with time zone,
  "last_watched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "video_progress_user_video_unique" ON "video_progress" USING btree ("user_id", "video_id");
--> statement-breakpoint
CREATE INDEX "video_progress_video_id_idx" ON "video_progress" USING btree ("video_id");
