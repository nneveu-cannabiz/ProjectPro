/*
  # Team Management Schema

  1. New Tables
    - `Manager_Employees` - tracks manager-employee relationships
  
  2. Security
    - Enable RLS on new table
    - Add policies for role-based access
  
  3. Changes
    - Add manager_id column to PMA_Users for tracking employee assignments
*/

-- Add manager_id column to PMA_Users to track which manager an employee reports to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PMA_Users' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE "PMA_Users" ADD COLUMN manager_id uuid REFERENCES "PMA_Users"(id);
  END IF;
END $$;

-- Create Manager_Employees table for explicit manager-employee relationships
CREATE TABLE IF NOT EXISTS "Manager_Employees" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES "PMA_Users"(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES "PMA_Users"(id) ON DELETE CASCADE,
  assigned_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(manager_id, employee_id)
);

-- Enable RLS on Manager_Employees table
ALTER TABLE "Manager_Employees" ENABLE ROW LEVEL SECURITY;

-- Create policies for Manager_Employees
CREATE POLICY "Users can read manager-employee relationships"
  ON "Manager_Employees"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage relationships"
  ON "Manager_Employees"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manager_employees_manager_id ON "Manager_Employees"(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_employees_employee_id ON "Manager_Employees"(employee_id);
CREATE INDEX IF NOT EXISTS idx_pma_users_manager_id ON "PMA_Users"(manager_id);

-- Function to automatically update manager_id when Manager_Employees relationship is created
CREATE OR REPLACE FUNCTION update_user_manager_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the employee's manager_id when a new relationship is created
  IF TG_OP = 'INSERT' THEN
    UPDATE "PMA_Users" 
    SET manager_id = NEW.manager_id, updated_at = now()
    WHERE id = NEW.employee_id;
    RETURN NEW;
  END IF;
  
  -- Clear the employee's manager_id when relationship is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE "PMA_Users" 
    SET manager_id = NULL, updated_at = now()
    WHERE id = OLD.employee_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update manager_id
CREATE TRIGGER trigger_update_user_manager_id
  AFTER INSERT OR DELETE ON "Manager_Employees"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_manager_id();