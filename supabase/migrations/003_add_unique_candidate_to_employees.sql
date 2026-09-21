-- Add unique constraint on employees(candidate_id) so each candidate can only have at most one employee record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_candidate_id_unique'
  ) THEN
    ALTER TABLE public.employees ADD CONSTRAINT employees_candidate_id_unique UNIQUE (candidate_id);
  END IF;
END $$;
