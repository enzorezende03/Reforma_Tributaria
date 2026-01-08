-- Remove the SELECT policy that exposes password hashes
DROP POLICY IF EXISTS "Admins can view own data" ON public.admins;

-- Create a more restrictive policy - admins should use admins_safe view for reading
-- Keep only the policy for admins to view their OWN record (needed for some operations)
-- but prevent viewing other admins' data including password hashes
CREATE POLICY "Admins can view only own record"
ON public.admins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users u
    WHERE u.id = auth.uid() 
    AND u.email = admins.email
  )
);