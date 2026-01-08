-- Create a safe view for admin invites that excludes the token
CREATE VIEW public.admin_invites_safe 
WITH (security_invoker = true)
AS SELECT 
  id,
  email,
  created_at,
  expires_at,
  used,
  created_by
FROM public.admin_invites;

-- Drop the SELECT policy that exposes tokens to admins
DROP POLICY IF EXISTS "Admins can view invites" ON public.admin_invites;

-- Create a more restrictive SELECT policy - only allow SELECT through secure functions
-- Admins can only see invites they created (not others' tokens)
CREATE POLICY "Admins can only view invites they created"
ON public.admin_invites
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  AND created_by = auth.uid()
);