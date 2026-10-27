-- Admin content tools: activity publishing fields and versioned screening questions.
-- Existing activities stay PUBLISHED and existing questions become version 1.
-- AlterTable
ALTER TABLE `Activity` ADD COLUMN `imageUrl` TEXT NULL,
    ADD COLUMN `professionallyReviewed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `resourceUrl` TEXT NULL,
    ADD COLUMN `reviewedBy` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    ADD COLUMN `steps` TEXT NULL,
    ADD COLUMN `videoUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `ScreeningQuestion` ADD COLUMN `replacesId` VARCHAR(191) NULL,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

