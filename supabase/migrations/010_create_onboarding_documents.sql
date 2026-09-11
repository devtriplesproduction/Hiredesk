-- Create candidate_documents table
CREATE TABLE IF NOT EXISTS public.candidate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to candidate_documents table
-- Admin dashboard uses authenticated or public depending on setup. Let's allow public for consistency with candidates table.
-- Wait, candidates table has "Enable all access for candidates" USING (true) WITH CHECK (true)
CREATE POLICY "Enable all access for candidate_documents"
    ON public.candidate_documents FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for efficient lookups by candidate
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id ON public.candidate_documents("candidateId");

-- Create secure onboarding-docs bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('onboarding-docs', 'onboarding-docs', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for onboarding-docs
-- Allow authenticated users to view, update, delete
CREATE POLICY "Allow select for authenticated onboarding-docs" 
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'onboarding-docs');

CREATE POLICY "Allow update for authenticated onboarding-docs" 
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'onboarding-docs');

CREATE POLICY "Allow delete for authenticated onboarding-docs" 
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'onboarding-docs');

-- Service role will bypass RLS for inserts on the API side.
