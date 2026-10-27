-- AlterTable
ALTER TABLE `AccountInvitation`
    DROP COLUMN `emailCodeHash`,
    DROP COLUMN `emailCodeExpiresAt`,
    DROP COLUMN `emailCodeAttempts`,
    DROP COLUMN `emailCodeSentAt`;
