/*
  # Update PMA_Users policies to allow profile editing

  1. Policy Changes
    - Keep "admins_can_do_all" policy for full admin access
    - Keep "users_can_see_all" policy for viewing all profiles
    - Add "users_can_edit_own_profile" policy for users to edit their own profile (excluding role)

  2. Security
    - Users can only edit their own profile
    - Users cannot change their role_id or manager_id (admin-only fields)
    - Admins retain full control over all user data
*/

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "admins_can_do_all" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_see_all" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_edit_own_profile" ON "PMA_Users";

-- Policy 1: Admins can do everything
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

-- Policy 2: All users can see all profiles
CREATE POLICY "users_can_see_all"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Users can edit their own profile (except role and manager)
CREATE POLICY "users_can_edit_own_profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Ensure users cannot change their role_id or manager_id
    (
      role_id IS NOT DISTINCT FROM (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid()) AND
      manager_id IS NOT DISTINCT FROM (SELECT manager_id FROM "PMA_Users" WHERE id = auth.uid())
    )
  );

-- Policy 4: Allow users to insert their own profile (for new user creation)
CREATE POLICY "users_can_insert_own_profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);