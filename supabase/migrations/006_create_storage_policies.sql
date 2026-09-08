-- Storage policies based on application usage in src/lib/supabase.ts.
-- The application requires public access for SELECT to display images and download resumes.
-- Uploading, updating, and deleting is performed strictly through the authenticated dashboard.

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' OR bucket_id = 'brand-assets');
CREATE POLICY "Allow insert for authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' OR bucket_id = 'brand-assets');
CREATE POLICY "Allow update for authenticated" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes' OR bucket_id = 'brand-assets');
CREATE POLICY "Allow delete for authenticated" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' OR bucket_id = 'brand-assets');
