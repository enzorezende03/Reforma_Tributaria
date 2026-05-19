import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_DURATION_MS = 30 * 60 * 1000;

export default function AuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function finishLogin() {
      // Aguarda o Supabase processar o hash do magic link e gravar a sessão
      await supabase.auth.getSession();

      const redirect = searchParams.get("redirect") || "/";
      const cnpj = searchParams.get("cnpj");

      // Se veio CNPJ no SSO, monta a sessão de cliente (CNPJ-based)
      if (cnpj) {
        try {
          const { data, error } = await supabase.rpc("get_client_by_cnpj_for_sso", {
            p_cnpj: cnpj,
          });

          const result = data as { success: boolean; error?: string; client?: {
            id: string; cnpj: string; company_name: string; must_change_password?: boolean;
          } } | null;

          if (!error && result?.success && result.client) {
            const clientSession = {
              client: {
                id: result.client.id,
                cnpj: result.client.cnpj,
                company_name: result.client.company_name,
                mustChangePassword: result.client.must_change_password ?? false,
              },
              expiresAt: Date.now() + SESSION_DURATION_MS,
            };
            localStorage.setItem("client_session", JSON.stringify(clientSession));
          } else {
            console.error("[sso-callback] Falha ao buscar cliente:", error || result?.error);
          }
        } catch (e) {
          console.error("[sso-callback] Erro ao montar sessão de cliente:", e);
        }
      }

      // Full reload para o AuthProvider reler localStorage e o AdminAuthProvider revalidar a sessão
      window.location.replace(redirect);
    }

    finishLogin();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-white text-lg">Entrando...</div>
    </div>
  );
}
