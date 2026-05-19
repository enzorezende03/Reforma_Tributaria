import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SHARED_SECRET = Deno.env.get("SSO_SHARED_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function b64urlToBytes(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function b64urlToString(s: string) {
  return new TextDecoder().decode(b64urlToBytes(s));
}

async function verify(token: string) {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) throw new Error("token inválido");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SHARED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlToBytes(sigB64),
    new TextEncoder().encode(payloadB64),
  );
  if (!ok) throw new Error("assinatura inválida");
  const payload = JSON.parse(b64urlToString(payloadB64)) as {
    email: string;
    name?: string | null;
    iat: number;
    exp: number;
  };
  if (Math.floor(Date.now() / 1000) > payload.exp) throw new Error("token expirado");
  return payload;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const redirect = url.searchParams.get("redirect") || "/";
    if (!token) return new Response("missing token", { status: 400 });

    const payload = await verify(token);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // garante usuário
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing.users.find((u) => u.email?.toLowerCase() === payload.email.toLowerCase());
    if (!found) {
      await admin.auth.admin.createUser({
        email: payload.email,
        email_confirm: true,
        user_metadata: { nome: payload.name ?? undefined },
      });
    }

    // gera magic link apontando de volta para o app
    const APP_ORIGIN = "https://ref-tributaria.lovable.app";
    const { data: link, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: payload.email,
      options: { redirectTo: `${APP_ORIGIN}${redirect}` },
    });
    if (error || !link?.properties?.action_link) {
      return new Response(`erro: ${error?.message ?? "sem link"}`, { status: 500 });
    }

    return Response.redirect(link.properties.action_link, 302);
  } catch (e) {
    return new Response(`SSO falhou: ${(e as Error).message}`, { status: 401 });
  }
});
