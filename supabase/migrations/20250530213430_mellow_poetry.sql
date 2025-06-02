-- Add projectType column to PMA_Projects table
ALTER TABLE "PMA_Projects" ADD COLUMN IF NOT EXISTS "project_type" TEXT DEFAULT 'Active';

-- Update existing records to have a default project type
UPDATE "PMA_Projects" SET "project_type" = 'Active' WHERE "project_type" IS NULL;

-- Add check constraint to ensure only valid values are used
ALTER TABLE "PMA_Projects" ADD CONSTRAINT "PMA_Projects_project_type_check" 
CHECK ("project_type" IN ('Active', 'Upcoming', 'Future', 'On Hold'));

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added project_type column to PMA_Projects table';
END $$;