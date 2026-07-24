CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"certificate_url" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verification_code" varchar(64) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_user_course_unique" ON "certificates" USING btree ("user_id","course_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_verification_code_unique" ON "certificates" USING btree ("verification_code");
--> statement-breakpoint
CREATE INDEX "certificates_user_id_idx" ON "certificates" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "certificates_course_id_idx" ON "certificates" USING btree ("course_id");
