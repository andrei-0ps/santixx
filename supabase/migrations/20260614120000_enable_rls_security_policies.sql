begin;

do $$
declare
  v_table text;
  v_relkind "char";
  v_has_user_id boolean;
  v_has_active boolean;
  v_select_predicate text;
  v_catalog_tables text[] := array[
    'anatomy_structures',
    'conditions',
    'condition_structures',
    'symptoms',
    'condition_symptoms',
    'triage_questions',
    'triage_options',
    'triage_rules',
    'medical_sources',
    'condition_sources',
    'ai_guardrails',
    'ai_knowledge_entries',
    'internal_organs',
    'organ_systems',
    'organs',
    'body_regions',
    'movement_patterns',
    'pain_classifications',
    'muscles',
    'muscle_groups',
    'muscle_movement_patterns',
    'model_3d_mappings',
    'model_muscle_mappings',
    'muscle_pain_profiles'
  ];
begin
  foreach v_table in array v_catalog_tables loop
    if to_regclass(format('public.%I', v_table)) is not null then
      select c.relkind
      into v_relkind
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = v_table
          and column_name = 'user_id'
      ) into v_has_user_id;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = v_table
          and column_name = 'active'
      ) into v_has_active;

      if v_relkind in ('v', 'm') then
        execute format('revoke all on table public.%I from anon, authenticated', v_table);
        execute format('grant select on table public.%I to anon, authenticated', v_table);
      elsif v_relkind in ('r', 'p') then
        execute format('alter table public.%I enable row level security', v_table);

        if v_has_user_id then
          execute format('drop policy if exists %I on public.%I', 'owner_select', v_table);
          execute format('drop policy if exists %I on public.%I', 'owner_insert', v_table);
          execute format('drop policy if exists %I on public.%I', 'owner_update', v_table);
          execute format('drop policy if exists %I on public.%I', 'owner_delete', v_table);

          execute format(
            'create policy %I on public.%I for select using (auth.uid() = user_id)',
            'owner_select',
            v_table
          );
          execute format(
            'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
            'owner_insert',
            v_table
          );
          execute format(
            'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
            'owner_update',
            v_table
          );
          execute format(
            'create policy %I on public.%I for delete using (auth.uid() = user_id)',
            'owner_delete',
            v_table
          );

          execute format('revoke all on table public.%I from anon', v_table);
          execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
        else
          v_select_predicate := case
            when v_has_active then 'active = true'
            else 'true'
          end;

          execute format('drop policy if exists %I on public.%I', 'public_read', v_table);
          execute format(
            'create policy %I on public.%I for select using (%s)',
            'public_read',
            v_table,
            v_select_predicate
          );

          execute format('grant select on table public.%I to anon, authenticated', v_table);
          execute format('revoke insert, update, delete on table public.%I from anon, authenticated', v_table);
        end if;
      end if;
    end if;
  end loop;
end $$;

alter table public.ai_conversations enable row level security;

drop policy if exists "owner_select" on public.ai_conversations;
create policy "owner_select"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "owner_insert" on public.ai_conversations;
create policy "owner_insert"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "owner_update" on public.ai_conversations;
create policy "owner_update"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner_delete" on public.ai_conversations;
create policy "owner_delete"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

revoke all on table public.ai_conversations from anon;
grant select, insert, update, delete on table public.ai_conversations to authenticated;

alter table public.ai_messages enable row level security;

drop policy if exists "owner_select" on public.ai_messages;
create policy "owner_select"
  on public.ai_messages for select
  using (
    exists (
      select 1
      from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "owner_insert" on public.ai_messages;
create policy "owner_insert"
  on public.ai_messages for insert
  with check (
    exists (
      select 1
      from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

revoke all on table public.ai_messages from anon;
grant select, insert on table public.ai_messages to authenticated;

do $$
begin
  if to_regclass('public.ai_rate_limits') is not null then
    alter table public.ai_rate_limits enable row level security;

    drop policy if exists "owner_select" on public.ai_rate_limits;
    create policy "owner_select"
      on public.ai_rate_limits for select
      using (auth.uid() = user_id);

    drop policy if exists "owner_insert" on public.ai_rate_limits;
    create policy "owner_insert"
      on public.ai_rate_limits for insert
      with check (auth.uid() = user_id);

    drop policy if exists "owner_update" on public.ai_rate_limits;
    create policy "owner_update"
      on public.ai_rate_limits for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    revoke all on table public.ai_rate_limits from anon;
    grant select, insert, update on table public.ai_rate_limits to authenticated;
  end if;
end $$;

commit;
