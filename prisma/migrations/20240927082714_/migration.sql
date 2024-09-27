/*
  Warnings:

  - You are about to drop the column `password` on the `employer` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `employer` DROP COLUMN `password`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `password`;
