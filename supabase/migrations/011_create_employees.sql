-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    bond_requirement TEXT DEFAULT 'UNKNOWN',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'on_leave')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to employees table
-- Admin dashboard relies on this being accessible similar to candidates table.
CREATE POLICY "Enable all access for employees"
    ON public.employees FOR ALL
    USING (true)
    WITH CHECK (true);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_employees_candidate_id ON public.employees(candidate_id);
