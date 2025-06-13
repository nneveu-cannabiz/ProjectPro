/*
  # Add user roles and role management system

  1. New Tables
    - `PMA_Roles` - Stores available roles in the system
    - Add `role_id` column to `PMA_Users` table
  
  2. Default Roles
    - Admin: Full system access
    - Manager: Project and team management
    - User: Basic user access
    - Developer: Development-focused access
  
  3. Security
    - Enable RLS on PMA_Roles table
    - Add policies for role management
    - Update PMA_Users policies
  
  4. Updates
    - Update the user creation trigger to assign default "User" role
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS "PMA_Roles" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE "PMA_Roles" ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO "PMA_Roles" (name, description, is_system_role) VALUES
  ('Admin', 'Full system access and administration', true),
  ('Manager', 'Project and team management capabilities', true),
  ('User', 'Basic user access to assigned projects', true),
  ('Developer', 'Development-focused access with technical capabilities', true)
ON CONFLICT (name) DO NOTHING;

-- Add role_id column to PMA_Users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN role_id uuid REFERENCES "PMA_Roles"(id);
  END IF;
END $$;

-- Set default role for existing users (User role)
UPDATE "PMA_Users" 
SET role_id = (SELECT id FROM "PMA_Roles" WHERE name = 'User' LIMIT 1)
WHERE role_id IS NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pma_users_role'
  ) THEN
    ALTER TABLE "PMA_Users" 
    ADD CONSTRAINT fk_pma_users_role 
    FOREIGN KEY (role_id) REFERENCES "PMA_Roles"(id);
  END IF;
END $$;

-- Create policies for PMA_Roles
CREATE POLICY "Users can read all roles"
  ON "PMA_Roles"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage roles"
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

-- Update PMA_Users policies to include role-based access
DROP POLICY IF EXISTS "CCC users can manage CCA members" ON "PMA_Users";
DROP POLICY IF EXISTS "Allow authenticated users full access to user profiles" ON "PMA_Users";

CREATE POLICY "Users can read all user profiles"
  ON "PMA_Users"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON "PMA_Users"
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins and managers can manage all users"
  ON "PMA_Users"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('Admin', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "PMA_Users" u
      JOIN "PMA_Roles" r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('Admin', 'Manager')
    )
  );

-- Update the handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Get the default "User" role ID
  SELECT id INTO default_role_id FROM "PMA_Roles" WHERE name = 'User' LIMIT 1;
  
  -- Insert new user with default role
  INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    default_role_id,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pma_users_role_id ON "PMA_Users"(role_id);
CREATE INDEX IF NOT EXISTS idx_pma_roles_name ON "PMA_Roles"(name);