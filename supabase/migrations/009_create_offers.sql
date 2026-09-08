-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    contract_template_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    sent_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (similar to other tables)
CREATE POLICY "Enable all access for offers"
    ON public.offers FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for efficient lookups by candidate
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON public.offers(candidate_id);
