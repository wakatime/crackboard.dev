DROP INDEX "UserSummary_totalSeconds_index";--> statement-breakpoint
DROP INDEX "UserSummaryEditor_totalSeconds_index";--> statement-breakpoint
DROP INDEX "UserSummaryLanguage_totalSeconds_index";--> statement-breakpoint
CREATE INDEX "UserSummary_date_totalSeconds_index" ON "UserSummary" USING btree ("date" DESC NULLS LAST,"totalSeconds" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "UserSummaryEditor_date_totalSeconds_index" ON "UserSummaryEditor" USING btree ("date" DESC NULLS LAST,"totalSeconds" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "UserSummaryLanguage_date_totalSeconds_index" ON "UserSummaryLanguage" USING btree ("date" DESC NULLS LAST,"totalSeconds" DESC NULLS LAST);