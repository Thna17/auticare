-- Platform announcements and the admin partnership tracker. Additive only.
-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `audience` ENUM('ALL', 'PARENTS', 'SCHOOLS', 'TEACHERS') NOT NULL DEFAULT 'ALL',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Announcement_status_publishAt_idx`(`status`, `publishAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partnership` (
    `id` VARCHAR(191) NOT NULL,
    `organizationName` VARCHAR(191) NOT NULL,
    `organizationType` VARCHAR(191) NOT NULL DEFAULT 'SCHOOL',
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `status` ENUM('PROSPECT', 'CONTACTED', 'IN_DISCUSSION', 'ACTIVE', 'ENDED') NOT NULL DEFAULT 'PROSPECT',
    `nextFollowUpAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Partnership_status_nextFollowUpAt_idx`(`status`, `nextFollowUpAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

