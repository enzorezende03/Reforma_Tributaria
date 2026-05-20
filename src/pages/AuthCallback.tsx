import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_DURATION_MS = 30 * 60 * 1000;

type ClientPayload = {
  id: string;
  cnpj: string;
  company_name: string;
  email?: string | null;
  must_change_password?: boolean;
};

export default function AuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function finishLogin() {
      // Espera o Supabase processar o hash do magic link e gravar a sessão
      await supabase.auth.getSession();

      const redirect = searchParams.get("redirect") || "/";
      const email = searchParams.get("email");
      const cnpj = searchParams.get("cnpj");

      try {
        let result:
          | { success: boolean; error?: string; client?: ClientPayload }
          | null = null;

        if (email) {
          const { data, error } = await supabase.rpc("get_client_by_email_for_sso", {
            p_email: email,
          });
          if (error) console.error("[sso-callback] email lookup:", error);
          result = data as typeof result;
        }

        if ((!result || !result.success) && cnpj) {
          const { data, error } = await supabase.rpc("get_client_by_cnpj_for_sso", {
            p_cnpj: cnpj,
          });
          if (error) console.error("[sso-callback] cnpj lookup:", error);
          result = data as typeof result;
        }

        if (result?.success && result.client) {
          const clientSession = {
            client: {
              id: result.client.id,
              cnpj: result.client.cnpj,
              company_name: result.client.company_name,
              email: result.client.email,
              mustChangePassword: result.client.must_change_password ?? false,
            },
            expiresAt: Date.now() + SESSION_DURATION_MS,
          };
          localStorage.setItem("client_session", JSON.stringify(clientSession));
        } else if (email || cnpj) {
          console.error("[sso-callback] cliente não encontrado:", result?.error);
        }
      } catch (e) {
        console.error("[sso-callback] erro ao montar sessão de cliente:", e);
      }

      // Full reload pro AuthProvider reler localStorage e AdminAuthProvider revalidar
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
