ALTER TABLE "User" ADD COLUMN "isOwner" boolean;--> statement-breakpoint
CREATE INDEX "User_username_index" ON "User" USING btree ("username");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_isOwner_unique" UNIQUE("isOwner");