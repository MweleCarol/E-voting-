/*
  Warnings:

  - You are about to drop the column `full_name` on the `students` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "full_name";

-- AlterTable
-- Step 1: Add the column as nullable first
ALTER TABLE "users" ADD COLUMN "full_name" TEXT;

-- Step 2: Populate existing rows with a value
UPDATE "users" SET "full_name" = 'Unknown' WHERE "full_name" IS NULL;

-- Step 3: Now add the NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL;

