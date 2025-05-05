DELETE FROM "LeaderboardConfig";
ALTER TABLE "LeaderboardConfig" ADD COLUMN "createdAt" timestamp NOT NULL;
