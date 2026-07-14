-- AlterTable
ALTER TABLE `Parent` MODIFY `role` ENUM('PARENT', 'ADMIN', 'SCHOOL') NOT NULL DEFAULT 'PARENT';

-- AlterTable
ALTER TABLE `RefreshToken` ADD COLUMN `replacedByTokenId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `RefreshToken_replacedByTokenId_idx` ON `RefreshToken`(`replacedByTokenId`);

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_replacedByTokenId_fkey` FOREIGN KEY (`replacedByTokenId`) REFERENCES `RefreshToken`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
