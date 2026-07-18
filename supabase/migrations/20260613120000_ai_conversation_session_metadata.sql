
alter table if exists public.ai_conversations
  add column if not exists active_mode text,
  add column if not exists active_entity_type text,
  add column if not exists active_entity_id text,
  add column if not exists active_model_part_key text,
  add column if not exists ai_model_used text;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'ai_conversations'
      and indexdef ilike '%(user_id, updated_at DESC)%'
  ) then
    create index ai_conversations_user_updated_at_idx
      on public.ai_conversations (user_id, updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_conversations_active_entity_type_check'
      and conrelid = 'public.ai_conversations'::regclass
  ) then
    alter table public.ai_conversations
      add constraint ai_conversations_active_entity_type_check
      check (
        active_entity_type is null
        or active_entity_type in ('os', 'muschi', 'tendon', 'nerv', 'organ', 'articulatie')
      );
  end if;
end $$;
