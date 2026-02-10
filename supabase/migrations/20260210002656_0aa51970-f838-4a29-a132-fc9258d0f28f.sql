-- Create panchayaths table (managed by super admin)
CREATE TABLE public.panchayaths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  ward_count integer NOT NULL DEFAULT 1 CHECK (ward_count >= 1),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.panchayaths ENABLE ROW LEVEL SECURITY;

-- Anyone can view active panchayaths (for signup dropdown)
CREATE POLICY "Anyone can view active panchayaths"
ON public.panchayaths
FOR SELECT
USING (is_active = true);

-- Super admins can manage all panchayaths
CREATE POLICY "Super admins can manage panchayaths"
ON public.panchayaths
FOR ALL
USING (is_super_admin());

-- Create staff_panchayath_assignments table (many-to-many with wards)
CREATE TABLE public.staff_panchayath_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL,
  panchayath_id uuid NOT NULL REFERENCES public.panchayaths(id) ON DELETE CASCADE,
  ward_numbers integer[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_user_id, panchayath_id)
);

-- Enable RLS
ALTER TABLE public.staff_panchayath_assignments ENABLE ROW LEVEL SECURITY;

-- Staff can view own assignments
CREATE POLICY "Staff can view own assignments"
ON public.staff_panchayath_assignments
FOR SELECT
USING (staff_user_id = auth.uid());

-- Admins and super admins can manage all assignments
CREATE POLICY "Admins can manage staff assignments"
ON public.staff_panchayath_assignments
FOR ALL
USING (is_admin() OR is_super_admin());

-- Update trigger for panchayaths
CREATE TRIGGER update_panchayaths_updated_at
BEFORE UPDATE ON public.panchayaths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();