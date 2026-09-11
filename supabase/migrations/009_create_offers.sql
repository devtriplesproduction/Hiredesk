-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "candidateId" TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    "contractTemplateId" TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    "sentAt" TIMESTAMPTZ,
    "respondedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (similar to other tables)
CREATE POLICY "Enable all access for offers"
    ON public.offers FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for efficient lookups by candidate
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON public.offers("candidateId");
