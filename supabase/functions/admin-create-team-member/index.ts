// Lovable Cloud function: create team member without switching the current session
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateTeamMemberBody = {
  email?: string;
  name?: string;
  password?: string;
  permissions?: string[];
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ success: false, error: "Configuração do servidor incompleta" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!jwt) {
    return jsonResponse({ success: false, error: "Não autenticado" }, 401);
  }

  // Client bound to the caller token (to identify the requester)
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData?.user?.id || !callerData.user.email) {
    return jsonResponse({ success: false, error: "Sessão inválida" }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Hard gate: only admins can create team members
  const { data: callerRole } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!callerRole) {
    return jsonResponse({ success: false, error: "Acesso negado" }, 403);
  }

  // Soft gate: must have manage_team permission
  const { data: callerAdmin } = await adminClient
    .from("admins_safe")
    .select("is_active, permissions")
    .eq("email", callerData.user.email.toLowerCase().trim())
    .maybeSingle();

  const permissions = callerAdmin?.permissions ?? [];
  if (callerAdmin?.is_active === false) {
    return jsonResponse({ success: false, error: "Conta desativada" }, 403);
  }
  if (!permissions.includes("manage_team")) {
    return jsonResponse({ success: false, error: "Sem permissão para gerenciar equipe" }, 403);
  }

  let body: CreateTeamMemberBody = {};
  try {
    body = (await req.json()) as CreateTeamMemberBody;
  } catch {
    // ignore
  }

  const email = (body.email ?? "").toLowerCase().trim();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";
  const memberPermissions = Array.isArray(body.permissions) ? body.permissions.filter((p) => typeof p === "string") : [];

  if (!email || !email.includes("@")) {
    return jsonResponse({ success: false, error: "Email inválido" }, 400);
  }

  if (!name) {
    return jsonResponse({ success: false, error: "Nome é obrigatório" }, 400);
  }

  if (!password || password.length < 6) {
    return jsonResponse({ success: false, error: "A senha deve ter pelo menos 6 caracteres" }, 400);
  }

  if (memberPermissions.length === 0) {
    return jsonResponse({ success: false, error: "Selecione pelo menos uma permissão" }, 400);
  }

  // 1) Create auth user WITHOUT switching the current session
  const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createUserError || !created.user) {
    const msg = createUserError?.message ?? "Erro ao criar usuário";
    const already = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered") || msg.toLowerCase().includes("exists");
    return jsonResponse(
      { success: false, error: already ? "Este email já está cadastrado" : msg },
      400,
    );
  }

  // 2) Create / sync record in admins table (id = auth user id)
  const { error: insertAdminError } = await adminClient.from("admins").insert({
    id: created.user.id,
    email,
    name,
    password_hash: "supabase_auth",
    permissions: memberPermissions,
    must_change_password: true,
    is_active: true,
  });

  if (insertAdminError) {
    // If we failed to write admins row, cleanup auth user to avoid "ghost" accounts
    await adminClient.auth.admin.deleteUser(created.user.id);
    const isDup = insertAdminError.code === "23505";
    return jsonResponse(
      { success: false, error: isDup ? "Este email já está cadastrado como colaborador" : `Erro ao cadastrar colaborador: ${insertAdminError.message}` },
      400,
    );
  }

  // 3) Grant access to the admin panel (role used by the current app gate)
  const { error: roleError } = await adminClient.from("user_roles").insert({
    user_id: created.user.id,
    role: "admin",
  });

  if (roleError) {
    // best-effort cleanup
    await adminClient.from("admins").delete().eq("id", created.user.id);
    await adminClient.auth.admin.deleteUser(created.user.id);
    return jsonResponse({ success: false, error: "Erro ao atribuir permissão de acesso ao painel" }, 400);
  }

  return jsonResponse({ success: true, user_id: created.user.id });
});
