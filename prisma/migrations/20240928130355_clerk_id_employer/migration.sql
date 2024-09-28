/*
  Warnings:

  - A unique constraint covering the columns `[clerkId]` on the table `Employer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Employer` ADD COLUMN `clerkId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Employer_clerkId_key` ON `Employer`(`clerkId`);
