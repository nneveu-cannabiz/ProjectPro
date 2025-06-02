-- Create tables for Project Management App

-- PMA_Projects table
CREATE TABLE IF NOT EXISTS "PMA_Projects" (
  "id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('todo', 'in-progress', 'done')),
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- PMA_Tasks table
CREATE TABLE IF NOT EXISTS "PMA_Tasks" (
  "id" UUID PRIMARY KEY,
  "project_id" UUID NOT NULL REFERENCES "PMA_Projects"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "task_type" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('todo', 'in-progress', 'done')),
  "assignee_id" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- PMA_SubTasks table
CREATE TABLE IF NOT EXISTS "PMA_SubTasks" (
  "id" UUID PRIMARY KEY,
  "task_id" UUID NOT NULL REFERENCES "PMA_Tasks"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "task_type" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('todo', 'in-progress', 'done')),
  "assignee_id" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- PMA_Updates table
CREATE TABLE IF NOT EXISTS "PMA_Updates" (
  "id" UUID PRIMARY KEY,
  "message" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL CHECK ("entity_type" IN ('project', 'task', 'subtask')),
  "entity_id" UUID NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "PMA_Tasks"("project_id");
CREATE INDEX IF NOT EXISTS "idx_subtasks_task_id" ON "PMA_SubTasks"("task_id");
CREATE INDEX IF NOT EXISTS "idx_updates_entity" ON "PMA_Updates"("entity_type", "entity_id");

-- Add Row Level Security policies
ALTER TABLE "PMA_Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PMA_Tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PMA_SubTasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PMA_Updates" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read projects" ON "PMA_Projects"
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to insert projects" ON "PMA_Projects"
  FOR INSERT TO authenticated WITH CHECK (true);
  
CREATE POLICY "Allow authenticated users to update projects" ON "PMA_Projects"
  FOR UPDATE TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to delete projects" ON "PMA_Projects"
  FOR DELETE TO authenticated USING (true);

-- Similar policies for tasks
CREATE POLICY "Allow authenticated users to read tasks" ON "PMA_Tasks"
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to insert tasks" ON "PMA_Tasks"
  FOR INSERT TO authenticated WITH CHECK (true);
  
CREATE POLICY "Allow authenticated users to update tasks" ON "PMA_Tasks"
  FOR UPDATE TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to delete tasks" ON "PMA_Tasks"
  FOR DELETE TO authenticated USING (true);

-- Similar policies for subtasks
CREATE POLICY "Allow authenticated users to read subtasks" ON "PMA_SubTasks"
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to insert subtasks" ON "PMA_SubTasks"
  FOR INSERT TO authenticated WITH CHECK (true);
  
CREATE POLICY "Allow authenticated users to update subtasks" ON "PMA_SubTasks"
  FOR UPDATE TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to delete subtasks" ON "PMA_SubTasks"
  FOR DELETE TO authenticated USING (true);

-- Similar policies for updates
CREATE POLICY "Allow authenticated users to read updates" ON "PMA_Updates"
  FOR SELECT TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to insert updates" ON "PMA_Updates"
  FOR INSERT TO authenticated WITH CHECK (true);
  
CREATE POLICY "Allow authenticated users to update updates" ON "PMA_Updates"
  FOR UPDATE TO authenticated USING (true);
  
CREATE POLICY "Allow authenticated users to delete updates" ON "PMA_Updates"
  FOR DELETE TO authenticated USING (true);