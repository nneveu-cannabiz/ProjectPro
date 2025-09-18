-- Add image_attachment_url column to PMA_Requests table
ALTER TABLE public."PMA_Requests" 
ADD COLUMN image_attachment_url text NULL;

-- Add comment to describe the column
COMMENT ON COLUMN public."PMA_Requests".image_attachment_url IS 'URL to uploaded image attachment stored in Supabase Storage';

-- Create index for potential queries on image attachments
CREATE INDEX IF NOT EXISTS idx_pma_requests_image_attachment 
ON public."PMA_Requests" (image_attachment_url) 
WHERE image_attachment_url IS NOT NULL;
