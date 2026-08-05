ALTER TABLE "payout_ledger" ADD COLUMN "settlement_ref" text;--> statement-breakpoint
ALTER TABLE "payout_ledger" ADD COLUMN "settled_at" timestamp with time zone;