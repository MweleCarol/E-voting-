/*
  Warnings:

  - You are about to drop the column `verified` on the `voter_registrations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "voter_registrations" DROP COLUMN "verified",
ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING';
