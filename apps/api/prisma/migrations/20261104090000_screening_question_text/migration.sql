-- The official M-CHAT-R items are longer than 191 characters, so the seed
-- failed on VARCHAR(191). Widening to TEXT keeps every existing value.

-- AlterTable
ALTER TABLE `ScreeningQuestion` MODIFY `questionText` TEXT NOT NULL;
