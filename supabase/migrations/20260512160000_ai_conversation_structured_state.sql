alter table public.ai_conversations
  add column if not exists structured_state jsonb not null default '{}'::jsonb;
