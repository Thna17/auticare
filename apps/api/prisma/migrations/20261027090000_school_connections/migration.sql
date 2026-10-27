-- ---------------------------------------------------------------------------
-- School connections: school-managed teacher accounts, several teachers per
-- child, and single-use codes that let a family connect a child to a school.
--
-- Additive except for one data update: every existing SchoolStaff row was
-- created as the school's own account (there was no way to add teachers), so
-- those rows become the school's ADMIN. Without this, teacher scoping would
-- hide every student from the accounts schools use today.
-- ---------------------------------------------------------------------------

-- AlterTable
ALTER TABLE `Parent` ADD COLUMN `username` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SchoolStaff` ADD COLUMN `deactivatedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `EnrollmentTeacher` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnrollmentTeacher_staffId_idx`(`staffId`),
    UNIQUE INDEX `EnrollmentTeacher_enrollmentId_staffId_key`(`enrollmentId`, `staffId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolConnectionCode` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `teacherStaffIds` JSON NULL,
    `createdByStaffId` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `usedByParentId` VARCHAR(191) NULL,
    `enrollmentId` VARCHAR(191) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SchoolConnectionCode_codeHash_key`(`codeHash`),
    INDEX `SchoolConnectionCode_schoolId_createdAt_idx`(`schoolId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Parent_username_key` ON `Parent`(`username`);

-- AddForeignKey
ALTER TABLE `EnrollmentTeacher` ADD CONSTRAINT `EnrollmentTeacher_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `SchoolChildEnrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnrollmentTeacher` ADD CONSTRAINT `EnrollmentTeacher_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `SchoolStaff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolConnectionCode` ADD CONSTRAINT `SchoolConnectionCode_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolConnectionCode` ADD CONSTRAINT `SchoolConnectionCode_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `SchoolChildEnrollment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing school accounts manage their school.
UPDATE `SchoolStaff` SET `role` = 'ADMIN' WHERE `role` = 'TEACHER';
