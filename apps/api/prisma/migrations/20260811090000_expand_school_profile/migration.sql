-- AlterTable
ALTER TABLE `School`
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `website` TEXT NULL,
  ADD COLUMN `logoUrl` TEXT NULL,
  ADD COLUMN `coverImageUrl` TEXT NULL,
  ADD COLUMN `studentTeacherRatio` VARCHAR(191) NULL,
  ADD COLUMN `availabilityStatus` ENUM('IMMEDIATE', 'WAITLIST', 'CLOSED') NOT NULL DEFAULT 'IMMEDIATE',
  ADD COLUMN `waitlistEstimate` VARCHAR(191) NULL,
  ADD COLUMN `admissionRequirements` TEXT NULL,
  ADD COLUMN `operatingHours` VARCHAR(191) NULL,
  ADD COLUMN `facilities` JSON NULL,
  ADD COLUMN `specializations` JSON NULL,
  ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false;
