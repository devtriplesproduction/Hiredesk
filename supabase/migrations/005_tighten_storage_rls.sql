-- DROP the four Public * policies on storage.objects (USING true).
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Authenticated: SELECT/INSERT/UPDATE/DELETE only for buckets resumes, brand-assets, onboarding-docs.
CREATE POLICY "Authenticated Select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('resumes', 'brand-assets', 'onboarding-docs'));

-- Public onboarding upload (Anon): SELECT/INSERT only for bucket onboarding-docs. No anon DELETE. No anon access to resumes or brand-assets.
CREATE POLICY "Anon Select" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'onboarding-docs');
CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'onboarding-docs');
