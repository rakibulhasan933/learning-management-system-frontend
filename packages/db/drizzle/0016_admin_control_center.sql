CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_unique" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "categories_active_idx" ON "categories" ("is_active");

CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" varchar(120) PRIMARY KEY,
  "value" text NOT NULL DEFAULT '',
  "updated_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(80) NOT NULL,
  "entity_id" uuid,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity_type", "entity_id");

DO $$ BEGIN
  CREATE TYPE "refund_status" AS ENUM ('requested', 'approved', 'rejected', 'processed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "refunds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
  "amount" numeric(12,2) NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'BDT',
  "reason" text NOT NULL,
  "status" "refund_status" NOT NULL DEFAULT 'requested',
  "requested_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "reviewed_by" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "reviewed_at" timestamptz,
  "processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "refunds_order_unique" ON "refunds" ("order_id");
CREATE INDEX IF NOT EXISTS "refunds_status_created_idx" ON "refunds" ("status", "created_at");
