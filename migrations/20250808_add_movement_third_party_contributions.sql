-- Migration: Add movement_third_party_contributions table
-- Date: 2025-08-08
-- Description: Create junction table to separate third-party relationships from movements table

CREATE TABLE movement_third_party_contributions (
    movement_id UUID NOT NULL,
    third_party_id UUID NOT NULL,
    receipt_number TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (movement_id, third_party_id),
    FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE,
    FOREIGN KEY (third_party_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX idx_movement_third_party_contributions_movement_id ON movement_third_party_contributions(movement_id);
CREATE INDEX idx_movement_third_party_contributions_third_party_id ON movement_third_party_contributions(third_party_id);

-- Migrate existing data from movements table where contact_id is not null
INSERT INTO movement_third_party_contributions (movement_id, third_party_id, created_at, updated_at)
SELECT 
    id as movement_id,
    contact_id as third_party_id,
    created_at,
    updated_at
FROM movements 
WHERE contact_id IS NOT NULL;