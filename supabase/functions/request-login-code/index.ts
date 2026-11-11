import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GENERIC = { message: "Se o email estiver cadastrado, enviaremos um código" };
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return json({ error: "Email inválido" }, 400);
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    // limite: 5 pedidos a cada 15 minutos por email
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await admin.from("login_attempts").select("id", { count: "exact", head: true })
      .eq("identifier", `otp:${email}`).gte("attempt_time", since);
    if ((count ?? 0) >= 5) return json(GENERIC);
    await admin.from("login_attempts").insert({ identifier: `otp:${email}`, success: false });

    const { data: client } = await admin.from("clients").select("id, user_id")
      .ilike("email", email).eq("is_active", true).maybeSingle();
    if (!client) return json(GENERIC);

    if (!client.user_id) {
      // garante conta de acesso (sem senha) para clientes antigos
      const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (created?.user) {
        await admin.from("clients").update({ user_id: created.user.id }).eq("id", client.id);
        await admin.from("user_roles").upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });
      }
    }

    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { error } = await anon.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) console.error("[request-login-code]", error.message);
    return json(GENERIC);
  } catch (e) {
    console.error("[request-login-code]", e);
    return json(GENERIC);
  }
});
