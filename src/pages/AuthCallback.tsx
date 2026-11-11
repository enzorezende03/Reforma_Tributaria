import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const redirect = searchParams.get("redirect") || "/";
      const safe = redirect.startsWith("/") ? redirect : "/";
      if (!session?.user) return window.location.replace("/login");

      const [{ data: client }, { data: isAdmin }] = await Promise.all([
        supabase.from("clients_safe").select("id, is_active").eq("user_id", session.user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
      ]);
      if ((client && client.is_active) || isAdmin) return window.location.replace(safe);
      setDenied(true);
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="text-white text-lg text-center max-w-md">
        {denied ? "Seu acesso ainda não foi liberado. Entre em contato com a 2M." : "Entrando..."}
      </div>
    </div>
  );
}
