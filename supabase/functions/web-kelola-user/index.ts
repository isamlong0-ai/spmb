import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function callerRole(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: r } = await admin.from("web_roles").select("role").eq("user_id", data.user.id).maybeSingle();
  return r?.role ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const role = await callerRole(req);
  if (role !== "admin") return json({ error: "Hanya admin yang diizinkan" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Body tidak valid" }, 400); }
  const action = body?.action;

  try {
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      const { data: roles } = await admin.from("web_roles").select("user_id, role");
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
      const users = (data?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        role: roleMap.get(u.id) || "user",
        created_at: u.created_at,
      }));
      return json({ users });
    }

    if (action === "create") {
      const email = String(body?.email || "").trim();
      const password = String(body?.password || "");
      if (!email || !password) return json({ error: "Email dan password wajib" }, 400);
      if (password.length < 8) return json({ error: "Password minimal 8 karakter" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      const { error: re } = await admin.from("web_roles").insert({ user_id: data.user.id, role: "editor" });
      if (re) throw re;
      return json({ ok: true, id: data.user.id });
    }

    if (action === "delete") {
      const id = String(body?.id || "");
      if (!id) return json({ error: "id wajib" }, 400);
      // cegah hapus admin
      const { data: r } = await admin.from("web_roles").select("role").eq("user_id", id).maybeSingle();
      if (r?.role === "admin") return json({ error: "Tidak bisa menghapus admin" }, 400);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      await admin.from("web_roles").delete().eq("user_id", id);
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const id = String(body?.id || "");
      const password = String(body?.password || "");
      if (!id || !password) return json({ error: "id dan password wajib" }, 400);
      if (password.length < 8) return json({ error: "Password minimal 8 karakter" }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Aksi tidak dikenal" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || "Terjadi kesalahan" }, 500);
  }
});