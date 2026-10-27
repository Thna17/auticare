-- Reverses 20261027090000_school_connections.
--
-- Teacher accounts created through this feature stay as rows in Parent (they
-- are ordinary accounts with an undeliverable email); only the username column
-- goes. Staff roles are not reverted, because ADMIN/TEACHER was already the
-- column's meaning.

-- DropForeignKey
ALTER TABLE `SchoolConnectionCode` DROP FOREIGN KEY `SchoolConnectionCode_enrollmentId_fkey`;

-- DropForeignKey
ALTER TABLE `SchoolConnectionCode` DROP FOREIGN KEY `SchoolConnectionCode_schoolId_fkey`;

-- DropForeignKey
ALTER TABLE `EnrollmentTeacher` DROP FOREIGN KEY `EnrollmentTeacher_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `EnrollmentTeacher` DROP FOREIGN KEY `EnrollmentTeacher_enrollmentId_fkey`;

-- DropTable
DROP TABLE `SchoolConnectionCode`;

-- DropTable
DROP TABLE `EnrollmentTeacher`;

-- DropIndex
DROP INDEX `Parent_username_key` ON `Parent`;

-- AlterTable
ALTER TABLE `SchoolStaff` DROP COLUMN `deactivatedAt`;

-- AlterTable
ALTER TABLE `Parent` DROP COLUMN `username`;
