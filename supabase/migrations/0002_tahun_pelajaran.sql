-- =============================================================================
-- Migrasi 0002 — Kontinuitas antar Tahun Pelajaran
-- Jalankan di Supabase SQL Editor setelah 0001_init.sql
-- =============================================================================

-- 1. Kolom tahun pelajaran pada pendaftar ------------------------------------
alter table public.pendaftar
  add column if not exists tahun_pelajaran text not null default '2026/2027';

create index if not exists idx_pendaftar_tahun
  on public.pendaftar (tahun_pelajaran);

-- 2. Tabel pengaturan (tahun aktif untuk form publik) ------------------------
create table if not exists public.pengaturan (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.pengaturan enable row level security;

drop policy if exists "publik_baca_tahun_aktif" on public.pengaturan;
create policy "publik_baca_tahun_aktif"
  on public.pengaturan for select to anon
  using (key = 'tahun_pelajaran_aktif');

drop policy if exists "admin_pengaturan" on public.pengaturan;
create policy "admin_pengaturan"
  on public.pengaturan for all to authenticated
  using (true) with check (true);

insert into public.pengaturan (key, value)
values ('tahun_pelajaran_aktif', '2026/2027')
on conflict (key) do nothing;

-- 3. Perbarui RPC simpan_pendaftaran agar kode memakai tahun pelajaran -------
drop function if exists public.simpan_pendaftaran(jsonb, jsonb);
create or replace function public.simpan_pendaftaran(p_data jsonb, p_nilai jsonb)
returns table (id uuid, kode_pendaftaran text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_kode text;
  v_data jsonb;
begin
  v_data := p_data || jsonb_build_object(
    'id', gen_random_uuid(),
    'tahun_pelajaran', coalesce(nullif(p_data->>'tahun_pelajaran', ''), '2026/2027'),
    'status', 'menunggu',
    'created_at', now(),
    'updated_at', now()
  );
  v_kode := 'SPMB-' || replace(v_data->>'tahun_pelajaran', '/', '-') || '-' ||
            upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  v_data := v_data || jsonb_build_object('kode_pendaftaran', v_kode);

  insert into public.pendaftar
  select * from jsonb_populate_record(null::public.pendaftar, v_data)
  returning public.pendaftar.id, public.pendaftar.kode_pendaftaran into v_id, v_kode;

  insert into public.nilai_rapor (pendaftar_id, mapel, semester, nilai)
  select v_id, x->>'mapel', (x->>'semester')::smallint, (x->>'nilai')::numeric
  from jsonb_array_elements(p_nilai) as x;

  return query select v_id, v_kode;
end;
$$;

revoke all on function public.simpan_pendaftaran(jsonb, jsonb) from public;
grant execute on function public.simpan_pendaftaran(jsonb, jsonb) to anon, authenticated;

-- 4. Perbarui RPC cek_nisn agar menyertakan tahun pelajaran ------------------
drop function if exists public.cek_nisn(text);
create or replace function public.cek_nisn(p_nisn text)
returns table (
  ditemukan boolean,
  nama text,
  sekolah text,
  jurusan1 text,
  jurusan2 text,
  jurusan3 text,
  status text,
  waktu_daftar text,
  tahun_pelajaran text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
    select
      true,
      p.nama,
      p.nama_sekolah,
      p.jurusan1,
      p.jurusan2,
      p.jurusan3,
      p.status,
      to_char(p.created_at at time zone 'Asia/Jakarta', 'DD-MM-YYYY HH24:MI:SS'),
      p.tahun_pelajaran
    from public.pendaftar p
    where p.nisn = p_nisn
    order by p.created_at desc
    limit 1;

  if not found then
    return query
      select false, null::text, null::text, null::text, null::text, null::text,
             null::text, null::text, null::text;
  end if;
end;
$$;

revoke all on function public.cek_nisn(text) from public;
grant execute on function public.cek_nisn(text) to anon, authenticated;
