-- Drop the current restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view only own record" ON public.admins;

-- Create a policy that allows authenticated users with admin role to view their own record by email match
-- This works because after login, auth.uid() is set and we can verify the user's email
CREATE POLICY "Authenticated users can view their own admin record"
ON public.admins
FOR SELECT
USING (
  -- User is authenticated and their email matches the admin record
  auth.jwt() ->> 'email' = email
);