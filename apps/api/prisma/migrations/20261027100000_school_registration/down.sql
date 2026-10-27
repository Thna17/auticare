-- Reverses 20261027100000_school_registration.

-- DropTable
DROP TABLE `SchoolRegistrationRequest`;

-- AlterTable
ALTER TABLE `AccountInvitation`
    DROP COLUMN `emailCodeHash`,
    DROP COLUMN `emailCodeExpiresAt`,
    DROP COLUMN `emailCodeAttempts`,
    DROP COLUMN `emailCodeSentAt`;
