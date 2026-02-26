-- Create a token-only validation function for initial invite check
CREATE OR REPLACE FUNCTION public.check_admin_invite_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  SELECT id, email, expires_at, used
  INTO v_invite
  FROM public.admin_invites
  WHERE token = p_token AND used = false;
  
  IF v_invite IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Convite inválido ou já utilizado');
  END IF;
  
  IF v_invite.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Convite expirado');
  END IF;
  
  RETURN json_build_object('valid', true, 'invite_id', v_invite.id, 'email', v_invite.email);
END;
$$;