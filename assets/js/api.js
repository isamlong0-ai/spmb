import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js?v=9";

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
// Klien tanpa sesi: dipakai untuk data publik agar tidak terpengaruh role/login
export const supabaseAnon = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}
export async function signOut() { return supabase.auth.signOut(); }

export async function webRole() {
  try {
    const { data, error } = await supabase.rpc("web_role");
    if (error) {
      // fallback: baca langsung tabel (jika RPC belum ada)
      const s = await getSession();
      if (!s) return null;
      const { data: r } = await supabase.from("web_roles").select("role").eq("user_id", s.user.id).maybeSingle();
      return r?.role ?? null;
    }
    return data ?? null;
  } catch (e) { return null; }
}
// catatan: web_role() RPC dibuat di migration. Jika belum ada, fallback di atas.

export async function getInfo() {
  const { data, error } = await supabaseAnon.from("web_info").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data;
}
export async function updateInfo(payload) {
  const { error } = await supabase.from("web_info").upsert({ id: 1, ...payload }, { onConflict: "id" });
  if (error) throw error;
}

export async function listBerita({ kategori = null, limit = 6, offset = 0, publishedOnly = true, q = null, pinned = null } = {}) {
  const client = publishedOnly ? supabaseAnon : supabase;
  let query = client.from("web_berita").select("*", { count: "exact" }).order("is_pinned", { ascending: false }).order("tanggal", { ascending: false }).range(offset, offset + limit - 1);
  if (publishedOnly) query = query.eq("is_published", true);
  if (kategori && kategori !== "Semua") query = query.eq("kategori", kategori);
  if (pinned === true) query = query.eq("is_pinned", true);
  if (pinned === false) query = query.eq("is_pinned", false);
  if (q && q.trim()) {
    const s = q.trim().replace(/[%_]/g, "");
    if (s) query = query.or(`judul.ilike.%${s}%,ringkasan.ilike.%${s}%,isi.ilike.%${s}%`);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}
export async function getBerita(id) {
  const { data, error } = await supabase.from("web_berita").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
export async function saveBerita(payload) {
  if (payload.id) {
    const { error } = await supabase.from("web_berita").update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("web_berita").insert(payload);
    if (error) throw error;
  }
}
export async function deleteBerita(id) {
  const { error } = await supabase.from("web_berita").delete().eq("id", id);
  if (error) throw error;
}

export async function listDaftar(jenis = null, publishedOnly = false) {
  let q = supabase.from("web_daftar").select("*").order("urutan", { ascending: true });
  if (publishedOnly) q = q.eq("is_published", true);
  if (jenis) q = q.eq("jenis", jenis);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function saveDaftar(payload) {
  if (payload.id) {
    const { error } = await supabase.from("web_daftar").update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("web_daftar").insert(payload);
    if (error) throw error;
  }
}
export async function deleteDaftar(id) {
  const { error } = await supabase.from("web_daftar").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadGambar(file, folder = "berita") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("web-sekolah").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("web-sekolah").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Kelola akun via Edge Function ----------
async function callUserMgmt(action, body = {}) {
  const session = await getSession();
  const res = await fetch(CONFIG.USER_MGMT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Gagal memanggil layanan akun");
  return json;
}
export async function listUsers() { return callUserMgmt("list"); }
export async function createUser(email, password, role = "editor") { return callUserMgmt("create", { email, password, role }); }
export async function deleteUser(id) { return callUserMgmt("delete", { id }); }
export async function resetUserPassword(id, password) { return callUserMgmt("reset_password", { id, password }); }

// ---------- Alumni ----------
export async function listAlumni({ status = null, tahun = null, publishedOnly = false } = {}) {
  const client = publishedOnly ? supabaseAnon : supabase;
  let q = client.from("alumni").select("*").order("tahun_lulus", { ascending: false }).order("nama");
  if (publishedOnly) q = q.eq("is_published", true);
  if (status && status !== "semua") q = q.eq("status", status);
  if (tahun) q = q.eq("tahun_lulus", tahun);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function listAlumniPage({ limit = 10, offset = 0, status = null, tahun = null } = {}) {
  let q = supabase.from("alumni").select("*", { count: "exact" }).order("tahun_lulus", { ascending: false }).order("nama").range(offset, offset + limit - 1);
  if (status && status !== "semua") q = q.eq("status", status);
  if (tahun) q = q.eq("tahun_lulus", tahun);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function saveAlumni(payload) {
  if (payload.id) {
    const { error } = await supabase.from("alumni").update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("alumni").insert(payload);
    if (error) throw error;
  }
}
export async function deleteAlumni(id) {
  const { error } = await supabase.from("alumni").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Galeri ----------
export async function listGaleri({ limit = 12, offset = 0, publishedOnly = true } = {}) {
  const client = publishedOnly ? supabaseAnon : supabase;
  let q = client.from("web_galeri").select("*", { count: "exact" }).order("tanggal", { ascending: false }).range(offset, offset + limit - 1);
  if (publishedOnly) q = q.eq("is_published", true);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}
export async function saveGaleri(payload) {
  if (payload.id) {
    const { error } = await supabase.from("web_galeri").update(payload).eq("id", payload.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("web_galeri").insert(payload);
    if (error) throw error;
  }
}
export async function deleteGaleri(id) {
  const { error } = await supabase.from("web_galeri").delete().eq("id", id);
  if (error) throw error;
}