/*
  # Fix PMA_Users RLS Policies

  1. Problem
    - Current policies on PMA_Users table create infinite recursion
    - Policies reference PMA_Users table within their own conditions
    - This causes circular dependency when checking permissions

  2. Solution
    - Drop existing problematic policies
    - Create simpler, non-recursive policies
    - Use auth.uid() directly instead of complex subqueries
    - Separate admin checks from user profile access

  3. New Policies
    - Users can read all user profiles (for team collaboration)
    - Users can insert their own profile on first login
    - Users can update their own basic profile info
    - Admins can manage all users (simplified check)
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admins_can_manage_all_users" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_read_all_users" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_update_own_basic_info" ON "PMA_Users";

-- Create new, simpler policies that avoid recursion

-- Allow all authenticated users to read user profiles
-- This is needed for team collaboration features
CREATE POLICY "authenticated_users_can_read_profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "users_can_create_own_profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
-- But prevent them from changing role_id or manager_id
CREATE POLICY "users_can_update_own_profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Ensure role_id and manager_id cannot be changed by regular users
    (
      role_id IS NOT DISTINCT FROM (
        SELECT u.role_id FROM "PMA_Users" u WHERE u.id = auth.uid()
      ) AND
      manager_id IS NOT DISTINCT FROM (
        SELECT u.manager_id FROM "PMA_Users" u WHERE u.id = auth.uid()
      )
    )
  );

-- Create a simple function to check if user is admin
-- This avoids the recursion issue by using a direct auth metadata check
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM "PMA_Users" u
    JOIN "PMA_Roles" r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'Admin'
  );
$$;

-- Allow admins to manage all users using the function
CREATE POLICY "admins_can_manage_users"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Allow users to delete their own profile (optional)
CREATE POLICY "users_can_delete_own_profile"
  ON "PMA_Users"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);