
alter table if exists public.ai_conversations
  add column if not exists structured_state jsonb not null default '{}'::jsonb;

update public.ai_conversations
set structured_state = '{}'::jsonb
where structured_state is null;
