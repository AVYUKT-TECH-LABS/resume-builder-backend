/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Employer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Employer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Employer` ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Employer_email_key` ON `Employer`(`email`);

-- CreateIndex
CREATE INDEX `Employer_email_idx` ON `Employer`(`email`);
