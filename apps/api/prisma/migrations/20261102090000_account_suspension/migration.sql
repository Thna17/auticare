-- Platform admin can suspend any account; the account keeps all its data.
-- AlterTable
ALTER TABLE `Parent` ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspendedReason` TEXT NULL;

