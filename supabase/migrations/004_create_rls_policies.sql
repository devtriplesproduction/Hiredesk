-- Verified from src/app/api/auth/route.ts. The application only requires users to be authenticated via standard Supabase Auth.
-- There is no custom 'role' claim or admin authorization mechanism besides being logged in.

CREATE POLICY "Allow select for authenticated admins" ON public.candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated admins" ON public.candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated admins" ON public.candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated admins" ON public.candidates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated admins" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated admins" ON public.roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated admins" ON public.roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated admins" ON public.roles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated admins" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated admins" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for authenticated admins" ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated admins" ON public.contracts FOR DELETE TO authenticated USING (true);
