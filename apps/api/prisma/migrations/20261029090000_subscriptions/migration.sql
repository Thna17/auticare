-- ---------------------------------------------------------------------------
-- Subscriptions (Pro for parents, Business for schools) and the sponsored Pro
-- family accounts a Business school includes. Additive only.
-- ---------------------------------------------------------------------------
-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `plan` ENUM('PRO', 'BUSINESS') NOT NULL,
    `interval` ENUM('MONTHLY', 'YEARLY') NOT NULL,
    `status` ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `parentId` VARCHAR(191) NULL,
    `schoolId` VARCHAR(191) NULL,
    `priceCents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `currentPeriodEnd` DATETIME(3) NULL,
    `canceledAt` DATETIME(3) NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `providerReference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_parentId_status_idx`(`parentId`, `status`),
    INDEX `Subscription_schoolId_status_idx`(`schoolId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sponsorship` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `status` ENUM('INVITED', 'ACTIVE', 'ENDED') NOT NULL DEFAULT 'INVITED',
    `openKey` VARCHAR(191) NULL,
    `activeParentId` VARCHAR(191) NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `invitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acceptedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `endedReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sponsorship_openKey_key`(`openKey`),
    UNIQUE INDEX `Sponsorship_activeParentId_key`(`activeParentId`),
    INDEX `Sponsorship_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `Sponsorship_email_status_idx`(`email`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

