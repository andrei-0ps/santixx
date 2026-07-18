create or replace function public.delete_current_new_google_user()
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_created_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'auth.uid() is required';
  end if;

  select created_at
  into v_created_at
  from auth.users
  where id = v_user_id;

  if v_created_at is null then
    return false;
  end if;

  if v_created_at < now() - interval '10 minutes' then
    raise exception 'Only a newly created account can be removed by this flow';
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_user_id
      and provider = 'google'
  ) then
    raise exception 'Only a newly created Google account can be removed by this flow';
  end if;

  delete from auth.users
  where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.delete_current_new_google_user() from public;
grant execute on function public.delete_current_new_google_user() to authenticated;

comment on function public.delete_current_new_google_user() is
  'Sterge contul Google abia creat cand utilizatorul a ales din greseala fluxul de logare in loc de creare cont.';
