-- Revert foreign keys and indexes created by 20261009133000_audit_concurrency_and_indexes

-- DropForeignKey
ALTER TABLE `AdmissionRequest` DROP FOREIGN KEY `AdmissionRequest_childId_fkey`;

-- DropIndex
DROP INDEX `SchoolActivityReport_schoolId_status_activityDate_idx` ON `SchoolActivityReport`;
DROP INDEX `SchoolActivityReport_childId_status_activityDate_idx` ON `SchoolActivityReport`;
DROP INDEX `Notification_enrollmentId_idx` ON `Notification`;
DROP INDEX `Notification_schoolId_status_createdAt_idx` ON `Notification`;
DROP INDEX `Appointment_hospitalId_status_scheduledAt_idx` ON `Appointment`;
DROP INDEX `Appointment_doctorId_status_scheduledAt_idx` ON `Appointment`;
DROP INDEX `AdmissionRequest_childId_idx` ON `AdmissionRequest`;
DROP INDEX `AdmissionRequest_parentId_createdAt_idx` ON `AdmissionRequest`;
DROP INDEX `AdmissionRequest_schoolId_status_idx` ON `AdmissionRequest`;

-- DropForeignKey and unique index on ActivityProgress, restore original index and foreign key
ALTER TABLE `ActivityProgress` DROP FOREIGN KEY `ActivityProgress_childId_fkey`;
DROP INDEX `ActivityProgress_childId_activityId_key` ON `ActivityProgress`;
CREATE INDEX `ActivityProgress_childId_activityId_idx` ON `ActivityProgress`(`childId`, `activityId`);
ALTER TABLE `ActivityProgress` ADD CONSTRAINT `ActivityProgress_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Revert columns to VarChar(191)
ALTER TABLE `SchoolActivityReport` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE `AdmissionRequest` MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'REQUESTED';
