/*
  Warnings:

  - Made the column `jd` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Job` MODIFY `jd` VARCHAR(191) NOT NULL,
    MODIFY `regional_languages` VARCHAR(191) NULL,
    MODIFY `required_assets` VARCHAR(191) NULL,
    MODIFY `skills` VARCHAR(191) NULL;
