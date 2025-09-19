-- Create PMA_Requests table for tracking team requests to product development
CREATE TABLE IF NOT EXISTS PMA_Requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request basic info
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('bug', 'task', 'project', 'question', 'support', 'feature_request', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Submitter information
    submitter_name VARCHAR(255) NOT NULL,
    submitter_email VARCHAR(255) NOT NULL,
    submitter_department VARCHAR(100),
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'in_progress', 'completed', 'rejected', 'on_hold')),
    
    -- Assignment and handling
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Additional details
    expected_completion_date DATE,
    actual_completion_date DATE,
    
    -- Internal notes (only visible to product dev team)
    internal_notes TEXT,
    
    -- External communication (visible to submitter)
    response_notes TEXT,
    
    -- Attachments/references
    related_project_id UUID,
    external_reference VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pma_requests_status ON PMA_Requests(status);
CREATE INDEX IF NOT EXISTS idx_pma_requests_type ON PMA_Requests(request_type);
CREATE INDEX IF NOT EXISTS idx_pma_requests_priority ON PMA_Requests(priority);
CREATE INDEX IF NOT EXISTS idx_pma_requests_submitter_email ON PMA_Requests(submitter_email);
CREATE INDEX IF NOT EXISTS idx_pma_requests_assigned_to ON PMA_Requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pma_requests_created_at ON PMA_Requests(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pma_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_pma_requests_updated_at
    BEFORE UPDATE ON PMA_Requests
    FOR EACH ROW
    EXECUTE FUNCTION update_pma_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE PMA_Requests ENABLE ROW LEVEL SECURITY;

-- Policy for public submission (anyone can insert)
CREATE POLICY "Anyone can submit requests" ON PMA_Requests
    FOR INSERT WITH CHECK (true);

-- Policy for authenticated users to view and update (product dev team)
CREATE POLICY "Authenticated users can view all requests" ON PMA_Requests
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update requests" ON PMA_Requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE PMA_Requests IS 'Table for tracking requests submitted to the product development team';
COMMENT ON COLUMN PMA_Requests.request_type IS 'Type of request: bug, task, project, question, support, feature_request, other';
COMMENT ON COLUMN PMA_Requests.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN PMA_Requests.status IS 'Current status: submitted, in_review, in_progress, completed, rejected, on_hold';
COMMENT ON COLUMN PMA_Requests.internal_notes IS 'Internal notes only visible to product dev team';
COMMENT ON COLUMN PMA_Requests.response_notes IS 'Response notes that can be shared with submitter';
