CREATE TABLE "Editor" (
	"color" varchar,
	"name" "citext" PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DailyLeaderboard" (
	"date" date NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MonthlyLeaderboard" (
	"monthEndDate" date NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WeeklyLeaderboard" (
	"weekEndDate" date NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserSummary" (
	"date" date NOT NULL,
	"userId" "citext" NOT NULL,
	"totalSeconds" integer NOT NULL,
	CONSTRAINT "UserSummary_date_userId_unique" UNIQUE("date","userId")
);
--> statement-breakpoint
CREATE TABLE "UserSummaryEditor" (
	"date" date NOT NULL,
	"userId" "citext" NOT NULL,
	"editorName" "citext" NOT NULL,
	"totalSeconds" integer NOT NULL,
	CONSTRAINT "UserSummaryEditor_date_userId_editorName_unique" UNIQUE("date","userId","editorName")
);
--> statement-breakpoint
CREATE TABLE "UserSummaryLanguage" (
	"date" date NOT NULL,
	"userId" "citext" NOT NULL,
	"programLanguageName" "citext" NOT NULL,
	"totalSeconds" integer NOT NULL,
	CONSTRAINT "UserSummaryLanguage_date_userId_programLanguageName_unique" UNIQUE("date","userId","programLanguageName")
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ALTER COLUMN "userId" SET DATA TYPE citext;--> statement-breakpoint
ALTER TABLE "UserSummary" ADD CONSTRAINT "UserSummary_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserSummaryEditor" ADD CONSTRAINT "UserSummaryEditor_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserSummaryEditor" ADD CONSTRAINT "UserSummaryEditor_editorName_Editor_name_fk" FOREIGN KEY ("editorName") REFERENCES "public"."Editor"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserSummaryLanguage" ADD CONSTRAINT "UserSummaryLanguage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserSummaryLanguage" ADD CONSTRAINT "UserSummaryLanguage_programLanguageName_ProgramLanguage_name_fk" FOREIGN KEY ("programLanguageName") REFERENCES "public"."ProgramLanguage"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProgramLanguage" DROP COLUMN "createdAt";