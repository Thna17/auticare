-- Reverses 20261028090000_hospital_team.

-- DropForeignKey
ALTER TABLE `HospitalStaff` DROP FOREIGN KEY `HospitalStaff_doctorId_fkey`;

-- DropTable
DROP TABLE `HospitalRegistrationRequest`;

-- DropIndex
DROP INDEX `HospitalStaff_doctorId_key` ON `HospitalStaff`;

-- AlterTable
ALTER TABLE `HospitalStaff`
    DROP COLUMN `role`,
    DROP COLUMN `deactivatedAt`,
    DROP COLUMN `doctorId`;
