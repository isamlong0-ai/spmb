-- =============================================================================
-- Migrasi 0009 — Info dari portal dinas + statistik minat jurusan
-- Jalankan di Supabase SQL Editor setelah 0008_status_manual.sql
-- =============================================================================

-- Info portal dinas yang disalin/ditinjau admin sebelum ditayangkan
create table if not exists public.dinas_info (
  id integer primary key default 1 check (id = 1),
  pengumuman jsonb not null default '[]'::jsonb,
  jadwal_url text,
  surat_url text,
  video_smk_url text,
  minat_nama_sekolah text,
  minat_pendaftar integer,
  minat_kuota integer,
  minat_persen text,
  sumber_update text,
  fetched_at timestamptz,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dinas_info enable row level security;

drop policy if exists "publik_baca_dinas_info" on public.dinas_info;
create policy "publik_baca_dinas_info"
  on public.dinas_info for select to anon
  using (true);

drop policy if exists "admin_dinas_info" on public.dinas_info;
create policy "admin_dinas_info"
  on public.dinas_info for all to authenticated
  using (true) with check (true);

insert into public.dinas_info (id) values (1)
on conflict (id) do nothing;

-- Distribusi 3 pilihan jurusan (agregat saja, tanpa data pribadi)
drop function if exists public.statistik_minat_jurusan(text);
create or replace function public.statistik_minat_jurusan(p_tahun text default null)
returns table (jurusan text, jumlah bigint, persen numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_total bigint;
begin
  select count(*) into v_total
  from public.pendaftar p
  where p_tahun is null or p.tahun_pelajaran = p_tahun;

  return query
    select j.jurusan,
           count(*)::bigint as jumlah,
           case when v_total > 0
             then round(count(*)::numeric / v_total * 100, 1)
             else 0
           end as persen
    from (
      select jurusan1 as jurusan from public.pendaftar p
        where p_tahun is null or p.tahun_pelajaran = p_tahun
      union all
      select jurusan2 from public.pendaftar p
        where p_tahun is null or p.tahun_pelajaran = p_tahun
      union all
      select jurusan3 from public.pendaftar p
        where p_tahun is null or p.tahun_pelajaran = p_tahun
    ) j
    group by j.jurusan
    order by count(*) desc;
end;
$$;

revoke all on function public.statistik_minat_jurusan(text) from public;
grant execute on function public.statistik_minat_jurusan(text) to anon, authenticated;
