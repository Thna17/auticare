-- ---------------------------------------------------------------------------
-- Hospital registration requests and team management (coordinators and doctors).
-- ---------------------------------------------------------------------------

-- AlterTable
ALTER TABLE `HospitalStaff`
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'COORDINATOR',
    ADD COLUMN `deactivatedAt` DATETIME(3) NULL,
    ADD COLUMN `doctorId` VARCHAR(191) NULL;

-- Existing hospital staff accounts manage their hospital.
UPDATE `HospitalStaff` SET `role` = 'ADMIN';

-- CreateTable
CREATE TABLE `HospitalRegistrationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalName` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `contactFirstName` VARCHAR(191) NOT NULL,
    `contactLastName` VARCHAR(191) NOT NULL,
    `contactTitle` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `services` TEXT NULL,
    `message` TEXT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `hospitalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HospitalRegistrationRequest_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `HospitalRegistrationRequest_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `HospitalStaff_doctorId_key` ON `HospitalStaff`(`doctorId`);

-- AddForeignKey
ALTER TABLE `HospitalStaff` ADD CONSTRAINT `HospitalStaff_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
