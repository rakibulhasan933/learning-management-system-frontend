CREATE TABLE "discussion_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
  "lecture_id" uuid REFERENCES "lectures"("id") ON DELETE cascade,
  "author_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "parent_id" uuid,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "discussion_posts_course_id_idx" ON "discussion_posts" USING btree ("course_id", "created_at");
--> statement-breakpoint
CREATE INDEX "discussion_posts_lecture_id_idx" ON "discussion_posts" USING btree ("lecture_id");
--> statement-breakpoint
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "type" varchar(64) NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notifications_profile_created_idx" ON "notifications" USING btree ("profile_id", "created_at");
--> statement-breakpoint
CREATE TABLE "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL REFERENCES "courses"("id") ON DELETE cascade,
  "instructor_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "announcements_course_created_idx" ON "announcements" USING btree ("course_id", "created_at");
