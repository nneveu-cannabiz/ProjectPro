/*
  # Fix PMA_Users manager relationship

  1. Database Changes
    - Ensure manager_id column exists in PMA_Users table
    - Add proper self-referencing foreign key constraint
    - Update the constraint name to match what the application expects

  2. Security
    - Maintain existing RLS policies
    - No changes to security model

  This migration fixes the missing foreign key relationship that's causing the user fetch to fail.
*/

-- First, ensure the manager_id column exists (it should already exist based on schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN manager_id uuid;
  END IF;
END $$;

-- Drop the existing foreign key constraint if it exists with a different name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'PMA_Users' 
    AND constraint_name = 'PMA_Users_manager_id_fkey'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE "PMA_Users" DROP CONSTRAINT "PMA_Users_manager_id_fkey";
  END IF;
END $$;

-- Add the proper self-referencing foreign key constraint
ALTER TABLE "PMA_Users" 
ADD CONSTRAINT "PMA_Users_manager_id_fkey" 
FOREIGN KEY (manager_id) REFERENCES "PMA_Users"(id);

-- Create index for better performance on manager lookups
CREATE INDEX IF NOT EXISTS idx_pma_users_manager_id ON "PMA_Users" USING btree (manager_id);