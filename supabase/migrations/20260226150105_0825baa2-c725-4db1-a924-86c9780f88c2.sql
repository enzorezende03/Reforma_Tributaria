-- Drop the overly permissive policy on password_reset_tokens
DROP POLICY IF EXISTS "Allow service role full access" ON public.password_reset_tokens;

-- Replace with a restrictive policy - no direct access needed since all operations use SECURITY DEFINER RPCs
CREATE POLICY "No direct access to password_reset_tokens"
ON public.password_reset_tokens
FOR ALL
USING (false);