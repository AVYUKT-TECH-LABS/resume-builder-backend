/*
  Warnings:

  - A unique constraint covering the columns `[mailDomain]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `industry` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logo_url` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `num_employees` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `website` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employer` ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `deletion_message` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `job` ADD COLUMN `organizationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `organization` ADD COLUMN `city` VARCHAR(191) NOT NULL,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `display_name` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `industry` VARCHAR(191) NOT NULL,
    ADD COLUMN `isSubscribed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastListingDate` DATETIME(3) NULL,
    ADD COLUMN `listingsLeft` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `logo_url` VARCHAR(191) NOT NULL,
    ADD COLUMN `mailDomain` VARCHAR(191) NULL,
    ADD COLUMN `num_employees` VARCHAR(191) NOT NULL,
    ADD COLUMN `website` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `org_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `review` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `org_social_links` (
    `id` VARCHAR(191) NOT NULL,
    `facebook` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `youtube` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AggregatedJob` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Organization_mailDomain_key` ON `Organization`(`mailDomain`);

-- AddForeignKey
ALTER TABLE `org_reviews` ADD CONSTRAINT `org_reviews_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `org_social_links` ADD CONSTRAINT `org_social_links_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
