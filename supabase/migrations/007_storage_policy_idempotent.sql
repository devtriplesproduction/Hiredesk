-- Re-run safe: drop 005 policy names before recreate
DROP POLICY IF EXISTS "Authenticated Select" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Anon Select" ON storage.objects;
DROP POLICY IF EXISTS "Anon Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Authenticated Select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Anon Select" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'onboarding-docs');
CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'onboarding-docs');
