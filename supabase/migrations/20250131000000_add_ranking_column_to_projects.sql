-- Add ranking column to PMA_Projects table for page-specific ordering
-- This uses JSONB to store rankings for different pages
-- Format: { "Product Dev Project Page": 1, "Sprint Review; Parking Lot": 2 }

ALTER TABLE "PMA_Projects"
ADD COLUMN IF NOT EXISTS ranking JSONB DEFAULT '{}'::jsonb;

-- Create an index on the ranking column for better performance
CREATE INDEX IF NOT EXISTS idx_pma_projects_ranking ON "PMA_Projects" USING GIN (ranking);

-- Add comment for documentation
COMMENT ON COLUMN "PMA_Projects".ranking IS 'JSONB column for page-specific project rankings. Format: { "page_name": rank_number }';

