
DROP POLICY IF EXISTS "Super admins can manage panchayaths" ON public.panchayaths;

CREATE POLICY "Admins and super admins can manage panchayaths"
ON public.panchayaths FOR ALL
USING (is_admin() OR is_super_admin());
