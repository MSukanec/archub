-- Add file_size column to design_documents table
ALTER TABLE design_documents 
ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0;