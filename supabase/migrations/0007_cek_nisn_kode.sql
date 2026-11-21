-- =============================================================================
-- Migrasi 0007 — Tambah kode pendaftaran pada hasil cek NISN
-- Dipakai halaman cek.html untuk cetak ulang bukti pendaftaran.
-- =============================================================================

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
  tahun_pelajaran text,
  kode_pendaftaran text
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
      p.tahun_pelajaran,
      p.kode_pendaftaran
    from public.pendaftar p
    where p.nisn = p_nisn
    order by p.created_at desc
    limit 1;

  if not found then
    return query
      select false, null::text, null::text, null::text, null::text, null::text,
             null::text, null::text, null::text, null::text;
  end if;
end;
$$;

revoke all on function public.cek_nisn(text) from public;
grant execute on function public.cek_nisn(text) to anon, authenticated;
