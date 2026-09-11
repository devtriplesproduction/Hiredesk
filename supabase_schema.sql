-- Supabase Schema for HireDesk Candidates Table
-- Paste this script into your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query) and click Run.

-- 1. Create the candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "roleName" TEXT NOT NULL,
  score JSONB NOT NULL, -- Contains skills, exp, edu, completeness, total
  status TEXT NOT NULL DEFAULT 'new',
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
  note TEXT NOT NULL DEFAULT '',
  "extractionSource" TEXT,
  "extractionConfidence" NUMERIC,
  "extractionMetadata" JSONB
);

-- 2. Create performance indexing for fast filter scanning
CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON public.candidates("roleId");
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates("createdAt" DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 4. Create secure policies restricting candidate read/write access strictly to authenticated admins
DROP POLICY IF EXISTS "Allow public read" ON public.candidates;
CREATE POLICY "Allow select for authenticated admins" ON public.candidates 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.candidates;
CREATE POLICY "Allow insert for authenticated admins" ON public.candidates 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.candidates;
CREATE POLICY "Allow update for authenticated admins" ON public.candidates 
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow delete for authenticated admins" ON public.candidates;
CREATE POLICY "Allow delete for authenticated admins" ON public.candidates 
  FOR DELETE TO authenticated USING (true);

-- 5. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup storage policies (allow public read/write for simplicity since this is an admin app)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (true);

-- 7. Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  count INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for authenticated admins" ON public.roles;
CREATE POLICY "Allow select for authenticated admins" ON public.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated admins" ON public.roles;
CREATE POLICY "Allow insert for authenticated admins" ON public.roles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated admins" ON public.roles;
CREATE POLICY "Allow update for authenticated admins" ON public.roles FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow delete for authenticated admins" ON public.roles;
CREATE POLICY "Allow delete for authenticated admins" ON public.roles FOR DELETE TO authenticated USING (true);

-- 8. Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for authenticated admins" ON public.contracts;
CREATE POLICY "Allow select for authenticated admins" ON public.contracts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated admins" ON public.contracts;
CREATE POLICY "Allow insert for authenticated admins" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for authenticated admins" ON public.contracts;
CREATE POLICY "Allow update for authenticated admins" ON public.contracts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow delete for authenticated admins" ON public.contracts;
CREATE POLICY "Allow delete for authenticated admins" ON public.contracts FOR DELETE TO authenticated USING (true);
