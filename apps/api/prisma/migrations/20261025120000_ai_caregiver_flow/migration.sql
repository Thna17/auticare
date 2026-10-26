-- ---------------------------------------------------------------------------
-- Caregiver update: short-form screening, behaviour observations, assistant
-- conversations, cached insights, and the reviewed knowledge base.
--
-- Every statement here is additive. No existing column is altered, dropped or
-- retyped, so existing screening results, schools, hospitals, appointments and
-- reports are untouched by this migration.
-- ---------------------------------------------------------------------------

-- AlterTable: which question set a question belongs to (FULL | SHORT). Existing
-- rows are the full instrument, which is why FULL is the default.
ALTER TABLE `ScreeningQuestion` ADD COLUMN `formKind` ENUM('FULL', 'SHORT') NOT NULL DEFAULT 'FULL';

-- AlterTable: the question set frozen on a session at creation time.
ALTER TABLE `Screening` ADD COLUMN `formKind` ENUM('FULL', 'SHORT') NOT NULL DEFAULT 'FULL';

-- CreateIndex: serving a band's questions for one form kind.
CREATE INDEX `ScreeningQuestion_ageBand_formKind_isActive_displayOrder_idx` ON `ScreeningQuestion`(`ageBand`, `formKind`, `isActive`, `displayOrder`);

-- CreateTable
CREATE TABLE `BehaviorObservation` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `category` ENUM('CRYING', 'SLEEP', 'EATING', 'SENSORY', 'SOCIAL', 'ROUTINE', 'OTHER') NOT NULL,
    `intensity` INTEGER NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BehaviorObservation_childId_occurredAt_idx`(`childId`, `occurredAt`),
    INDEX `BehaviorObservation_parentId_occurredAt_idx`(`parentId`, `occurredAt`),
    INDEX `BehaviorObservation_childId_category_occurredAt_idx`(`childId`, `category`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiConversation` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiConversation_parentId_updatedAt_idx`(`parentId`, `updatedAt`),
    INDEX `AiConversation_childId_updatedAt_idx`(`childId`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiMessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT') NOT NULL,
    `kind` ENUM('ANSWER', 'CRISIS', 'MEDICATION') NOT NULL DEFAULT 'ANSWER',
    `content` TEXT NOT NULL,
    `model` VARCHAR(191) NULL,
    `latencyMs` INTEGER NULL,
    `tokensIn` INTEGER NULL,
    `tokensOut` INTEGER NULL,
    `sources` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiMessage_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInsight` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `windowStart` DATETIME(3) NOT NULL,
    `windowEnd` DATETIME(3) NOT NULL,
    `summary` TEXT NOT NULL,
    `patterns` JSON NOT NULL,
    `analysisVersion` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiInsight_childId_windowEnd_idx`(`childId`, `windowEnd`),
    UNIQUE INDEX `AiInsight_childId_windowStart_windowEnd_key`(`childId`, `windowStart`, `windowEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `publisher` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(512) NOT NULL,
    `licence` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `version` VARCHAR(191) NOT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeDocument_language_reviewedAt_idx`(`language`, `reviewedAt`),
    UNIQUE INDEX `KnowledgeDocument_sourceUrl_key`(`sourceUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeChunk` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `heading` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `keywords` JSON NOT NULL,

    UNIQUE INDEX `KnowledgeChunk_documentId_displayOrder_key`(`documentId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BehaviorObservation` ADD CONSTRAINT `BehaviorObservation_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BehaviorObservation` ADD CONSTRAINT `BehaviorObservation_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiConversation` ADD CONSTRAINT `AiConversation_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiConversation` ADD CONSTRAINT `AiConversation_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiMessage` ADD CONSTRAINT `AiMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `AiConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiInsight` ADD CONSTRAINT `AiInsight_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeChunk` ADD CONSTRAINT `KnowledgeChunk_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `KnowledgeDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
