-- PMA_Users table for user profiles
CREATE TABLE IF NOT EXISTS "PMA_Users" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id),
  "first_name" TEXT,
  "last_name" TEXT,
  "email" TEXT NOT NULL,
  "profile_color" TEXT NOT NULL DEFAULT '#2563eb',
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Set up RLS policies
ALTER TABLE "PMA_Users" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON "PMA_Users"
  FOR SELECT TO authenticated USING (auth.uid() = id);
  
CREATE POLICY "Users can update their own profile" ON "PMA_Users"
  FOR UPDATE TO authenticated USING (auth.uid() = id);
  
CREATE POLICY "Users can insert their own profile" ON "PMA_Users"
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);