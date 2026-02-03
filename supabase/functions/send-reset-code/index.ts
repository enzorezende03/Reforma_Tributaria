import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetRequest {
  cnpj: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj, email }: ResetRequest = await req.json();

    if (!cnpj || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "CNPJ e email são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Formatar CNPJ
    const formattedCnpj = cnpj.replace(/\D/g, "");

    // Criar token de reset
    const { data: tokenResult, error: tokenError } = await supabase.rpc(
      "create_password_reset_token",
      { p_cnpj: formattedCnpj }
    );

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao processar solicitação" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = tokenResult as {
      success: boolean;
      error?: string;
      client_id?: string;
      code?: string;
      company_name?: string;
      message?: string;
    };

    // Se não encontrou cliente ou houve erro de rate limit
    if (!result.success && result.error) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Se encontrou cliente, enviar email
    if (result.code && result.company_name) {
      try {
        await resend.emails.send({
          from: "2M Contabilidade <noreply@2mgrupo.com.br>",
          to: [email],
          subject: "Código de Redefinição de Senha - 2M Contabilidade",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">2M Contabilidade</h1>
                <p style="color: #e0e0e0; margin: 10px 0 0 0;">Reforma Tributária</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #1e3a5f; margin-top: 0;">Redefinição de Senha</h2>
                
                <p>Olá, <strong>${result.company_name}</strong>!</p>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar:</p>
                
                <div style="background: #f0f7ff; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${result.code}</span>
                </div>
                
                <p style="color: #666; font-size: 14px;">Este código expira em <strong>15 minutos</strong>.</p>
                
                <p style="color: #666; font-size: 14px;">Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
                <p style="margin: 0; color: #666; font-size: 12px;">
                  © 2024 2M Contabilidade. Todos os direitos reservados.
                </p>
              </div>
            </body>
            </html>
          `,
        });

        console.log("Reset code email sent to:", email);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao enviar email. Verifique o endereço informado." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Sempre retornar sucesso (segurança - não revelar se CNPJ existe)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Se o CNPJ estiver cadastrado e o email corresponder, você receberá um código." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reset-code:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
