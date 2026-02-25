-- Remove the policy that exposes password_hash to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view their own admin record" ON public.admins;