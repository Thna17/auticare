-- CreateTable
CREATE TABLE `ReportAttachmentUpload` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `byteSize` INTEGER NOT NULL,
    `reportId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReportAttachmentUpload_filename_key`(`filename`),
    INDEX `ReportAttachmentUpload_schoolId_idx`(`schoolId`),
    INDEX `ReportAttachmentUpload_expiresAt_reportId_idx`(`expiresAt`, `reportId`),
    INDEX `ReportAttachmentUpload_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReportAttachmentUpload` ADD CONSTRAINT `ReportAttachmentUpload_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttachmentUpload` ADD CONSTRAINT `ReportAttachmentUpload_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportAttachmentUpload` ADD CONSTRAINT `ReportAttachmentUpload_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `SchoolActivityReport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
