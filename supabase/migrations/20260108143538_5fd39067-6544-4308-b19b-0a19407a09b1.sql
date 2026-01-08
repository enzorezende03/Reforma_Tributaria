-- Drop existing view and recreate with security_invoker
DROP VIEW IF EXISTS public.admins_safe;

-- Recreate the view with security_invoker = true
-- This makes the view use the RLS policies of the underlying admins table
CREATE VIEW public.admins_safe 
WITH (security_invoker = true)
AS SELECT 
  id,
  name,
  email,
  is_active,
  must_change_password,
  created_at
FROM public.admins;