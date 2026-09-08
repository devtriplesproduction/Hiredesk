-- Create employee_bonds table
CREATE TABLE IF NOT EXISTS public.employee_bonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT false,
    amount TEXT DEFAULT 'UNKNOWN',
    duration TEXT DEFAULT 'UNKNOWN',
    penalty TEXT DEFAULT 'UNKNOWN',
    compensation_formula TEXT DEFAULT 'UNKNOWN',
    breach_conditions TEXT DEFAULT 'UNKNOWN',
    legal_rules TEXT DEFAULT 'UNKNOWN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee_resignations table
CREATE TABLE IF NOT EXISTS public.employee_resignations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    resignation_reason TEXT NOT NULL,
    is_breach BOOLEAN NOT NULL DEFAULT false,
    breach_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_bonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_resignations ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to these tables (for admin dashboard via service role or general access logic)
CREATE POLICY "Enable all access for employee_bonds"
    ON public.employee_bonds FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for employee_resignations"
    ON public.employee_resignations FOR ALL
    USING (true)
    WITH CHECK (true);
