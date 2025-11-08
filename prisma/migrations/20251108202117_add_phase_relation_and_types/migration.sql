/*
  Warnings:

  - Added the required column `tournamentId` to the `Phase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Phase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhaseType" AS ENUM ('round_robin', 'group_stage', 'round_of_16', 'quarterfinals', 'semifinals', 'final');

-- AlterTable
ALTER TABLE "Phase" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tournamentId" INTEGER NOT NULL,
ADD COLUMN     "type" "PhaseType" NOT NULL;

-- CreateIndex
CREATE INDEX "Phase_tournamentId_idx" ON "Phase"("tournamentId");

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
