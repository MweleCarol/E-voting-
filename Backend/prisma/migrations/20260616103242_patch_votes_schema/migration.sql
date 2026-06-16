/*
  Warnings:

  - Added the required column `auth_tag` to the `votes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vote_receipts" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "votes" ADD COLUMN     "algorithm_version" TEXT NOT NULL DEFAULT 'AES-256-GCM-v1',
ADD COLUMN     "auth_tag" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL;
