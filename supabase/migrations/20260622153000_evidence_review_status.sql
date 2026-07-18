begin;

alter table public.condition_sources
  add column if not exists source_checked_at date,
  add column if not exists review_status text not null default 'mapped';

alter table public.ai_knowledge_sources
  add column if not exists source_checked_at date,
  add column if not exists review_status text not null default 'mapped';

update public.condition_sources
set
  source_checked_at = coalesce(source_checked_at, verified_at, date '2026-06-22'),
  verified_at = case
    when review_status = 'clinically_verified' then verified_at
    else null
  end,
  review_status = case
    when review_status = 'clinically_verified' then review_status
    else 'mapped'
  end;

update public.ai_knowledge_sources
set
  source_checked_at = coalesce(source_checked_at, verified_at, date '2026-06-22'),
  verified_at = case
    when review_status = 'clinically_verified' then verified_at
    else null
  end,
  review_status = case
    when review_status = 'clinically_verified' then review_status
    else 'mapped'
  end;

alter table public.condition_sources
  drop constraint if exists condition_sources_review_status_check,
  drop constraint if exists condition_sources_clinical_review_check;

alter table public.condition_sources
  add constraint condition_sources_review_status_check
    check (review_status in ('mapped', 'clinically_verified', 'rejected')),
  add constraint condition_sources_clinical_review_check
    check (review_status <> 'clinically_verified' or verified_at is not null);

alter table public.ai_knowledge_sources
  drop constraint if exists ai_knowledge_sources_review_status_check,
  drop constraint if exists ai_knowledge_sources_clinical_review_check;

alter table public.ai_knowledge_sources
  add constraint ai_knowledge_sources_review_status_check
    check (review_status in ('mapped', 'clinically_verified', 'rejected')),
  add constraint ai_knowledge_sources_clinical_review_check
    check (review_status <> 'clinically_verified' or verified_at is not null);

create or replace view public.ai_knowledge_with_sources
with (security_invoker = true)
as
select
  knowledge.*,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', source.id,
          'title_ro', source.title_ro,
          'title_en', source.title_en,
          'publisher', source.publisher,
          'url', source.url,
          'is_primary', link.is_primary,
          'evidence_scope', link.evidence_scope,
          'source_checked_at', link.source_checked_at,
          'review_status', link.review_status,
          'clinically_verified_at', link.verified_at
        )
        order by link.is_primary desc, source.publisher, source.title_en
      )
      from public.ai_knowledge_sources link
      join public.medical_sources source on source.id = link.source_id
      where link.knowledge_entry_id = knowledge.id
        and source.active = true
        and link.review_status <> 'rejected'
    ),
    '[]'::jsonb
  ) as sources
from public.ai_knowledge_entries knowledge;

create or replace view public.condition_evidence_catalog
with (security_invoker = true)
as
select
  condition_row.id as condition_id,
  condition_row.slug as condition_slug,
  condition_row.name_ro,
  condition_row.name_en,
  count(source.id) filter (where link.review_status <> 'rejected') as source_count,
  count(source.id) filter (
    where link.is_primary
      and link.review_status <> 'rejected'
  ) as primary_source_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', source.id,
        'title_ro', source.title_ro,
        'title_en', source.title_en,
        'publisher', source.publisher,
        'url', source.url,
        'is_primary', link.is_primary,
        'supports_fields', link.supports_fields,
        'source_checked_at', link.source_checked_at,
        'review_status', link.review_status,
        'clinically_verified_at', link.verified_at
      )
      order by link.is_primary desc, source.publisher, source.title_en
    ) filter (
      where source.id is not null
        and link.review_status <> 'rejected'
    ),
    '[]'::jsonb
  ) as sources,
  count(source.id) filter (
    where link.review_status = 'clinically_verified'
  ) as clinically_verified_source_count
from public.conditions condition_row
left join public.condition_sources link on link.condition_id = condition_row.id
left join public.medical_sources source
  on source.id = link.source_id
 and source.active = true
group by
  condition_row.id,
  condition_row.slug,
  condition_row.name_ro,
  condition_row.name_en;

notify pgrst, 'reload schema';

commit;
