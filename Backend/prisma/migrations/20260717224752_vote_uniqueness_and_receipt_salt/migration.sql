/*
  Warnings:

  - A unique constraint covering the columns `[ballot_token]` on the table `votes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `salt` to the `vote_receipts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vote_receipts" ADD COLUMN     "salt" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "votes_ballot_token_key" ON "votes"("ballot_token");
