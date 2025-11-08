/*
  Warnings:

  - You are about to drop the column `phase` on the `GroupStanding` table. All the data in the column will be lost.
  - Added the required column `phaseId` to the `GroupStanding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupStanding" DROP COLUMN "phase",
ADD COLUMN     "phaseId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Phase" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupStanding_phaseId_idx" ON "GroupStanding"("phaseId");

-- AddForeignKey
ALTER TABLE "GroupStanding" ADD CONSTRAINT "GroupStanding_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
