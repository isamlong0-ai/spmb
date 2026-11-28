-- ============================================================
-- 0021_galeri_verifikasi.sql
-- Verifikasi admin sebelum galeri dipublikasikan
-- ============================================================
alter table public.web_galeri
  add column if not exists status text not null default 'draft'
  check (status in ('draft','pending','published'));

update public.web_galeri set status = case when is_published then 'published' else 'draft' end;

create or replace function public.guard_galeri_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.web_role() not in ('superadmin','admin','admin_web') then
    if new.is_published is true and (old.is_published is distinct from true) then
      raise exception 'Hanya admin yang dapat mempublikasikan galeri';
    end if;
    if new.status = 'published' and (old.status is distinct from 'published') then
      raise exception 'Hanya admin yang dapat mempublikasikan galeri';
    end if;
    new.is_published := false;
    if new.status = 'published' then new.status := 'pending'; end if;
  end if;
  new.is_published := (new.status = 'published');
  return new;
end; $$;

drop trigger if exists trg_guard_galeri_publish on public.web_galeri;
create trigger trg_guard_galeri_publish before insert or update on public.web_galeri
  for each row execute function public.guard_galeri_publish();