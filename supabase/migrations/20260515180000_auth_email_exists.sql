create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.auth_email_exists(text) from public;
grant execute on function public.auth_email_exists(text) to anon, authenticated;

comment on function public.auth_email_exists(text) is
  'Verifica daca exista deja un cont pentru emailul introdus in formularul de autentificare Santix.';
