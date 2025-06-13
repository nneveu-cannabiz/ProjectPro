/*
  # Fix PMA_Users foreign key relationships and admin setup

  1. Database Schema Updates
    - Add missing foreign key constraints to PMA_Users table
    - Ensure proper relationships between PMA_Users and PMA_Roles
    - Add self-referencing foreign key for manager relationships

  2. Admin Role Setup
    - Ensure Admin role exists in PMA_Roles table
    - Set nickole@cannabizcredit.com as admin user

  3. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- First, ensure we have an Admin role
INSERT INTO "PMA_Roles" (id, name, description, permissions, is_system_role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Admin',
  'System administrator with full access',
  '{"all": true, "manage_users": true, "manage_roles": true, "manage_projects": true}'::jsonb,
  true,
  now(),
  now()
)
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint for role_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PMA_Users_role_id_fkey'
    AND table_name = 'PMA_Users'
  ) THEN
    ALTER TABLE "PMA_Users" 
    ADD CONSTRAINT "PMA_Users_role_id_fkey" 
    FOREIGN KEY (role_id) REFERENCES "PMA_Roles"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint for manager_id if it doesn't exist (self-referencing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PMA_Users_manager_id_fkey'
    AND table_name = 'PMA_Users'
  ) THEN
    ALTER TABLE "PMA_Users" 
    ADD CONSTRAINT "PMA_Users_manager_id_fkey" 
    FOREIGN KEY (manager_id) REFERENCES "PMA_Users"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update nickole@cannabizcredit.com to be an admin
UPDATE "PMA_Users" 
SET role_id = (SELECT id FROM "PMA_Roles" WHERE name = 'Admin' LIMIT 1)
WHERE email = 'nickole@cannabizcredit.com';

-- If the user doesn't exist, we'll need to wait for them to sign up first
-- The trigger will handle creating their profile when they authenticate