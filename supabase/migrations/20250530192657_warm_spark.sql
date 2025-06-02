-- First, disable and remove all existing RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON "PMA_Projects";
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON "PMA_Projects";
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON "PMA_Projects";
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON "PMA_Projects";

DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON "PMA_Tasks";
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON "PMA_Tasks";
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON "PMA_Tasks";
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON "PMA_Tasks";

DROP POLICY IF EXISTS "Allow authenticated users to read subtasks" ON "PMA_SubTasks";
DROP POLICY IF EXISTS "Allow authenticated users to insert subtasks" ON "PMA_SubTasks";
DROP POLICY IF EXISTS "Allow authenticated users to update subtasks" ON "PMA_SubTasks";
DROP POLICY IF EXISTS "Allow authenticated users to delete subtasks" ON "PMA_SubTasks";

DROP POLICY IF EXISTS "Allow authenticated users to read updates" ON "PMA_Updates";
DROP POLICY IF EXISTS "Allow authenticated users to insert updates" ON "PMA_Updates";
DROP POLICY IF EXISTS "Allow authenticated users to update updates" ON "PMA_Updates";
DROP POLICY IF EXISTS "Allow authenticated users to delete updates" ON "PMA_Updates";

DROP POLICY IF EXISTS "Users can view their own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "PMA_Users";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "PMA_Users";

-- Create a single all-access policy for each table
CREATE POLICY "Allow authenticated users full access to projects" 
ON "PMA_Projects" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to tasks" 
ON "PMA_Tasks" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to subtasks" 
ON "PMA_SubTasks" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to updates" 
ON "PMA_Updates" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to user profiles" 
ON "PMA_Users" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Log completion of policy updates
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated RLS policies for all tables';
END $$;