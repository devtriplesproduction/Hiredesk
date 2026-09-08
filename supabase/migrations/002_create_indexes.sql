-- Verified from supabase_schema.sql performance indexes
CREATE INDEX IF NOT EXISTS idx_candidates_role_id ON public.candidates("roleId");
CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates("createdAt" DESC);
