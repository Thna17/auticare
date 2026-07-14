-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('SYSTEM', 'APPOINTMENT', 'ADMISSION', 'SCREENING', 'ACTIVITY', 'SCHOOL_REPORT') NOT NULL;

-- CreateTable
CREATE TABLE `SchoolStaff` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SchoolStaff_schoolId_idx`(`schoolId`),
    UNIQUE INDEX `SchoolStaff_parentId_schoolId_key`(`parentId`, `schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolChildEnrollment` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'ENDED') NOT NULL DEFAULT 'ACTIVE',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchoolChildEnrollment_childId_status_idx`(`childId`, `status`),
    INDEX `SchoolChildEnrollment_schoolId_status_idx`(`schoolId`, `status`),
    UNIQUE INDEX `SchoolChildEnrollment_schoolId_childId_key`(`schoolId`, `childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolActivityReport` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `activityDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchoolActivityReport_childId_activityDate_idx`(`childId`, `activityDate`),
    INDEX `SchoolActivityReport_schoolId_activityDate_idx`(`schoolId`, `activityDate`),
    INDEX `SchoolActivityReport_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SchoolStaff` ADD CONSTRAINT `SchoolStaff_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolStaff` ADD CONSTRAINT `SchoolStaff_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolChildEnrollment` ADD CONSTRAINT `SchoolChildEnrollment_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolChildEnrollment` ADD CONSTRAINT `SchoolChildEnrollment_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolActivityReport` ADD CONSTRAINT `SchoolActivityReport_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolActivityReport` ADD CONSTRAINT `SchoolActivityReport_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolActivityReport` ADD CONSTRAINT `SchoolActivityReport_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `Parent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
