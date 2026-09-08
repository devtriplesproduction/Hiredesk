CREATE TABLE IF NOT EXISTS public.interviews (
  id TEXT PRIMARY KEY,
  "candidateId" TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT NOT NULL DEFAULT '',
  decision TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all users (like the rest of the application)
CREATE POLICY "Allow all for interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);

