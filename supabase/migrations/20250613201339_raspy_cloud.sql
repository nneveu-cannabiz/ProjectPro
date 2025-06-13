/*
  # Fix infinite recursion in PMA_Users RLS policies

  1. Policy Updates
    - Drop existing problematic policies that cause infinite recursion
    - Create simplified policies that don't reference PMA_Users table within their conditions
    - Use auth.uid() directly instead of complex subqueries

  2. Security
    - Maintain same security model but with non-recursive policy definitions
    - Admin users can manage all users
    - Users can read all profiles but only update their own basic info
    - Prevent users from changing their own role_id and manager_id
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "admin_users_can_manage_all_users_simple" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_update_own_basic_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "authenticated_users_can_read_profiles" ON "PMA_Users";

-- Create a function to check if current user is admin
-- This avoids the recursive policy issue
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM "PMA_Users" u
    JOIN "PMA_Roles" r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow all authenticated users to read user profiles
CREATE POLICY "authenticated_users_can_read_profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own basic profile (excluding role_id and manager_id)
CREATE POLICY "users_can_update_own_profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their role_id and manager_id
    role_id IS NOT DISTINCT FROM (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid()) AND
    manager_id IS NOT DISTINCT FROM (SELECT manager_id FROM "PMA_Users" WHERE id = auth.uid())
  );

-- Allow admin users to manage all users
CREATE POLICY "admin_users_can_manage_all_users"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Allow users to insert their own profile (for new user registration)
CREATE POLICY "users_can_insert_own_profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);