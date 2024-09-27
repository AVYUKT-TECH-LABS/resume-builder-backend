-- DropForeignKey
ALTER TABLE `Employer` DROP FOREIGN KEY `Employer_organization_id_fkey`;

-- AlterTable
ALTER TABLE `Employer` MODIFY `organization_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Employer` ADD CONSTRAINT `Employer_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
