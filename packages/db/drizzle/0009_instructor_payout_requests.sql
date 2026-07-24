CREATE TYPE "public"."payout_status" AS ENUM('pending', 'approved', 'rejected', 'paid');
--> statement-breakpoint
CREATE TABLE "payout_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "instructor_id" uuid NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "currency" varchar(3) DEFAULT 'BDT' NOT NULL,
  "reference_code" varchar(64) NOT NULL,
  "status" "payout_status" DEFAULT 'pending' NOT NULL,
  "note" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "paid_at" timestamp with time zone,
  "rejection_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "payout_requests_reference_code_unique" ON "payout_requests" USING btree ("reference_code");
--> statement-breakpoint
CREATE INDEX "payout_requests_instructor_id_idx" ON "payout_requests" USING btree ("instructor_id");
--> statement-breakpoint
CREATE INDEX "payout_requests_status_created_at_idx" ON "payout_requests" USING btree ("status","created_at");
--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_amount_non_negative" CHECK ("payout_requests"."amount" >= 0);
