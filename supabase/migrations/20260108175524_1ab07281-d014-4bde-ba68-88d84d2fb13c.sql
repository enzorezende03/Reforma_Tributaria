-- Drop and recreate the admins_safe view with security_invoker enabled
DROP VIEW IF EXISTS public.admins_safe;

CREATE VIEW public.admins_safe WITH (security_invoker = on) AS
SELECT 
    id,
    email,
    name,
    is_active,
    must_change_password,
    permissions,
    created_at
FROM public.admins;

-- Grant select permission only to authenticated users
REVOKE ALL ON public.admins_safe FROM anon;
REVOKE ALL ON public.admins_safe FROM public;
GRANT SELECT ON public.admins_safe TO authenticated;