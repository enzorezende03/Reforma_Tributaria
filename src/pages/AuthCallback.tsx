import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function finishLogin() {
      await supabase.auth.getSession();
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
    finishLogin();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-white text-lg">Entrando...</div>
    </div>
  );
}
