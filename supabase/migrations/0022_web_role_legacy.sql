-- ============================================================
-- 0022_web_role_legacy.sql
-- Kompatibilitas: role lama 'admin' dianggap 'superadmin'
-- ============================================================
create or replace function public.web_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case role when 'admin' then 'superadmin' else role end
  from public.web_roles
  where user_id = auth.uid();
$$;

grant execute on function public.web_role() to anon, authenticated;