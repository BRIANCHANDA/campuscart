ALTER TABLE "couriers" ADD COLUMN "last_lat" double precision;--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "last_lng" double precision;--> statement-breakpoint
ALTER TABLE "couriers" ADD COLUMN "last_seen_at" timestamp with time zone;