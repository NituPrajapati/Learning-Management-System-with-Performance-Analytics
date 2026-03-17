/*
  Warnings:

  - You are about to drop the column `duration` on the `courses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `courses` DROP COLUMN `duration`,
    ADD COLUMN `courseType` ENUM('FREE', 'PAID') NOT NULL DEFAULT 'FREE',
    ADD COLUMN `durationWeeks` INTEGER NULL,
    ADD COLUMN `price` DOUBLE NULL,
    ADD COLUMN `slug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `enrollments` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('ACTIVE', 'COMPLETED', 'DROPPED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `saved_courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `saved_courses_studentId_courseId_key`(`studentId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `courses_slug_key` ON `courses`(`slug`);

-- AddForeignKey
ALTER TABLE `saved_courses` ADD CONSTRAINT `saved_courses_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_courses` ADD CONSTRAINT `saved_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
