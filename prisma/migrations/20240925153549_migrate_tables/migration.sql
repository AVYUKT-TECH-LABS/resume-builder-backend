/*
  Warnings:

  - You are about to drop the column `status` on the `application` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `job` table. All the data in the column will be lost.
  - Added the required column `application_status` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_updated` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resume_id` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_name` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `english_level` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience_level` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interview_type` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is24_7` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_title` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_type` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joining_fee_required` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minimum_edu` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_type` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perks` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regional_languages` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required_assets` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skills` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_location_type` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Application_status_idx` ON `application`;

-- DropIndex
DROP INDEX `Job_title_idx` ON `job`;

-- AlterTable
ALTER TABLE `application` DROP COLUMN `status`,
    ADD COLUMN `application_status` ENUM('application_recieved', 'under_review', 'shortlisted', 'assessment_scheduled', 'interview_scheduled', 'interview_in_progress', 'interview_completed', 'offer_made', 'offer_accepted', 'offer_rejected', 'hired', 'rejected', 'on_hold') NOT NULL,
    ADD COLUMN `cover_letter` VARCHAR(191) NULL,
    ADD COLUMN `last_updated` DATETIME(3) NOT NULL,
    ADD COLUMN `resume_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `job` DROP COLUMN `description`,
    DROP COLUMN `title`,
    ADD COLUMN `age` VARCHAR(191) NULL,
    ADD COLUMN `avg_incentive` VARCHAR(191) NULL,
    ADD COLUMN `company_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `english_level` ENUM('NA', 'basic', 'intermediate', 'proficient') NOT NULL,
    ADD COLUMN `experience_level` ENUM('freshers', 'intermediate', 'experts') NOT NULL,
    ADD COLUMN `fixed_salary` VARCHAR(191) NULL,
    ADD COLUMN `gender` ENUM('male', 'female', 'both') NULL,
    ADD COLUMN `interview_address` VARCHAR(191) NULL,
    ADD COLUMN `interview_type` ENUM('in_person', 'walk_in', 'telephonic_online') NOT NULL,
    ADD COLUMN `is24_7` BOOLEAN NOT NULL,
    ADD COLUMN `jd` VARCHAR(191) NULL,
    ADD COLUMN `job_title` VARCHAR(191) NOT NULL,
    ADD COLUMN `job_type` ENUM('full_time', 'part_time', 'both') NOT NULL,
    ADD COLUMN `joining_fee` VARCHAR(191) NULL,
    ADD COLUMN `joining_fee_required` BOOLEAN NOT NULL,
    ADD COLUMN `minimum_edu` ENUM('ten_or_below_10', 'twelve_pass', 'diploma', 'graduate') NOT NULL,
    ADD COLUMN `office_address` VARCHAR(191) NULL,
    ADD COLUMN `online_interview_link` VARCHAR(191) NULL,
    ADD COLUMN `other_instructions` VARCHAR(191) NULL,
    ADD COLUMN `pay_type` ENUM('fixed_only', 'fixed_and_incentive', 'incentive_only') NOT NULL,
    ADD COLUMN `perks` VARCHAR(191) NOT NULL,
    ADD COLUMN `regional_languages` VARCHAR(191) NOT NULL,
    ADD COLUMN `required_assets` VARCHAR(191) NOT NULL,
    ADD COLUMN `skills` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('active', 'paused', 'closed') NOT NULL,
    ADD COLUMN `total_experience` VARCHAR(191) NULL,
    ADD COLUMN `walk_in_end_date` VARCHAR(191) NULL,
    ADD COLUMN `walk_in_start_date` VARCHAR(191) NULL,
    ADD COLUMN `walk_in_timings` VARCHAR(191) NULL,
    ADD COLUMN `work_location_type` ENUM('hybrid', 'remote') NOT NULL;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `pg_orderId` VARCHAR(191) NOT NULL,
    `pg` VARCHAR(191) NOT NULL,
    `amount` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `display_amount` INTEGER NOT NULL,
    `credits` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plan_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
