-- Catch-up migration: brings the migration history level with schema.prisma.
--
-- The schema changed across late September / early October without migrations
-- being generated, so `prisma migrate deploy` could no longer reproduce the
-- current schema. This closes that gap.
--
-- `prisma migrate diff` produced most of this, but its output was edited where
-- it would have destroyed data or failed outright. Each such change is marked
-- EDITED below.

-- ─── Child: new optional profile fields ──────────────────────────────────────
ALTER TABLE `Child` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `photoUrl` VARCHAR(191) NULL;

-- ─── Parent: new optional contact fields ─────────────────────────────────────
ALTER TABLE `Parent` ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `socialMediaAccount` VARCHAR(191) NULL;

-- ─── School: operational status + capacity ───────────────────────────────────
ALTER TABLE `School` ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `studentCapacity` INTEGER NOT NULL DEFAULT 0;

-- ─── SchoolStaff: role ───────────────────────────────────────────────────────
ALTER TABLE `SchoolStaff` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'TEACHER';

-- ─── SchoolActivityReport: richer report fields ──────────────────────────────
-- `activityCategory` is NOT NULL with no default, matching the schema. Existing
-- rows take MySQL's implicit '' default.
ALTER TABLE `SchoolActivityReport` ADD COLUMN `activityCategory` VARCHAR(191) NOT NULL,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `performanceMetrics` JSON NULL,
    ADD COLUMN `photoUrls` JSON NULL,
    ADD COLUMN `recommendations` TEXT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `teacherObservation` TEXT NULL;

-- ─── Notification: read-state moves from a timestamp to an enum ──────────────
-- The FK is dropped first because it is backed by the index being replaced.
ALTER TABLE `Notification` DROP FOREIGN KEY `Notification_parentId_fkey`;
DROP INDEX `Notification_parentId_readAt_idx` ON `Notification`;

ALTER TABLE `Notification` ADD COLUMN `enrollmentId` VARCHAR(191) NULL,
    ADD COLUMN `reportId` VARCHAR(191) NULL,
    ADD COLUMN `schoolId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('UNREAD', 'READ') NOT NULL DEFAULT 'UNREAD',
    MODIFY `type` ENUM('SYSTEM', 'APPOINTMENT', 'ADMISSION', 'SCREENING', 'ACTIVITY', 'SCHOOL_REPORT', 'ENROLLMENT_REQUEST', 'REPORT_REQUEST') NOT NULL;

-- EDITED: migrate diff dropped `readAt` in the same statement that added
-- `status`, discarding which notifications had been read. Carry the state over
-- first, then drop the column.
UPDATE `Notification` SET `status` = 'READ' WHERE `readAt` IS NOT NULL;
ALTER TABLE `Notification` DROP COLUMN `readAt`;

CREATE INDEX `Notification_parentId_status_idx` ON `Notification`(`parentId`, `status`);
CREATE INDEX `Notification_schoolId_idx` ON `Notification`(`schoolId`);

-- EDITED: migrate diff dropped Notification_parentId_fkey and never re-added
-- it, which would have silently removed the constraint. Restored with its
-- original definition.
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── SchoolChildEnrollment: lifecycle statuses, lead specialist, renames ─────
-- EDITED: migrate diff emitted DROP COLUMN `startedAt`/`endedAt` + ADD COLUMN
-- `started_at`/`ended_at`. These are the same columns renamed (the schema maps
-- startDate/endDate onto them), so the generated version would have erased
-- every enrollment's start and end date. Renamed in place instead; the existing
-- column types already match what the schema wants.
ALTER TABLE `SchoolChildEnrollment` RENAME COLUMN `startedAt` TO `started_at`;
ALTER TABLE `SchoolChildEnrollment` RENAME COLUMN `endedAt` TO `ended_at`;

ALTER TABLE `SchoolChildEnrollment` ADD COLUMN `leadSpecialistId` VARCHAR(191) NULL;

-- EDITED: the status enum went from ('ACTIVE','ENDED') to
-- ('PENDING','ACTIVE','REJECTED','GRADUATED'). A direct MODIFY would leave any
-- existing 'ENDED' row holding a value the new enum does not contain, which
-- MySQL coerces to ''. Widen, migrate the data, then narrow.
--
-- NOTE: 'ENDED' is mapped to 'GRADUATED' — the lifecycle that replaced it
-- splits "finished" from "removed" ('REJECTED'), and the old single value does
-- not say which. Confirm this is the intended reading for existing rows.
ALTER TABLE `SchoolChildEnrollment` MODIFY `status` ENUM('ACTIVE', 'ENDED', 'PENDING', 'REJECTED', 'GRADUATED') NOT NULL DEFAULT 'ACTIVE';
UPDATE `SchoolChildEnrollment` SET `status` = 'GRADUATED' WHERE `status` = 'ENDED';
ALTER TABLE `SchoolChildEnrollment` MODIFY `status` ENUM('PENDING', 'ACTIVE', 'REJECTED', 'GRADUATED') NOT NULL DEFAULT 'PENDING';

CREATE INDEX `SchoolChildEnrollment_leadSpecialistId_idx` ON `SchoolChildEnrollment`(`leadSpecialistId`);

-- EDITED: migrate diff emitted this constraint twice, which fails on the second
-- with a duplicate constraint name. Added once.
ALTER TABLE `SchoolChildEnrollment` ADD CONSTRAINT `SchoolChildEnrollment_leadSpecialistId_fkey` FOREIGN KEY (`leadSpecialistId`) REFERENCES `SchoolStaff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
