begin;

do $$
declare
  v_has_title boolean;
  v_has_title_en boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medical_sources'
      and column_name = 'title'
  ) into v_has_title;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medical_sources'
      and column_name = 'title_en'
  ) into v_has_title_en;

  if v_has_title and not v_has_title_en then
    execute 'alter table public.medical_sources rename column title to title_en';
  elsif v_has_title and v_has_title_en then
    execute '
      update public.medical_sources
      set title_en = coalesce(
        nullif(trim(title_en), ''''),
        nullif(trim(title), '''')
      )
    ';
    execute 'alter table public.medical_sources drop column title';
  elsif not v_has_title_en then
    execute 'alter table public.medical_sources add column title_en text';
  end if;
end $$;

do $$
declare
  v_has_notes boolean;
  v_has_notes_en boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medical_sources'
      and column_name = 'notes'
  ) into v_has_notes;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medical_sources'
      and column_name = 'notes_en'
  ) into v_has_notes_en;

  if v_has_notes and not v_has_notes_en then
    execute 'alter table public.medical_sources rename column notes to notes_en';
  elsif v_has_notes and v_has_notes_en then
    execute '
      update public.medical_sources
      set notes_en = coalesce(
        nullif(trim(notes_en), ''''),
        nullif(trim(notes), '''')
      )
    ';
    execute 'alter table public.medical_sources drop column notes';
  elsif not v_has_notes_en then
    execute 'alter table public.medical_sources add column notes_en text';
  end if;
end $$;

alter table public.medical_sources
  add column if not exists title_ro text,
  add column if not exists notes_ro text,
  add column if not exists source_language text,
  add column if not exists last_verified_at date,
  add column if not exists active boolean,
  add column if not exists review_status text,
  add column if not exists updated_at timestamptz;

update public.medical_sources
set
  source_language = coalesce(nullif(trim(source_language), ''), 'en'),
  active = coalesce(active, true),
  review_status = coalesce(nullif(trim(review_status), ''), 'needs_review'),
  updated_at = coalesce(updated_at, created_at, now())
where true;

update public.medical_sources
set
  title_en = 'Fractures',
  title_ro = 'Fracturi',
  notes_en = 'fractures',
  notes_ro = 'fracturi',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://medlineplus.gov/fractures.html';

update public.medical_sources
set
  title_en = 'Overview of Fractures',
  title_ro = 'Prezentare generală a fracturilor',
  notes_en = 'fractures',
  notes_ro = 'fracturi',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://www.merckmanuals.com/home/injuries-and-poisoning/fractures/overview-of-fractures';

update public.medical_sources
set
  title_en = 'Broken or bruised ribs',
  title_ro = 'Coaste fracturate sau contuzionate',
  notes_en = 'rib injuries',
  notes_ro = 'leziuni costale',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://www.nhs.uk/conditions/broken-or-bruised-ribs/';

update public.medical_sources
set
  title_en = 'Compression fractures of the back',
  title_ro = 'Fracturi de compresie ale coloanei vertebrale',
  notes_en = 'spine',
  notes_ro = 'coloană vertebrală',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://medlineplus.gov/ency/article/000443.htm';

update public.medical_sources
set
  title_en = 'Arm Injuries and Disorders',
  title_ro = 'Leziuni și afecțiuni ale brațului',
  notes_en = 'upper limb',
  notes_ro = 'membru superior',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://medlineplus.gov/arminjuriesanddisorders.html';

update public.medical_sources
set
  title_en = 'Broken Arm (Fractured Arm): Symptoms, Treatment & Recovery',
  title_ro = 'Braț fracturat: simptome, tratament și recuperare',
  notes_en = 'upper limb fractures',
  notes_ro = 'fracturi ale membrului superior',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://my.clevelandclinic.org/health/diseases/broken-arm-fractured-arm';

update public.medical_sources
set
  title_en = 'Hip Injuries and Disorders',
  title_ro = 'Leziuni și afecțiuni ale șoldului',
  notes_en = 'hip pelvis',
  notes_ro = 'șold și pelvis',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://medlineplus.gov/hipinjuriesanddisorders.html';

update public.medical_sources
set
  title_en = 'Foot Injuries and Disorders',
  title_ro = 'Leziuni și afecțiuni ale piciorului',
  notes_en = 'foot',
  notes_ro = 'picior',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://medlineplus.gov/footinjuriesanddisorders.html';

update public.medical_sources
set
  title_en = 'Facial Trauma',
  title_ro = 'Traumatisme faciale',
  notes_en = 'facial trauma',
  notes_ro = 'traumatisme faciale',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/facial-trauma';

update public.medical_sources
set
  title_en = 'Nasal Fracture Reduction',
  title_ro = 'Reducerea fracturii nazale',
  notes_en = 'nasal fractures',
  notes_ro = 'fracturi nazale',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK538299/';

update public.medical_sources
set
  title_en = 'Kneecap Fractures (Patella Fractures)',
  title_ro = 'Fracturi ale rotulei (fracturi patelare)',
  notes_en = 'patella',
  notes_ro = 'rotulă',
  source_language = 'en',
  last_verified_at = date '2026-06-21',
  active = true,
  review_status = 'verified',
  updated_at = now()
where url = 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/kneecap-fractures';

do $$
begin
  if (
    select count(*)
    from public.medical_sources
    where url in (
      'https://medlineplus.gov/fractures.html',
      'https://www.merckmanuals.com/home/injuries-and-poisoning/fractures/overview-of-fractures',
      'https://www.nhs.uk/conditions/broken-or-bruised-ribs/',
      'https://medlineplus.gov/ency/article/000443.htm',
      'https://medlineplus.gov/arminjuriesanddisorders.html',
      'https://my.clevelandclinic.org/health/diseases/broken-arm-fractured-arm',
      'https://medlineplus.gov/hipinjuriesanddisorders.html',
      'https://medlineplus.gov/footinjuriesanddisorders.html',
      'https://www.hopkinsmedicine.org/health/conditions-and-diseases/facial-trauma',
      'https://www.ncbi.nlm.nih.gov/sites/books/NBK538299/',
      'https://www.hopkinsmedicine.org/health/conditions-and-diseases/kneecap-fractures'
    )
  ) <> 11 then
    raise exception 'Expected all 11 baseline medical sources to exist before localization';
  end if;
end $$;

alter table public.medical_sources
  alter column source_language set default 'en',
  alter column source_language set not null,
  alter column active set default true,
  alter column active set not null,
  alter column review_status set default 'needs_review',
  alter column review_status set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column title_en set not null,
  alter column title_ro set not null;

alter table public.medical_sources
  drop constraint if exists medical_sources_title_en_not_blank,
  drop constraint if exists medical_sources_title_ro_not_blank,
  drop constraint if exists medical_sources_url_https_check,
  drop constraint if exists medical_sources_language_check,
  drop constraint if exists medical_sources_review_status_check,
  drop constraint if exists medical_sources_verified_check,
  drop constraint if exists medical_sources_archived_inactive_check;

alter table public.medical_sources
  add constraint medical_sources_title_en_not_blank
    check (char_length(trim(title_en)) > 0),
  add constraint medical_sources_title_ro_not_blank
    check (char_length(trim(title_ro)) > 0),
  add constraint medical_sources_url_https_check
    check (url is null or url ~ '^https://'),
  add constraint medical_sources_language_check
    check (source_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  add constraint medical_sources_review_status_check
    check (review_status in ('needs_review', 'verified', 'archived')),
  add constraint medical_sources_verified_check
    check (
      review_status <> 'verified'
      or (
        url is not null
        and last_verified_at is not null
        and nullif(trim(coalesce(publisher, '')), '') is not null
      )
    ),
  add constraint medical_sources_archived_inactive_check
    check (review_status <> 'archived' or active = false);

create unique index if not exists medical_sources_url_unique_idx
  on public.medical_sources (url)
  where url is not null;

create index if not exists medical_sources_active_type_idx
  on public.medical_sources (active, source_type);

create index if not exists medical_sources_publisher_idx
  on public.medical_sources (publisher);

create index if not exists medical_sources_notes_en_idx
  on public.medical_sources (notes_en);

create index if not exists medical_sources_review_status_idx
  on public.medical_sources (review_status, last_verified_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists medical_sources_set_updated_at on public.medical_sources;
create trigger medical_sources_set_updated_at
  before update on public.medical_sources
  for each row
  execute function public.set_updated_at();

drop policy if exists public_read on public.medical_sources;
create policy public_read
  on public.medical_sources
  for select
  using (active = true);

grant select on table public.medical_sources to anon, authenticated;
revoke insert, update, delete on table public.medical_sources from anon, authenticated;

select
  notes_en,
  notes_ro,
  count(*) as source_count,
  array_agg(distinct publisher order by publisher) as publishers,
  jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title_en', title_en,
      'title_ro', title_ro,
      'url', url,
      'publisher', publisher,
      'source_type', source_type,
      'last_verified_at', last_verified_at
    )
    order by title_en
  ) as sources
from public.medical_sources
where active = true
group by notes_en, notes_ro
order by notes_en nulls last;

select
  id,
  title_en,
  title_ro,
  url,
  publisher,
  source_type,
  notes_en,
  notes_ro,
  last_verified_at,
  review_status
from public.medical_sources
where active = true
  and publisher = 'MedlinePlus / NIH'
order by title_en;

select
  ms.id,
  ms.title_en,
  ms.title_ro,
  ms.publisher,
  ms.notes_en,
  ms.notes_ro,
  count(cs.condition_id) as linked_condition_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'slug', c.slug,
        'name_ro', c.name_ro,
        'name_en', c.name_en
      )
      order by c.slug
    ) filter (where c.id is not null),
    '[]'::jsonb
  ) as linked_conditions
from public.medical_sources ms
left join public.condition_sources cs on cs.source_id = ms.id
left join public.conditions c on c.id = cs.condition_id
where ms.active = true
group by
  ms.id,
  ms.title_en,
  ms.title_ro,
  ms.publisher,
  ms.notes_en,
  ms.notes_ro
order by ms.publisher, ms.title_en;

commit;
