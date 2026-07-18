create table if not exists public.ai_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, window_start),
  constraint ai_rate_limits_action_len check (char_length(action) between 1 and 80),
  constraint ai_rate_limits_count_nonnegative check (request_count >= 0)
);

create index if not exists ai_rate_limits_user_action_idx
  on public.ai_rate_limits (user_id, action, window_start desc);

alter table public.ai_rate_limits enable row level security;

drop policy if exists "Users can read own AI rate limits" on public.ai_rate_limits;
create policy "Users can read own AI rate limits"
  on public.ai_rate_limits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own AI rate limits" on public.ai_rate_limits;
create policy "Users can create own AI rate limits"
  on public.ai_rate_limits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own AI rate limits" on public.ai_rate_limits;
create policy "Users can update own AI rate limits"
  on public.ai_rate_limits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.check_ai_rate_limit(
  p_action text,
  p_limit integer default 12,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_seconds integer := greatest(10, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 1000));
  v_window_start timestamptz;
  v_count integer;
  v_retry_after integer;
begin
  if v_user_id is null then
    raise exception 'auth.uid() is required for AI rate limiting';
  end if;

  v_window_start :=
    to_timestamp(floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds);

  insert into public.ai_rate_limits (user_id, action, window_start, request_count, updated_at)
  values (v_user_id, left(coalesce(p_action, 'ai'), 80), v_window_start, 1, now())
  on conflict (user_id, action, window_start)
  do update set
    request_count = public.ai_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  v_retry_after := greatest(
    1,
    ceil(extract(epoch from (v_window_start + make_interval(secs => v_window_seconds) - now())))::integer
  );

  return jsonb_build_object(
    'allowed', v_count <= v_limit,
    'remaining', greatest(v_limit - v_count, 0),
    'retry_after_seconds', case when v_count <= v_limit then 0 else v_retry_after end
  );
end;
$$;

comment on table public.ai_rate_limits is
  'limite_utilizare_ai: contoare de rate limiting pentru cererile AI ale utilizatorilor autentificati';

comment on function public.check_ai_rate_limit(text, integer, integer) is
  'Verifica si incrementeaza atomic limita de cereri AI pentru utilizatorul autentificat.';
