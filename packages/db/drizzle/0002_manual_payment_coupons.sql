ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_amount_non_negative" CHECK ("orders"."discount_amount" >= 0);
