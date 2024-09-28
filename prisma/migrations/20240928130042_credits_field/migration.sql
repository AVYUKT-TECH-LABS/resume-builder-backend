-- AlterTable
ALTER TABLE `User` ADD COLUMN `credits` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `User_id_idx` ON `User`(`id`);
