-- ============================================================
-- 0017_berita_verifikasi.sql
-- Status verifikasi/publish berita (harus diverifikasi admin)
-- ============================================================
alter table public.web_berita
  add column if not exists status text not null default 'draft'
  check (status in ('draft','pending','published'));

-- sinkronkan status dari is_published yang sudah ada
update public.web_berita set status = case when is_published then 'published' else 'draft' end;

-- trigger: non-admin tidak boleh set status 'published' atau is_published true
create or replace function public.guard_berita_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.web_role() not in ('superadmin','admin','admin_web') then
    if new.is_published is true and (old.is_published is distinct from true) then
      raise exception 'Hanya admin yang dapat mempublikasikan berita';
    end if;
    if new.status = 'published' and (old.status is distinct from 'published') then
      raise exception 'Hanya admin yang dapat mempublikasikan berita';
    end if;
    -- paksa tetap false/pending untuk non-admin
    new.is_published := false;
    if new.status = 'published' then new.status := 'pending'; end if;
  end if;
  -- sinkronkan is_published dengan status
  new.is_published := (new.status = 'published');
  return new;
end; $$;

drop trigger if exists trg_guard_berita_publish on public.web_berita;
create trigger trg_guard_berita_publish before insert or update on public.web_berita
  for each row execute function public.guard_berita_publish();