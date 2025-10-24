-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Documents table to store uploaded files
CREATE TABLE documents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Extracted content table for OCR and STT results
CREATE TABLE extracted_contents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id uuid REFERENCES documents(id),
    content_type TEXT NOT NULL,
    raw_content TEXT,
    processed_content TEXT,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table for AI-generated summaries
CREATE TABLE summaries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id uuid REFERENCES documents(id),
    summary_text TEXT NOT NULL,
    summary_type TEXT NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Processing history table
CREATE TABLE processing_history (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id uuid REFERENCES documents(id),
    process_type TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Update function for documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for documents table
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Indexes for better performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_extracted_contents_document_id ON extracted_contents(document_id);
CREATE INDEX idx_summaries_document_id ON summaries(document_id);
CREATE INDEX idx_processing_history_document_id ON processing_history(document_id);