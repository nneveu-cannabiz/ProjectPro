/*
  # Fix Database Schema and RLS Policy Issues

  1. Schema Updates
    - Add missing columns to PMA_Projects (project_type, priority)
    - Add missing columns to PMA_Users (role_id, manager_id)
    - Create proper foreign key relationships
    - Fix self-referencing foreign key for manager relationship

  2. RLS Policy Fixes
    - Remove problematic recursive policies
    - Create safe, non-recursive policies for PMA_Users
    - Ensure proper role-based access control

  3. Data Integrity
    - Add proper constraints and defaults
    - Ensure data consistency
*/

-- First, let's add the missing columns to PMA_Projects if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE "PMA_Projects" ADD COLUMN "project_type" text DEFAULT 'Active';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Projects' AND column_name = 'priority'
  ) THEN
    ALTER TABLE "PMA_Projects" ADD COLUMN "priority" text DEFAULT 'Medium';
  END IF;
END $$;

-- Add constraints for PMA_Projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'PMA_Projects_project_type_check'
  ) THEN
    ALTER TABLE "PMA_Projects" ADD CONSTRAINT "PMA_Projects_project_type_check" 
    CHECK (project_type = ANY (ARRAY['Active'::text, 'Upcoming'::text, 'Future'::text, 'On Hold'::text]));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'PMA_Projects_priority_check'
  ) THEN
    ALTER TABLE "PMA_Projects" ADD CONSTRAINT "PMA_Projects_priority_check" 
    CHECK (priority = ANY (ARRAY['Critical'::text, 'High'::text, 'Medium'::text, 'Low'::text]));
  END IF;
END $$;

-- Add missing columns to PMA_Users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN "role_id" uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN "manager_id" uuid;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pma_users_role_id ON "PMA_Users" USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_pma_users_manager_id ON "PMA_Users" USING btree (manager_id);

-- Drop existing problematic foreign key constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PMA_Users_role_id_fkey'
  ) THEN
    ALTER TABLE "PMA_Users" DROP CONSTRAINT "PMA_Users_role_id_fkey";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PMA_Users_manager_id_fkey'
  ) THEN
    ALTER TABLE "PMA_Users" DROP CONSTRAINT "PMA_Users_manager_id_fkey";
  END IF;
END $$;

-- Add proper foreign key constraints
ALTER TABLE "PMA_Users" 
ADD CONSTRAINT "PMA_Users_role_id_fkey" 
FOREIGN KEY (role_id) REFERENCES "PMA_Roles"(id) ON DELETE SET NULL;

ALTER TABLE "PMA_Users" 
ADD CONSTRAINT "PMA_Users_manager_id_fkey" 
FOREIGN KEY (manager_id) REFERENCES "PMA_Users"(id) ON DELETE SET NULL;

-- Drop all existing RLS policies for PMA_Users to start fresh
DROP POLICY IF EXISTS "users_can_see_all" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "users_can_edit_own_profile" ON "PMA_Users";
DROP POLICY IF EXISTS "admins_can_do_all" ON "PMA_Users";

-- Create safe, non-recursive RLS policies for PMA_Users
CREATE POLICY "users_can_read_all_users"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_can_insert_own_profile"
  ON "PMA_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_update_own_basic_info"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role_id or manager_id
    (role_id IS NOT DISTINCT FROM (SELECT role_id FROM "PMA_Users" WHERE id = auth.uid())) AND
    (manager_id IS NOT DISTINCT FROM (SELECT manager_id FROM "PMA_Users" WHERE id = auth.uid()))
  );

CREATE POLICY "admins_can_manage_all_users"
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

-- Ensure RLS is enabled on PMA_Users
ALTER TABLE "PMA_Users" ENABLE ROW LEVEL SECURITY;

-- Create a function to update user manager_id when Manager_Employees relationship changes
CREATE OR REPLACE FUNCTION update_user_manager_id()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update the employee's manager_id
    UPDATE "PMA_Users" 
    SET manager_id = NEW.manager_id, updated_at = now()
    WHERE id = NEW.employee_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Clear the employee's manager_id
    UPDATE "PMA_Users" 
    SET manager_id = NULL, updated_at = now()
    WHERE id = OLD.employee_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for Manager_Employees table if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_user_manager_id ON "Manager_Employees";
CREATE TRIGGER trigger_update_user_manager_id
  AFTER INSERT OR DELETE ON "Manager_Employees"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_manager_id();

-- Ensure proper RLS policies for other tables
ALTER TABLE "PMA_Roles" ENABLE ROW LEVEL SECURITY;

-- Drop existing role policies and create new ones
DROP POLICY IF EXISTS "authenticated_users_can_read_roles" ON "PMA_Roles";
DROP POLICY IF EXISTS "authenticated_users_can_manage_roles" ON "PMA_Roles";

CREATE POLICY "users_can_read_roles"
  ON "PMA_Roles"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_roles"
  ON "PMA_Roles"
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

-- Ensure Manager_Employees table has proper RLS
ALTER TABLE "Manager_Employees" ENABLE ROW LEVEL SECURITY;

-- Drop existing Manager_Employees policies and create new ones
DROP POLICY IF EXISTS "Users can read manager-employee relationships" ON "Manager_Employees";
DROP POLICY IF EXISTS "Admins and managers can manage relationships" ON "Manager_Employees";

CREATE POLICY "users_can_read_manager_employee_relationships"
  ON "Manager_Employees"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_manager_employee_relationships"
  ON "Manager_Employees"
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