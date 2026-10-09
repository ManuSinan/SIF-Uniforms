-- 2026-10-08: student verification, structured change requests, manual refund references
ALTER TABLE `students`
  ADD COLUMN `verification_status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  ADD COLUMN `verified_by` VARCHAR(191) NULL,
  ADD COLUMN `verified_at` DATETIME(3) NULL,
  ADD COLUMN `rejection_reason` VARCHAR(191) NULL,
  ADD INDEX `students_school_id_admission_no_idx`(`school_id`, `admission_no`);

ALTER TABLE `refunds`
  ADD COLUMN `reference` VARCHAR(191) NULL,
  ADD COLUMN `processed_at` DATETIME(3) NULL;

ALTER TABLE `change_requests`
  ADD COLUMN `order_item_id` INTEGER NULL,
  ADD COLUMN `requested_variant_id` INTEGER NULL;

-- Existing demo/seeded children predate verification
UPDATE `students` SET `verification_status` = 'verified', `verified_by` = 'Migration (pre-existing)', `verified_at` = NOW(3);
