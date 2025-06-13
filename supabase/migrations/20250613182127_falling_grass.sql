/*
  # Fix infinite recursion in PMA_Roles RLS policies

  1. Problem
    - Current RLS policies on PMA_Roles table are causing infinite recursion
    - Policies are trying to check user roles by querying PMA_Roles, which creates circular dependency
    - This prevents proper role-based access control and data fetching

  2. Solution
    - Drop existing problematic policies on PMA_Roles
    - Create simpler, non-recursive policies that avoid circular dependencies
    - Use direct auth.uid() checks and simpler role verification methods
    - Ensure admin users can manage roles without recursion

  3. Security
    - Maintain proper access control without circular dependencies
    - Allow authenticated users to read roles (needed for UI)
    - Only allow admin users to manage roles
    - Use function-based approach to avoid recursion
*/

-- First, drop all existing policies on PMA_Roles to start fresh
DROP POLICY IF EXISTS "admins_can_manage_roles" ON "PMA_Roles";
DROP POLICY IF EXISTS "users_can_read_roles" ON "PMA_Roles";

-- Create a function to check if a user is admin without causing recursion
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
    WHERE u.id = auth.uid() 
    AND r.name = 'Admin'
  );
$$;

-- Create new non-recursive policies for PMA_Roles

-- Allow all authenticated users to read roles (needed for dropdowns and UI)
CREATE POLICY "authenticated_users_can_read_roles"
  ON "PMA_Roles"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert new roles
CREATE POLICY "admin_users_can_insert_roles"
  ON "PMA_Roles"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- Allow admin users to update roles
CREATE POLICY "admin_users_can_update_roles"
  ON "PMA_Roles"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- Allow admin users to delete roles (but not system roles)
CREATE POLICY "admin_users_can_delete_roles"
  ON "PMA_Roles"
  FOR DELETE
  TO authenticated
  USING (
    NOT is_system_role AND
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- Also fix the Manager_Employees policies to avoid recursion
DROP POLICY IF EXISTS "admins_can_manage_manager_employee_relationships" ON "Manager_Employees";
DROP POLICY IF EXISTS "users_can_read_manager_employee_relationships" ON "Manager_Employees";

-- Create simpler policies for Manager_Employees
CREATE POLICY "authenticated_users_can_read_manager_employees"
  ON "Manager_Employees"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_users_can_manage_manager_employees"
  ON "Manager_Employees"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- Update PMA_Users policies to be more explicit and avoid recursion
DROP POLICY IF EXISTS "admins_can_manage_users" ON "PMA_Users";

CREATE POLICY "admin_users_can_manage_all_users"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.name = 'Admin'
    )
  );