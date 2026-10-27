-- Reverses 20261027110000_drop_invitation_email_code.

-- AlterTable
ALTER TABLE `AccountInvitation`
    ADD COLUMN `emailCodeHash` VARCHAR(191) NULL,
    ADD COLUMN `emailCodeExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `emailCodeAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `emailCodeSentAt` DATETIME(3) NULL;
