-- AlterTable
ALTER TABLE `Doctor` ADD COLUMN `availableDays` VARCHAR(191) NOT NULL DEFAULT '1,2,3,4,5',
    ADD COLUMN `endHour` INTEGER NOT NULL DEFAULT 17,
    ADD COLUMN `slotDurationMinutes` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `startHour` INTEGER NOT NULL DEFAULT 9,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Phnom_Penh';

-- CreateIndex
CREATE INDEX `Appointment_doctorId_scheduledAt_idx` ON `Appointment`(`doctorId`, `scheduledAt`);

-- CreateIndex
CREATE INDEX `Appointment_parentId_scheduledAt_idx` ON `Appointment`(`parentId`, `scheduledAt`);

-- CreateIndex
CREATE INDEX `Appointment_hospitalId_scheduledAt_idx` ON `Appointment`(`hospitalId`, `scheduledAt`);

-- RenameIndex
ALTER TABLE `Doctor` RENAME INDEX `Doctor_hospitalId_fkey` TO `Doctor_hospitalId_idx`;
