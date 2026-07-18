/*
  Warnings:

  - A unique constraint covering the columns `[active_ballot_token]` on the table `voter_registrations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "voter_registrations" ADD COLUMN     "active_ballot_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "voter_registrations_active_ballot_token_key" ON "voter_registrations"("active_ballot_token");
