-- AlterTable
ALTER TABLE `Screening` ADD COLUMN `ageBand` ENUM('TODDLER', 'PRESCHOOL') NULL;

-- CreateTable
CREATE TABLE `ScreeningCategoryScore` (
    `id` VARCHAR(191) NOT NULL,
    `resultId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `riskPercentage` INTEGER NOT NULL,
    `riskLevel` ENUM('LOW', 'MODERATE', 'HIGH') NOT NULL,
    `displayOrder` INTEGER NOT NULL,

    UNIQUE INDEX `ScreeningCategoryScore_resultId_category_key`(`resultId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ScreeningCategoryScore` ADD CONSTRAINT `ScreeningCategoryScore_resultId_fkey` FOREIGN KEY (`resultId`) REFERENCES `ScreeningResult`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
