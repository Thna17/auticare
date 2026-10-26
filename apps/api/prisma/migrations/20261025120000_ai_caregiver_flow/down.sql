-- Reverses 20261025120000_ai_caregiver_flow.
--
-- Only the objects this migration created are removed. The two `formKind`
-- columns are dropped last, and any SHORT trial data would go with the tables
-- that reference it, so this is a rollback of the update as a whole rather than
-- a per-feature undo.

-- DropForeignKey
ALTER TABLE `KnowledgeChunk` DROP FOREIGN KEY `KnowledgeChunk_documentId_fkey`;

-- DropForeignKey
ALTER TABLE `AiInsight` DROP FOREIGN KEY `AiInsight_childId_fkey`;

-- DropForeignKey
ALTER TABLE `AiMessage` DROP FOREIGN KEY `AiMessage_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `AiConversation` DROP FOREIGN KEY `AiConversation_childId_fkey`;

-- DropForeignKey
ALTER TABLE `AiConversation` DROP FOREIGN KEY `AiConversation_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `BehaviorObservation` DROP FOREIGN KEY `BehaviorObservation_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `BehaviorObservation` DROP FOREIGN KEY `BehaviorObservation_childId_fkey`;

-- DropTable
DROP TABLE `KnowledgeChunk`;

-- DropTable
DROP TABLE `KnowledgeDocument`;

-- DropTable
DROP TABLE `AiInsight`;

-- DropTable
DROP TABLE `AiMessage`;

-- DropTable
DROP TABLE `AiConversation`;

-- DropTable
DROP TABLE `BehaviorObservation`;

-- DropIndex
DROP INDEX `ScreeningQuestion_ageBand_formKind_isActive_displayOrder_idx` ON `ScreeningQuestion`;

-- AlterTable
ALTER TABLE `Screening` DROP COLUMN `formKind`;

-- AlterTable
ALTER TABLE `ScreeningQuestion` DROP COLUMN `formKind`;
