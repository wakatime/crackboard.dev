ALTER TABLE "UserSummary" ADD COLUMN "aiInputTokens" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSummary" ADD COLUMN "aiOutputTokens" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSummary" ADD COLUMN "aiTotalTokens" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "UserSummary_date_aiTotalTokens_index" ON "UserSummary" USING btree ("date" DESC NULLS LAST,"aiTotalTokens" DESC NULLS LAST);