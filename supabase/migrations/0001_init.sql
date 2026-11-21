-- =============================================================================
-- SPMB SMK Negeri 1 Teluk Keramat — Skema database Supabase
-- Jalankan file ini di Supabase SQL Editor (Project -> SQL Editor -> New query)
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Fungsi pembantu: updated_at otomatis
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tabel utama: pendaftar
-- -----------------------------------------------------------------------------
create table if not exists public.pendaftar (
  id uuid primary key default gen_random_uuid(),
  kode_pendaftaran text not null unique default (
    'SPMB-' || to_char(now(), 'YYYY') || '-' ||
    upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
  ),
  status text not null default 'menunggu'
    check (status in ('menunggu', 'diterima', 'ditolak')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Data diri
  nama text not null,
  nik text not null unique check (nik ~ '^[0-9]{16}$'),
  kk text not null check (kk ~ '^[0-9]{16}$'),
  akta text not null,
  tempat_lahir text not null,
  tanggal_lahir date not null,
  jenis_kelamin text not null check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  agama text not null,
  anak_ke integer not null check (anak_ke between 1 and 30),
  jumlah_saudara integer not null check (jumlah_saudara between 0 and 30),
  tinggi_badan integer not null check (tinggi_badan between 50 and 250),
  berat_badan integer not null check (berat_badan between 10 and 200),
  jenis_tempat_tinggal text not null,
  tempat_tinggal_lain text,
  moda_transportasi text not null,
  transportasi_lain text,
  no_hp_siswa text not null,

  -- Alamat terstruktur
  provinsi text not null default 'Kalimantan Barat',
  kabupaten text not null default 'Kabupaten Sambas',
  kecamatan text not null,
  desa text not null,
  rt text not null,
  rw text not null,
  kode_pos text,
  alamat_keterangan text,
  alamat_lengkap text not null,

  -- Orang tua
  nama_ayah text not null,
  status_ayah text not null check (status_ayah in ('Hidup', 'Meninggal')),
  nik_ayah text,
  tempat_lahir_ayah text not null,
  tanggal_lahir_ayah date not null,
  pendidikan_ayah text,
  pekerjaan_ayah text,
  pekerjaan_ayah_lain text,
  penghasilan_ayah text,
  nama_ibu text not null,
  status_ibu text not null check (status_ibu in ('Hidup', 'Meninggal')),
  nik_ibu text,
  tempat_lahir_ibu text not null,
  tanggal_lahir_ibu date not null,
  pendidikan_ibu text,
  pekerjaan_ibu text,
  pekerjaan_ibu_lain text,
  penghasilan_ibu text,
  alamat_orang_tua text,
  no_hp_orang_tua text,

  -- Wali (opsional)
  nama_wali text,
  pekerjaan_wali text,
  pekerjaan_wali_lain text,
  no_hp_wali text,
  alamat_wali text,

  -- Riwayat sekolah
  nisn text not null unique check (nisn ~ '^[0-9]+$'),
  bentuk_sekolah text not null,
  nama_sekolah text not null,
  alamat_sekolah text not null,
  tahun_lulus integer not null check (tahun_lulus between 2000 and 2100),
  punya_kip boolean not null default false,
  no_kip text,

  -- Nilai ringkas
  peringkat_5 integer not null check (peringkat_5 between 1 and 200),
  rata_rata numeric(5, 2),

  -- Pilihan jurusan (harus berbeda)
  jurusan1 text not null,
  jurusan2 text not null,
  jurusan3 text not null,
  constraint jurusan_berbeda check (
    jurusan1 <> jurusan2 and jurusan1 <> jurusan3 and jurusan2 <> jurusan3
  ),

  -- Foto (URL Google Drive)
  foto_siswa text,
  foto_kk text,
  foto_akta text,
  foto_rapor text
);

drop trigger if exists trg_pendaftar_updated_at on public.pendaftar;
create trigger trg_pendaftar_updated_at
  before update on public.pendaftar
  for each row execute function public.set_updated_at();

create index if not exists idx_pendaftar_status on public.pendaftar (status);
create index if not exists idx_pendaftar_created on public.pendaftar (created_at desc);
create index if not exists idx_pendaftar_sekolah on public.pendaftar (nama_sekolah);

-- -----------------------------------------------------------------------------
-- Tabel nilai rapor (5 mapel x 5 semester per pendaftar)
-- -----------------------------------------------------------------------------
create table if not exists public.nilai_rapor (
  id bigint generated always as identity primary key,
  pendaftar_id uuid not null references public.pendaftar (id) on delete cascade,
  mapel text not null check (mapel in ('B. Indonesia', 'B. Inggris', 'Matematika', 'IPA', 'IPS')),
  semester smallint not null check (semester between 1 and 5),
  nilai numeric(5, 2) not null check (nilai between 0 and 100),
  unique (pendaftar_id, mapel, semester)
);

create index if not exists idx_nilai_pendaftar on public.nilai_rapor (pendaftar_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
--   - anon   : hanya boleh INSERT (form publik), tidak bisa SELECT data lain
--   - admin  : role authenticated mendapat akses penuh (CRUD)
-- -----------------------------------------------------------------------------
alter table public.pendaftar enable row level security;
alter table public.nilai_rapor enable row level security;

drop policy if exists "form_insert_pendaftar" on public.pendaftar;
create policy "form_insert_pendaftar"
  on public.pendaftar for insert to anon
  with check (true);

drop policy if exists "admin_all_pendaftar" on public.pendaftar;
create policy "admin_all_pendaftar"
  on public.pendaftar for all to authenticated
  using (true) with check (true);

drop policy if exists "form_insert_nilai" on public.nilai_rapor;
create policy "form_insert_nilai"
  on public.nilai_rapor for insert to anon
  with check (true);

drop policy if exists "admin_all_nilai" on public.nilai_rapor;
create policy "admin_all_nilai"
  on public.nilai_rapor for all to authenticated
  using (true) with check (true);

-- -----------------------------------------------------------------------------
-- RPC 1: simpan pendaftaran + nilai secara atomik (dipanggil form publik)
-- -----------------------------------------------------------------------------
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
  -- jsonb_populate_record mengisi field yang absen dengan NULL, sehingga
  -- nilai default kolom tidak dipakai. Tambahkan eksplisit di sini.
  v_data := p_data || jsonb_build_object(
    'id', gen_random_uuid(),
    'kode_pendaftaran', 'SPMB-' || to_char(now(), 'YYYY') || '-' ||
      upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)),
    'status', 'menunggu',
    'created_at', now(),
    'updated_at', now()
  );

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

