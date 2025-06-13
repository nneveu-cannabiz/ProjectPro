/*
  # Assign Admin Role to Specific User

  1. Updates
    - Find user with email 'nickole@cannabizcredit.com'
    - Assign them the Admin role
    - Create the user profile if it doesn't exist

  2. Security
    - This is a one-time administrative migration
    - Ensures the specified user has admin privileges
*/

-- First, ensure the Admin role exists
INSERT INTO "PMA_Roles" (name, description, is_system_role) 
VALUES ('Admin', 'Full system access and administration', true)
ON CONFLICT (name) DO NOTHING;

-- Find the user by email from the auth.users table and update their role
-- If the user doesn't exist in PMA_Users, create their profile
DO $$
DECLARE
  user_uuid uuid;
  admin_role_id uuid;
BEGIN
  -- Get the user ID from auth.users table
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'nickole@cannabizcredit.com' 
  LIMIT 1;
  
  -- Get the Admin role ID
  SELECT id INTO admin_role_id 
  FROM "PMA_Roles" 
  WHERE name = 'Admin' 
  LIMIT 1;
  
  -- If user exists in auth.users
  IF user_uuid IS NOT NULL AND admin_role_id IS NOT NULL THEN
    -- Insert or update the user in PMA_Users with Admin role
    INSERT INTO "PMA_Users" (id, email, role_id, created_at, updated_at)
    VALUES (
      user_uuid,
      'nickole@cannabizcredit.com',
      admin_role_id,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role_id = admin_role_id,
      updated_at = now();
    
    RAISE NOTICE 'Successfully assigned Admin role to user: nickole@cannabizcredit.com';
  ELSE
    RAISE NOTICE 'User not found in auth.users or Admin role not found. User may need to sign up first.';
  END IF;
END $$;