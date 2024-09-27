/*
  Warnings:

  - You are about to drop the column `createdAt` on the `application` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `application` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `employer` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `employer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `employer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `plan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider_id]` on the table `Employer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `Employer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Employer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `employer` DROP FOREIGN KEY `Employer_organizationId_fkey`;

-- AlterTable
ALTER TABLE `application` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `employer` DROP COLUMN `createdAt`,
    DROP COLUMN `organizationId`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `organization_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `provider` ENUM('EMAIL_PASSWORD', 'GOOGLE', 'LINKEDIN') NOT NULL DEFAULT 'EMAIL_PASSWORD',
    ADD COLUMN `provider_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `job` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `order` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `organization` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `plan` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `provider` ENUM('EMAIL_PASSWORD', 'GOOGLE', 'LINKEDIN') NOT NULL DEFAULT 'EMAIL_PASSWORD',
    ADD COLUMN `provider_id` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Employer_provider_id_key` ON `Employer`(`provider_id`);

-- CreateIndex
CREATE INDEX `Employer_organization_id_idx` ON `Employer`(`organization_id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_provider_id_key` ON `User`(`provider_id`);

-- AddForeignKey
ALTER TABLE `Employer` ADD CONSTRAINT `Employer_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
