/*
  # Fix PMA_Users policies and set admin user

  1. Policy Changes
    - Drop all existing policies on PMA_Users table
    - Create two simple policies:
      - Admins can do all operations
      - Users can read all profiles
  
  2. Admin User Setup
    - Update nickole@cannabizcredit.com to have Admin role
    - Handle case where user might not exist yet
*/

-- First, drop ALL existing policies on PMA_Users to start completely fresh
DROP POLICY IF EXISTS "Users can read all profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Admins and managers can manage all users" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to read all profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to update own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to insert own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update roles" ON "PMA_Users";
DROP POLICY IF EXISTS "authenticated_users_can_read_all_profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_update_own_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "authenticated_users_can_update_roles" ON "PMA_Users";

-- Create the two simple policies as requested
CREATE POLICY "admins_can_do_all"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'Admin'
    )
  );

CREATE POLICY "users_can_see_all"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure Admin role exists
INSERT INTO "PMA_Roles" (name, description, permissions, is_system_role, created_at, updated_at)
VALUES (
  'Admin',
  'System administrator with full access',
  '{"all": true, "manage_users": true, "manage_roles": true, "manage_projects": true}'::jsonb,
  true,
  now(),
  now()
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = now();

-- Update nickole@cannabizcredit.com to be an admin
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
  
  -- Try to find the user in auth.users
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'nickole@cannabizcredit.com' 
  LIMIT 1;
  
  IF user_uuid IS NOT NULL AND admin_role_id IS NOT NULL THEN
    -- Check if user exists in PMA_Users
    SELECT EXISTS(SELECT 1 FROM "PMA_Users" WHERE id = user_uuid) INTO user_exists;
    
    IF user_exists THEN
      -- User exists, update their role
      UPDATE "PMA_Users" 
      SET role_id = admin_role_id, updated_at = now()
      WHERE id = user_uuid;
      
      RAISE NOTICE 'Updated nickole@cannabizcredit.com to Admin role';
    ELSE
      -- User exists in auth but not in PMA_Users, create profile
      INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
      VALUES (user_uuid, 'nickole@cannabizcredit.com', admin_role_id, now(), now());
      
      RAISE NOTICE 'Created Admin profile for nickole@cannabizcredit.com';
    END IF;
  ELSE
    RAISE NOTICE 'User or Admin role not found. User may need to sign up first.';
  END IF;
END $$;

-- Update the handle_new_user function to automatically assign Admin role to nickole@cannabizcredit.com
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
      email = NEW.email,
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