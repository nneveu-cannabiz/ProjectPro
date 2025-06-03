/*
  # Add priority field to PMA_Projects table
  
  1. Changes
    - Add "priority" column to PMA_Projects table with default value 'Medium'
    - Add check constraint to ensure priority values are valid
  
  2. Notes
    - Valid priority values are: 'Critical', 'High', 'Medium', 'Low'
*/

-- Add priority column to PMA_Projects table
ALTER TABLE "PMA_Projects" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'Medium';

-- Add check constraint to ensure priority values are valid
ALTER TABLE "PMA_Projects" ADD CONSTRAINT "PMA_Projects_priority_check" 
CHECK ("priority" IN ('Critical', 'High', 'Medium', 'Low'));

-- Update any existing records to have the default priority if needed
UPDATE "PMA_Projects" SET "priority" = 'Medium' WHERE "priority" IS NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added priority column to PMA_Projects table';
END $$;