begin;

update public.muscles
set
  primary_actions_en = array_replace(
    primary_actions_en,
    'stabilizare umăr',
    'shoulder stabilization'
  ),
  description_en = replace(
    description_en,
    'stabilizare umăr',
    'shoulder stabilization'
  ),
  updated_at = now()
where 'stabilizare umăr' = any(primary_actions_en)
   or description_en like '%stabilizare umăr%';

do $$
begin
  if exists (
    select 1
    from public.muscles
    where array_to_string(primary_actions_en, ' ') ~* '[ăâîșşțţ]'
       or array_to_string(primary_actions_en, ' ') ~* '\m(durere|muschi|miscare|umar|genunchi|gamba|coapsa|spate|usoara|medie|severa|consultare|odihna|hidratare)\M'
  ) then
    raise exception 'muscles.primary_actions_en still contains Romanian content';
  end if;
end
$$;

commit;
