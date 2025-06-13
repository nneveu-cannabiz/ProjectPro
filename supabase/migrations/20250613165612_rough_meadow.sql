/*
  # Create automatic user profile creation trigger
  
  1. New Functions
    - `handle_new_user()` - Function to automatically create PMA_Users record when auth user is created
  
  2. Triggers
    - Trigger on auth.users table to call handle_new_user() on INSERT
  
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only creates records for new authenticated users
  
  4. Notes
    - Automatically extracts email from auth.users
    - Sets default profile color to blue (#2563eb)
    - Handles any errors gracefully
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into PMA_Users table
  INSERT INTO public."PMA_Users" (
    id,
    email,
    profile_color,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    '#2563eb',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create PMA_Users record for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public."PMA_Users" TO postgres, anon, authenticated, service_role;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully created user trigger function and trigger';
END $$;