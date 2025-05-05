UPDATE "User" SET "refreshToken"='INVALID' WHERE "refreshToken" IS NULL;
ALTER TABLE "User" ALTER COLUMN "refreshToken" SET NOT NULL;
