-- Public directory details for Find Support. Additive only: every column is
-- nullable, so existing schools and hospitals are untouched.

-- AlterTable
ALTER TABLE `Hospital` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `website` TEXT NULL;

-- AlterTable
ALTER TABLE `School` ADD COLUMN `phone` VARCHAR(191) NULL;
