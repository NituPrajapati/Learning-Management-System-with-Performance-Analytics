-- Migration script to fix Course schema
-- Run this in your MySQL database

USE LMS;

-- Add slug column (nullable, unique)
ALTER TABLE courses ADD COLUMN slug VARCHAR(255) NULL;
CREATE UNIQUE INDEX courses_slug_key ON courses(slug);

-- Add price column
ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) NULL;

-- Add durationWeeks column if it doesn't exist
ALTER TABLE courses ADD COLUMN durationWeeks INT NULL;

-- Add courseType enum column if it doesn't exist
-- First check if column exists, if not add it
ALTER TABLE courses ADD COLUMN courseType ENUM('FREE', 'PAID') DEFAULT 'FREE';

-- Update existing courses to have slugs (optional, for existing data)
UPDATE courses SET slug = LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '--', '-'), '---', '-')) WHERE slug IS NULL;

-- Remove old columns if they exist (be careful with this - only if you're sure)
-- ALTER TABLE courses DROP COLUMN IF EXISTS duration;
-- ALTER TABLE courses DROP COLUMN IF EXISTS durationUnit;
-- ALTER TABLE courses DROP COLUMN IF EXISTS isPaid;
-- ALTER TABLE courses DROP COLUMN IF EXISTS startDate;
-- ALTER TABLE courses DROP COLUMN IF EXISTS endDate;

