-- 1. candidates
CREATE TABLE public.candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  score JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'review', 'shortlisted', 'interview_1', 'interview_2', 'approved', 'rejected', 'offer', 'offer_sent', 'offer_accepted', 'offer_rejected', 'onboarding_requested', 'onboarding_review', 'onboarding_verified', 'onboarding_rejected', 'hired')),
  city TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER NOT NULL,
  exp TEXT NOT NULL,
  education TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  "resumeFile" TEXT NOT NULL,
  "resumeUrl" TEXT,
  "resumeText" TEXT,
  "appliedAt" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT NOT NULL,
  "extractionSource" TEXT,
  "extractionConfidence" NUMERIC,
  "extractionMetadata" JSONB
);

CREATE INDEX idx_candidates_role_id ON public.candidates("roleId");
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_candidates_created_at ON public.candidates("createdAt" DESC);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.candidates FOR DELETE TO authenticated USING (true);

-- 2. roles
CREATE TABLE public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  count INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.roles FOR DELETE TO authenticated USING (true);

-- 3. contracts
CREATE TABLE public.contracts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.contracts FOR DELETE TO authenticated USING (true);

-- 4. interviews
CREATE TABLE public.interviews (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id),
  round INTEGER NOT NULL CHECK (round IN (1, 2)),
  "scheduledAt" TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT NOT NULL,
  decision TEXT CHECK (decision IN ('select', 'reject', 'round2_required')),
  "createdAt" TEXT NOT NULL
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.interviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.interviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.interviews FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.interviews FOR DELETE TO authenticated USING (true);

-- 5. offers
CREATE TABLE public.offers (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id),
  "contractTemplateId" TEXT REFERENCES public.contracts(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  "sentAt" TEXT,
  "respondedAt" TEXT,
  "createdAt" TEXT NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.offers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.offers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.offers FOR DELETE TO authenticated USING (true);

-- 6. candidate_documents (Fixed to camelCase)
CREATE TABLE public.candidate_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id),
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.candidate_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.candidate_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.candidate_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.candidate_documents FOR DELETE TO authenticated USING (true);

-- 7. employees
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES public.candidates(id),
  offer_id TEXT REFERENCES public.offers(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  bond_requirement TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'terminated', 'on_leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.employees FOR DELETE TO authenticated USING (true);

-- 8. employee_bonds
CREATE TABLE public.employee_bonds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id),
  is_required BOOLEAN NOT NULL,
  amount TEXT NOT NULL,
  duration TEXT NOT NULL,
  penalty TEXT NOT NULL,
  compensation_formula TEXT NOT NULL,
  breach_conditions TEXT NOT NULL,
  legal_rules TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.employee_bonds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.employee_bonds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.employee_bonds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.employee_bonds FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.employee_bonds FOR DELETE TO authenticated USING (true);

-- 9. employee_resignations
CREATE TABLE public.employee_resignations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id),
  resignation_reason TEXT NOT NULL,
  is_breach BOOLEAN NOT NULL,
  breach_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.employee_resignations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.employee_resignations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated users" ON public.employee_resignations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON public.employee_resignations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated users" ON public.employee_resignations FOR DELETE TO authenticated USING (true);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-docs', 'onboarding-docs', true) ON CONFLICT DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (true);
