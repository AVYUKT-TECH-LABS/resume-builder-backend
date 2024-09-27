/*
  Warnings:

  - You are about to drop the column `password` on the `employer` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Employer` DROP COLUMN `password`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `password`;
