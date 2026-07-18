alter table public.ai_conversations
  add column if not exists language text;

update public.ai_conversations
set language = 'ro'
where language is null
   or language not in ('ro', 'en');

alter table public.ai_conversations
  alter column language set default 'ro',
  alter column language set not null;

alter table public.ai_conversations
  drop constraint if exists ai_conversations_language_check;

alter table public.ai_conversations
  add constraint ai_conversations_language_check
  check (language in ('ro', 'en'));

alter table public.ai_messages
  add column if not exists content_en text;

alter table public.ai_messages
  alter column content_ro drop not null;

alter table public.ai_messages
  drop constraint if exists ai_messages_has_localized_content_check;

alter table public.ai_messages
  add constraint ai_messages_has_localized_content_check
  check (
    nullif(trim(content_ro), '') is not null
    or nullif(trim(content_en), '') is not null
  );
