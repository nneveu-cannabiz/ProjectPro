-- Add ranking column to PMA_Sprints table for sprint group ordering
ALTER TABLE "PMA_Sprints"
ADD COLUMN IF NOT EXISTS ranking JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_pma_sprints_ranking ON "PMA_Sprints" USING GIN (ranking);

-- Add comment for documentation
COMMENT ON COLUMN "PMA_Sprints".ranking IS 'Stores sprint-specific rankings in format: {"Sprint: Sprint 1": 1, "Sprint: Sprint 2": 2}';

