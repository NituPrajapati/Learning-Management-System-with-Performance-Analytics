/*
  Warnings:

  - You are about to drop the column `courseId` on the `student_progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `student_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `student_progress` DROP FOREIGN KEY `student_progress_courseId_fkey`;

-- DropIndex
DROP INDEX `student_progress_studentId_courseId_key` ON `student_progress`;

-- AlterTable
ALTER TABLE `student_progress` DROP COLUMN `courseId`;

-- CreateIndex
CREATE UNIQUE INDEX `student_progress_studentId_key` ON `student_progress`(`studentId`);
