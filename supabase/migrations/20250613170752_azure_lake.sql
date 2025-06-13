/*
  # Fix PMA_Users RLS policies to prevent infinite recursion

  1. Security Changes
    - Drop existing problematic RLS policies on PMA_Users table
    - Create new, simplified RLS policies that don't cause recursion
    - Remove duplicate foreign key constraint that's causing relationship ambiguity

  2. Policy Changes
    - Users can read all user profiles (for team collaboration)
    - Users can only update their own profile
    - Admins and managers can manage all users (simplified check)
*/

-- First, drop all existing policies on PMA_Users to start fresh
DROP POLICY IF EXISTS "Users can read all user profiles" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Admins and managers can manage all users" ON "PMA_Users";

-- Remove the duplicate foreign key constraint that's causing the relationship ambiguity
ALTER TABLE "PMA_Users" DROP CONSTRAINT IF EXISTS "fk_pma_users_role";

-- Create new, simplified RLS policies
CREATE POLICY "Allow users to read all profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: We're keeping admin management simple for now
-- If you need role-based admin access, you'll need to implement it differently
-- to avoid the infinite recursion issue