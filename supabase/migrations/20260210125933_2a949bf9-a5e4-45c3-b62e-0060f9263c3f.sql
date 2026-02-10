
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active panchayaths" ON public.panchayaths;
DROP POLICY IF EXISTS "Super admins can manage panchayaths" ON public.panchayaths;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can view active panchayaths"
ON public.panchayaths FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage panchayaths"
ON public.panchayaths FOR ALL
USING (is_super_admin());
