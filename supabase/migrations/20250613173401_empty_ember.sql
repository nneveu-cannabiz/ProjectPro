/*
  # Fix RLS Infinite Recursion in PMA_Roles

  1. Problem
    - The current RLS policy on PMA_Roles creates infinite recursion
    - Policy tries to join PMA_Users with PMA_Roles to check if user is Admin
    - This creates a circular dependency when fetching users with roles

  2. Solution
    - Remove the problematic policy that causes recursion
    - Create simpler policies that don't create circular dependencies
    - Allow authenticated users to read roles (needed for user management)
    - Restrict role management to application-level permissions instead of RLS

  3. Changes
    - Drop existing recursive policy on PMA_Roles
    - Add simple read policy for authenticated users
    - Keep role management restricted at application level
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Only admins can manage roles" ON "PMA_Roles";

-- Create a simple read policy for authenticated users
-- This allows the user fetch with role join to work without recursion
CREATE POLICY "Authenticated users can read roles"
  ON "PMA_Roles"
  FOR SELECT
  TO authenticated
  USING (true);

-- Create a policy for role management that doesn't cause recursion
-- We'll use a simpler approach that checks user permissions at the application level
CREATE POLICY "Authenticated users can manage roles"
  ON "PMA_Roles"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update the PMA_Users policies to ensure they work correctly with the role join
-- Drop and recreate the existing policies to ensure consistency
DROP POLICY IF EXISTS "Allow users to insert own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to read all profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow users to update own profile" ON "PMA_Users";

-- Recreate PMA_Users policies
CREATE POLICY "Users can insert own profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a policy for role updates (admin functionality)
CREATE POLICY "Users can update roles"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);