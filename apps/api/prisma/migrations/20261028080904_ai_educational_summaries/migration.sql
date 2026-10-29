-- CreateTable
CREATE TABLE `AiSummary` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `windowDays` INTEGER NOT NULL,
    `windowStart` DATETIME(3) NOT NULL,
    `windowEnd` DATETIME(3) NOT NULL,
    `factsHash` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `promptVersion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiSummary_childId_language_windowEnd_idx`(`childId`, `language`, `windowEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiSummary` ADD CONSTRAINT `AiSummary_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
