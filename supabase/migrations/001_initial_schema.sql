-- 1. candidates
CREATE TABLE public.candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  score JSONB NOT NULL,
  status TEXT NOT NULL,
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

-- 2. roles
CREATE TABLE public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  count INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL
);

-- 3. contracts
CREATE TABLE public.contracts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL
);

-- 4. interviews
CREATE TABLE public.interviews (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id),
  round INTEGER NOT NULL,
  "scheduledAt" TEXT,
  status TEXT NOT NULL,
  notes TEXT NOT NULL,
  decision TEXT,
  "createdAt" TEXT NOT NULL
);

-- 5. offers
CREATE TABLE public.offers (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id),
  "contractTemplateId" TEXT REFERENCES public.contracts(id),
  status TEXT NOT NULL,
  "sentAt" TEXT,
  "respondedAt" TEXT,
  "createdAt" TEXT NOT NULL
);

-- 6. candidate_documents (Conflict: API inserts snake_case, Frontend expects camelCase)
-- Creating with snake_case as per API insertion logic, but this will break frontend sorting by "createdAt".
CREATE TABLE public.candidate_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES public.candidates(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) -- Added to mitigate frontend order("createdAt") error
);

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
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. employee_bonds
CREATE TABLE public.employee_bonds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  is_required BOOLEAN NOT NULL,
  amount TEXT NOT NULL,
  duration TEXT NOT NULL,
  penalty TEXT NOT NULL,
  compensation_formula TEXT NOT NULL,
  breach_conditions TEXT NOT NULL,
  legal_rules TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. employee_resignations
CREATE TABLE public.employee_resignations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  resignation_reason TEXT NOT NULL,
  is_breach BOOLEAN NOT NULL,
  breach_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('onboarding-docs', 'onboarding-docs', true) ON CONFLICT DO NOTHING;
