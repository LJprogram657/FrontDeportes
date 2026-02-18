-- Sync schema with prisma/schema.prisma
-- Adds missing columns detected in production database

-- Tournament: add groupCount and selectedPhases
ALTER TABLE "Tournament"
  ADD COLUMN IF NOT EXISTS "groupCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "selectedPhases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- GroupStanding: add optional groupName
ALTER TABLE "GroupStanding"
  ADD COLUMN IF NOT EXISTS "groupName" TEXT;

