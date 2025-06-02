-- One-time SQL script to migrate users from auth.users to PMA_Users table
-- Run this script in the Supabase SQL Editor

-- Insert users from auth.users into PMA_Users if they don't already exist
INSERT INTO "public"."PMA_Users" (
  "id", 
  "first_name", 
  "last_name", 
  "email", 
  "profile_color", 
  "created_at", 
  "updated_at"
)
SELECT 
  au.id,
  (au.raw_user_meta_data->>'firstName')::text AS first_name,
  (au.raw_user_meta_data->>'lastName')::text AS last_name,
  au.email,
  COALESCE((au.raw_user_meta_data->>'profileColor')::text, '#2563eb') AS profile_color,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN "public"."PMA_Users" pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Log count of migrated users
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM "public"."PMA_Users";
  RAISE NOTICE 'Successfully migrated % users to PMA_Users table', user_count;
END $$;