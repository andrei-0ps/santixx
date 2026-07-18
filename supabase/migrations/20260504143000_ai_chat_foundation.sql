create type public.ai_message_role as enum ('user', 'assistant', 'system');

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  structure_slug text references public.anatomy_structures(slug) on update cascade on delete set null,
  model_selection_id text,
  tissue public.tissue_type,
  title text not null default 'Consultație Santix',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role public.ai_message_role not null,
  content_ro text not null,
  retrieved_context jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);
create index ai_conversations_structure_idx on public.ai_conversations (structure_slug, model_selection_id);
create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "Users can read own AI conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create own AI conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own AI conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own AI conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

create policy "Users can read own AI messages"
  on public.ai_messages for select
  using (
    exists (
      select 1
      from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own AI conversations"
  on public.ai_messages for insert
  with check (
    exists (
      select 1
      from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

