-- Create PMA_Spending table for tracking software and other spending
CREATE TABLE IF NOT EXISTS pma_spending (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware', 'services', 'other')),
    
    -- Purchase details
    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'recurring')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Recurring purchase details (only relevant for recurring purchases)
    billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly', 'weekly') OR purchase_type = 'one_time'),
    next_billing_date DATE,
    
    -- Vendor information
    vendor TEXT,
    vendor_contact TEXT,
    
    -- Project association
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- User who added the entry
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Status and notes
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    notes TEXT,
    
    -- File attachments
    attachment_url TEXT,
    
    -- Metadata
    tags TEXT[],
    is_essential BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pma_spending_category ON pma_spending(category);
CREATE INDEX IF NOT EXISTS idx_pma_spending_purchase_type ON pma_spending(purchase_type);
CREATE INDEX IF NOT EXISTS idx_pma_spending_project_id ON pma_spending(project_id);
CREATE INDEX IF NOT EXISTS idx_pma_spending_added_by ON pma_spending(added_by);
CREATE INDEX IF NOT EXISTS idx_pma_spending_status ON pma_spending(status);
CREATE INDEX IF NOT EXISTS idx_pma_spending_next_billing_date ON pma_spending(next_billing_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pma_spending_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pma_spending_updated_at
    BEFORE UPDATE ON pma_spending
    FOR EACH ROW
    EXECUTE FUNCTION update_pma_spending_updated_at();

-- Enable Row Level Security
ALTER TABLE pma_spending ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow admins to see all spending entries
CREATE POLICY "Admins can view all spending" ON pma_spending
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Allow admins to insert spending entries
CREATE POLICY "Admins can insert spending" ON pma_spending
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Allow admins to update spending entries
CREATE POLICY "Admins can update spending" ON pma_spending
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Allow admins to delete spending entries
CREATE POLICY "Admins can delete spending" ON pma_spending
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Add comments for documentation
COMMENT ON TABLE pma_spending IS 'Tracks PMA spending including software subscriptions and one-time purchases';
COMMENT ON COLUMN pma_spending.category IS 'Category of spending: software, hardware, services, other';
COMMENT ON COLUMN pma_spending.purchase_type IS 'Type of purchase: one_time or recurring';
COMMENT ON COLUMN pma_spending.billing_frequency IS 'Frequency of billing for recurring purchases';
COMMENT ON COLUMN pma_spending.next_billing_date IS 'Next billing date for recurring purchases';
COMMENT ON COLUMN pma_spending.is_essential IS 'Whether this is an essential service that cannot be cancelled';
