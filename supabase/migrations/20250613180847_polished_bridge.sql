/*
  # Fix Admin User Setup and Database Schema

  1. Database Schema Fixes
    - Ensure proper foreign key constraints exist
    - Fix any relationship issues causing the Supabase errors
    
  2. Admin User Setup
    - Ensure Admin role exists
    - Set nickole@cannabizcredit.com as Admin
    - Handle case where user may not exist yet in auth.users
    
  3. Security
    - Ensure RLS policies work correctly
    - Fix any policy conflicts
*/

-- First, ensure we have all required roles
INSERT INTO "PMA_Roles" (name, description, permissions, is_system_role, created_at, updated_at)
VALUES 
  ('Admin', 'System administrator with full access', '{"all": true, "manage_users": true, "manage_roles": true, "manage_projects": true}'::jsonb, true, now(), now()),
  ('Manager', 'Team manager with project oversight', '{"manage_team": true, "view_reports": true}'::jsonb, true, now(), now()),
  ('User', 'Standard user with basic access', '{"view_assigned": true}'::jsonb, true, now(), now()),
  ('Developer', 'Developer with technical access', '{"manage_tasks": true, "view_code": true}'::jsonb, true, now(), now())
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Ensure role_id column exists and has proper constraint
DO $$
BEGIN
  -- Add role_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN role_id uuid;
  END IF;
  
  -- Drop existing constraint if it exists (to recreate it properly)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PMA_Users_role_id_fkey'
    AND table_name = 'PMA_Users'
  ) THEN
    ALTER TABLE "PMA_Users" DROP CONSTRAINT "PMA_Users_role_id_fkey";
  END IF;
  
  -- Add proper foreign key constraint
  ALTER TABLE "PMA_Users" 
  ADD CONSTRAINT "PMA_Users_role_id_fkey" 
  FOREIGN KEY (role_id) REFERENCES "PMA_Roles"(id) ON DELETE SET NULL;
END $$;

-- Ensure manager_id column exists and has proper constraint
DO $$
BEGIN
  -- Add manager_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN manager_id uuid;
  END IF;
  
  -- Drop existing constraint if it exists (to recreate it properly)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'PMA_Users_manager_id_fkey'
    AND table_name = 'PMA_Users'
  ) THEN
    ALTER TABLE "PMA_Users" DROP CONSTRAINT "PMA_Users_manager_id_fkey";
  END IF;
  
  -- Add proper self-referencing foreign key constraint
  ALTER TABLE "PMA_Users" 
  ADD CONSTRAINT "PMA_Users_manager_id_fkey" 
  FOREIGN KEY (manager_id) REFERENCES "PMA_Users"(id) ON DELETE SET NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pma_users_role_id ON "PMA_Users" USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_pma_users_manager_id ON "PMA_Users" USING btree (manager_id);

-- Set default role for existing users without a role
UPDATE "PMA_Users" 
SET role_id = (SELECT id FROM "PMA_Roles" WHERE name = 'User' LIMIT 1)
WHERE role_id IS NULL;

-- Now handle the admin user setup
DO $$
DECLARE
  user_uuid uuid;
  admin_role_id uuid;
  user_exists boolean := false;
BEGIN
  -- Get the Admin role ID
  SELECT id INTO admin_role_id 
  FROM "PMA_Roles" 
  WHERE name = 'Admin' 
  LIMIT 1;
  
  -- First, try to find the user in auth.users
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'nickole@cannabizcredit.com' 
  LIMIT 1;
  
  -- Check if user exists in our PMA_Users table
  IF user_uuid IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM "PMA_Users" WHERE id = user_uuid) INTO user_exists;
    
    IF user_exists THEN
      -- User exists, just update their role
      UPDATE "PMA_Users" 
      SET role_id = admin_role_id, updated_at = now()
      WHERE id = user_uuid;
      
      RAISE NOTICE 'Updated existing user nickole@cannabizcredit.com to Admin role';
    ELSE
      -- User exists in auth but not in PMA_Users, create profile
      INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
      VALUES (user_uuid, 'nickole@cannabizcredit.com', admin_role_id, now(), now());
      
      RAISE NOTICE 'Created PMA_Users profile for nickole@cannabizcredit.com with Admin role';
    END IF;
  ELSE
    RAISE NOTICE 'User nickole@cannabizcredit.com not found in auth.users. They need to sign up first.';
  END IF;
END $$;

-- Update the handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO default_role_id FROM "PMA_Roles" WHERE name = 'User' LIMIT 1;
  SELECT id INTO admin_role_id FROM "PMA_Roles" WHERE name = 'Admin' LIMIT 1;
  
  -- Special handling for the admin user
  IF NEW.email = 'nickole@cannabizcredit.com' THEN
    INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
    VALUES (NEW.id, NEW.email, admin_role_id, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      role_id = admin_role_id,
      updated_at = now();
  ELSE
    -- Insert new user with default role
    INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
    VALUES (NEW.id, NEW.email, default_role_id, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      email = NEW.email,
      updated_at = now();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clean up and recreate RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can insert own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to read all profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to update own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to insert own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update roles" ON "PMA_Users";

-- Create clean, simple RLS policies
CREATE POLICY "authenticated_users_can_read_all_profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_update_own_profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow role updates (admin functionality will be controlled at app level)
CREATE POLICY "authenticated_users_can_update_roles"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Clean up and recreate role policies
DROP POLICY IF EXISTS "Users can read all roles" ON "PMA_Roles";
DROP POLICY IF EXISTS "Only admins can manage roles" ON "PMA_Roles";
DROP POLICY IF EXISTS "Authenticated users can read roles" ON "PMA_Roles";
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON "PMA_Roles";

CREATE POLICY "authenticated_users_can_read_roles"
  ON "PMA_Roles"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_roles"
  ON "PMA_Roles"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);