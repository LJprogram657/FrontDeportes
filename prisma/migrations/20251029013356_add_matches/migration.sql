-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'finished');

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "venue" TEXT,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "round" INTEGER,
    "group" TEXT,
    "homeTeamId" INTEGER,
    "awayTeamId" INTEGER,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "goals" TEXT,
    "fouls" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");

-- CreateIndex
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
