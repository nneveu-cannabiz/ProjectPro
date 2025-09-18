-- Create storage bucket for PMA attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pma-attachments',
  'pma-attachments',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: RLS is already enabled on storage.objects by default in Supabase
-- We don't need to enable it manually

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public uploads to pma-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from pma-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update pma-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete pma-attachments" ON storage.objects;

-- Create policy to allow anyone to upload to pma-attachments bucket
CREATE POLICY "Allow public uploads to pma-attachments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'pma-attachments');

-- Create policy to allow anyone to read from pma-attachments bucket (since it's public)
CREATE POLICY "Allow public reads from pma-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pma-attachments');

-- Create policy to allow authenticated users to update their own uploads (optional, for future use)
CREATE POLICY "Allow authenticated users to update pma-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'pma-attachments');

-- Create policy to allow authenticated users to delete their uploads (optional, for future use)
CREATE POLICY "Allow authenticated users to delete pma-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pma-attachments');
