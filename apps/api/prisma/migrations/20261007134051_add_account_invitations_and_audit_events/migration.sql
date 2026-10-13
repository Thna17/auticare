-- AlterTable
ALTER TABLE `Parent` ADD COLUMN `mustResetPassword` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `AccountInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `role` ENUM('PARENT', 'ADMIN', 'SCHOOL', 'HOSPITAL') NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,
    `hospitalId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AccountInvitation_tokenHash_key`(`tokenHash`),
    INDEX `AccountInvitation_email_idx`(`email`),
    INDEX `AccountInvitation_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditEvent` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorRole` VARCHAR(191) NULL,
    `targetId` VARCHAR(191) NULL,
    `targetEmail` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditEvent_action_idx`(`action`),
    INDEX `AuditEvent_actorId_idx`(`actorId`),
    INDEX `AuditEvent_targetEmail_idx`(`targetEmail`),
    INDEX `AuditEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountInvitation` ADD CONSTRAINT `AccountInvitation_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
