-- ---------------------------------------------------------------------------
-- School registration requests: public submission, admin approval/rejection,
-- and 6-digit email verification codes for account invitations.
-- ---------------------------------------------------------------------------

-- AlterTable
ALTER TABLE `AccountInvitation`
    ADD COLUMN `emailCodeHash` VARCHAR(191) NULL,
    ADD COLUMN `emailCodeExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `emailCodeAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `emailCodeSentAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `SchoolRegistrationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `schoolName` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `contactFirstName` VARCHAR(191) NOT NULL,
    `contactLastName` VARCHAR(191) NOT NULL,
    `contactTitle` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `studentCount` INTEGER NULL,
    `message` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `schoolId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchoolRegistrationRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `SchoolRegistrationRequest_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
