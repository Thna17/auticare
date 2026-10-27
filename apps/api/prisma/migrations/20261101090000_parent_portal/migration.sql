-- AlterTable
ALTER TABLE `AiMessage` ADD COLUMN `feedback` VARCHAR(191) NULL,
    ADD COLUMN `feedbackNote` TEXT NULL,
    ADD COLUMN `savedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `BehaviorObservation` ADD COLUMN `durationMinutes` INTEGER NULL,
    ADD COLUMN `outcome` TEXT NULL,
    ADD COLUMN `parentResponse` TEXT NULL,
    ADD COLUMN `trigger` TEXT NULL,
    MODIFY `category` ENUM('COMMUNICATION', 'EMOTIONAL', 'CRYING', 'SLEEP', 'EATING', 'SENSORY', 'SOCIAL', 'ROUTINE', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `status` ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD';

-- AlterTable
ALTER TABLE `ParentPreference` ADD COLUMN `notifyActivities` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyAnnouncements` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyQuestionnaire` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyReports` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifySchool` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `ActivityFavorite` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityFavorite_parentId_idx`(`parentId`),
    INDEX `ActivityFavorite_activityId_idx`(`activityId`),
    UNIQUE INDEX `ActivityFavorite_parentId_activityId_key`(`parentId`, `activityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteHospital` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteHospital_parentId_idx`(`parentId`),
    INDEX `FavoriteHospital_hospitalId_idx`(`hospitalId`),
    UNIQUE INDEX `FavoriteHospital_parentId_hospitalId_key`(`parentId`, `hospitalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `hospitalId` VARCHAR(191) NULL,
    `childFirstName` VARCHAR(191) NULL,
    `subject` VARCHAR(120) NOT NULL,
    `message` VARCHAR(2000) NOT NULL,
    `status` ENUM('NEW', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationInquiry_parentId_createdAt_idx`(`parentId`, `createdAt`),
    INDEX `OrganizationInquiry_schoolId_status_createdAt_idx`(`schoolId`, `status`, `createdAt`),
    INDEX `OrganizationInquiry_hospitalId_status_createdAt_idx`(`hospitalId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActivityFavorite` ADD CONSTRAINT `ActivityFavorite_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityFavorite` ADD CONSTRAINT `ActivityFavorite_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteHospital` ADD CONSTRAINT `FavoriteHospital_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteHospital` ADD CONSTRAINT `FavoriteHospital_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationInquiry` ADD CONSTRAINT `OrganizationInquiry_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationInquiry` ADD CONSTRAINT `OrganizationInquiry_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationInquiry` ADD CONSTRAINT `OrganizationInquiry_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
