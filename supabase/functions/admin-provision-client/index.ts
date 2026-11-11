import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Cria/vincula a conta de acesso (sem senha) de um cliente. Com send=true, envia o email de acesso.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Acesso negado" }, 403);

    const body = await req.json().catch(() => ({}));
    const clientId = String(body?.client_id ?? "");
    const send = body?.send === true;
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) return json({ error: "client_id inválido" }, 400);

    const { data: client } = await admin.from("clients").select("id, email, user_id, is_active").eq("id", clientId).maybeSingle();
    if (!client) return json({ error: "Cliente não encontrado" }, 404);
    if (!client.email) return json({ error: "Cliente sem email" }, 400);
    const email = client.email.toLowerCase();

    let userId = client.user_id as string | null;
    if (!userId) {
      const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (created?.user) userId = created.user.id;
      else {
        // já existe: procura
        for (let page = 1; page <= 20 && !userId; page++) {
          const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
          const u = data?.users.find((x) => x.email?.toLowerCase() === email);
          if (u) userId = u.id;
          if (!data || data.users.length < 200) break;
        }
        if (!userId) return json({ error: error?.message ?? "Erro ao criar acesso" }, 500);
      }
      await admin.from("clients").update({ user_id: userId }).eq("id", clientId);
    }
    await admin.from("user_roles").upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role" });

    if (send) {
      if (!client.is_active) return json({ error: "Cliente inativo" }, 400);
      const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
      const { error } = await anon.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: "https://ref-tributaria.lovable.app/login" },
      });
      if (error) return json({ error: error.message }, 500);
    }
    return json({ success: true, user_id: userId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
