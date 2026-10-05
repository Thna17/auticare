-- The hospital's explanation when it rejects an appointment request.
-- Nullable and additive: existing rows keep NULL, and nothing is rewritten.
-- Distinct from Appointment.reason, which holds the parent's own request text.
ALTER TABLE `Appointment` ADD COLUMN `rejectionReason` TEXT NULL;
