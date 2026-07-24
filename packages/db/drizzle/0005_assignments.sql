CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"section_id" uuid,
	"lecture_id" uuid,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_max_score_positive" CHECK ("assignments"."max_score" > 0),
	CONSTRAINT "assignments_exactly_one_target" CHECK (("assignments"."section_id" is not null and "assignments"."lecture_id" is null) or ("assignments"."section_id" is null and "assignments"."lecture_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"submission_text" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grade_score" integer,
	"grade_feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_submissions_grade_score_non_negative" CHECK ("assignment_submissions"."grade_score" is null or "assignment_submissions"."grade_score" >= 0)
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lecture_id_lectures_id_fk" FOREIGN KEY ("lecture_id") REFERENCES "public"."lectures"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_profiles_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_section_id_unique" ON "assignments" USING btree ("section_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_lecture_id_unique" ON "assignments" USING btree ("lecture_id");
--> statement-breakpoint
CREATE INDEX "assignments_course_id_idx" ON "assignments" USING btree ("course_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submissions_assignment_user_unique" ON "assignment_submissions" USING btree ("assignment_id","user_id");
--> statement-breakpoint
CREATE INDEX "assignment_submissions_assignment_id_idx" ON "assignment_submissions" USING btree ("assignment_id");
--> statement-breakpoint
CREATE INDEX "assignment_submissions_user_id_idx" ON "assignment_submissions" USING btree ("user_id");