-- -----------------------------------------------------------------------------
-- RPC 2: cek data pendaftar berdasarkan NISN (hanya field terbatas untuk publik)
-- -----------------------------------------------------------------------------
create or replace function public.cek_nisn(p_nisn text)
returns table (
  ditemukan boolean,
  nama text,
  sekolah text,
  jurusan1 text,
  jurusan2 text,
  jurusan3 text,
  status text,
  waktu_daftar text
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
      to_char(p.created_at at time zone 'Asia/Jakarta', 'DD-MM-YYYY HH24:MI:SS')
    from public.pendaftar p
    where p.nisn = p_nisn
    limit 1;

  if not found then
    return query
      select false, null::text, null::text, null::text, null::text, null::text, null::text, null::text;
  end if;
end;
$$;

revoke all on function public.cek_nisn(text) from public;
grant execute on function public.cek_nisn(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- (Opsional) Akun admin untuk panel admin.html
-- Ganti password default segera setelah login pertama.
-- Email    : admin@smkn1tk.sch.id
-- Password : AdminSPMB2026!
-- -----------------------------------------------------------------------------
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@smkn1tk.sch.id';
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'admin@smkn1tk.sch.id', extensions.crypt('AdminSPMB2026!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
      '', '', '', ''
    );
  end if;

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'admin@smkn1tk.sch.id'),
    'email', now(), now(), now()
  )
  on conflict (provider_id, provider) do nothing;
end $$;
