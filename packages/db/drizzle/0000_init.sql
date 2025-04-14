CREATE TABLE "AuditLog" (
	"createdAt" timestamp NOT NULL,
	"event" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"ip" varchar,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"userAgent" varchar,
	"userId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProgramLanguage" (
	"color" varchar,
	"createdAt" timestamp NOT NULL,
	"name" "citext" PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProgramLanguageAlias" (
	"id" "citext" PRIMARY KEY NOT NULL,
	"programLanguageName" "citext" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"createdAt" timestamp NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"sessionId" varchar NOT NULL,
	"username" "citext",
	"fullName" varchar,
	"accessToken" varchar NOT NULL,
	CONSTRAINT "User_sessionId_unique" UNIQUE("sessionId"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProgramLanguageAlias" ADD CONSTRAINT "ProgramLanguageAlias_programLanguageName_ProgramLanguage_name_fk" FOREIGN KEY ("programLanguageName") REFERENCES "public"."ProgramLanguage"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuditLog_userId_createdAt_index" ON "AuditLog" USING btree ("userId","createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "AuditLog_userId_index" ON "AuditLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ProgramLanguageAlias_programLanguageName_index" ON "ProgramLanguageAlias" USING btree ("programLanguageName");