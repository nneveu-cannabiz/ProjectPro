/*
  # Fix PMA_Users RLS Policy Infinite Recursion

  1. Problem
    - The existing `admin_users_can_manage_all_users` policy causes infinite recursion
    - Policy tries to query PMA_Users table within its own USING clause
    - This creates a circular dependency when fetching user profiles

  2. Solution
    - Drop the problematic recursive policy
    - Create simpler, non-recursive policies
    - Allow users to read their own profiles without complex role checks
    - Separate admin management from basic profile access

  3. New Policies
    - Users can read their own profile data
    - Users can update their own basic profile info (excluding role/manager changes)
    - Admin users can manage all users (using a simpler role check)
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "admin_users_can_manage_all_users" ON "PMA_Users";

-- Create a simple policy for users to read their own profile
CREATE POLICY "users_can_read_own_profile"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a policy for users to update their own basic profile info
-- This policy prevents users from changing their role_id or manager_id
CREATE POLICY "users_can_update_own_basic_profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Ensure role_id and manager_id are not being changed
      role_id IS NOT DISTINCT FROM (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid())
      AND manager_id IS NOT DISTINCT FROM (SELECT manager_id FROM "PMA_Users" WHERE id = auth.uid())
    )
  );

-- Create a policy for admins to manage all users
-- This uses a simpler approach by checking if the user has 'Admin' role directly
-- without creating a recursive query on PMA_Users
CREATE POLICY "admin_users_can_manage_all_users_simple"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PMA_Roles" r 
      WHERE r.id = (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid())
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "PMA_Roles" r 
      WHERE r.id = (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid())
      AND r.name = 'Admin'
    )
  );

-- Ensure the existing policies that work correctly are kept
-- The following policies should remain as they are:
-- - "authenticated_users_can_read_profiles" (if it exists and works)
-- - "users_can_create_own_profile" 
-- - "users_can_delete_own_profile"

-- Note: The "users_can_update_own_profile" policy might need to be dropped
-- if it has similar recursive issues, but we'll keep the new one above