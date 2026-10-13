-- DropForeignKey
ALTER TABLE `ActivityProgress` DROP FOREIGN KEY `ActivityProgress_childId_fkey`;

-- DropIndex
DROP INDEX `ActivityProgress_childId_activityId_idx` ON `ActivityProgress`;

-- AlterTable
ALTER TABLE `AdmissionRequest` MODIFY `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE `SchoolActivityReport` MODIFY `status` ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX `ActivityProgress_childId_activityId_key` ON `ActivityProgress`(`childId`, `activityId`);

-- AddForeignKey
ALTER TABLE `ActivityProgress` ADD CONSTRAINT `ActivityProgress_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `AdmissionRequest_schoolId_status_idx` ON `AdmissionRequest`(`schoolId`, `status`);

-- CreateIndex
CREATE INDEX `AdmissionRequest_parentId_createdAt_idx` ON `AdmissionRequest`(`parentId`, `createdAt`);

-- CreateIndex
CREATE INDEX `AdmissionRequest_childId_idx` ON `AdmissionRequest`(`childId`);

-- CreateIndex
CREATE INDEX `Appointment_doctorId_status_scheduledAt_idx` ON `Appointment`(`doctorId`, `status`, `scheduledAt`);

-- CreateIndex
CREATE INDEX `Appointment_hospitalId_status_scheduledAt_idx` ON `Appointment`(`hospitalId`, `status`, `scheduledAt`);

-- CreateIndex
CREATE INDEX `Notification_schoolId_status_createdAt_idx` ON `Notification`(`schoolId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Notification_enrollmentId_idx` ON `Notification`(`enrollmentId`);

-- CreateIndex
CREATE INDEX `SchoolActivityReport_childId_status_activityDate_idx` ON `SchoolActivityReport`(`childId`, `status`, `activityDate`);

-- CreateIndex
CREATE INDEX `SchoolActivityReport_schoolId_status_activityDate_idx` ON `SchoolActivityReport`(`schoolId`, `status`, `activityDate`);

-- AddForeignKey
ALTER TABLE `AdmissionRequest` ADD CONSTRAINT `AdmissionRequest_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
