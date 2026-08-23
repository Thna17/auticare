ALTER TABLE `Parent` MODIFY `role` ENUM('PARENT', 'ADMIN', 'SCHOOL', 'HOSPITAL') NOT NULL DEFAULT 'PARENT';

CREATE TABLE `HospitalStaff` (
  `id` VARCHAR(191) NOT NULL,
  `parentId` VARCHAR(191) NOT NULL,
  `hospitalId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `HospitalStaff_parentId_hospitalId_key`(`parentId`, `hospitalId`),
  INDEX `HospitalStaff_hospitalId_idx`(`hospitalId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `HospitalStaff` ADD CONSTRAINT `HospitalStaff_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Parent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `HospitalStaff` ADD CONSTRAINT `HospitalStaff_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
