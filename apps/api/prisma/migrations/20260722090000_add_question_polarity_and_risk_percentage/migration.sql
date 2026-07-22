-- AlterTable
ALTER TABLE `ScreeningQuestion` ADD COLUMN `polarity` ENUM('DIRECT', 'REVERSE') NOT NULL DEFAULT 'REVERSE';

-- AlterTable
ALTER TABLE `ScreeningResult` ADD COLUMN `riskPercentage` INTEGER NULL;
