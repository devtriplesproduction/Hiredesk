CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL
);
