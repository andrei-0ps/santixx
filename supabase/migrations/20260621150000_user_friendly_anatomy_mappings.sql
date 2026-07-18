begin;

do $$
begin
  create type public.anatomical_entity_type as enum (
    'muscle',
    'muscle_group',
    'bone',
    'organ',
    'ligament',
    'tendon'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.anatomical_laterality as enum (
    'left',
    'right',
    'midline',
    'bilateral',
    'unspecified'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.conditions
  add column if not exists popular_name_ro text;

update public.conditions
set
  popular_name_ro = case slug
    when 'crampa-musculara' then 'Cârcel / spasm muscular'
    when 'contractura-musculara' then 'Mușchi încordat / blocat'
    when 'intindere-musculara' then 'Mușchi întins'
    when 'ruptura-musculara' then 'Mușchi rupt / ruptură fibrară'
    when 'febra-musculara-intarziata' then 'Febră musculară după efort'
    when 'contuzie-musculara' then 'Lovitură / vânătaie la mușchi'
    when 'tendinopatie' then 'Tendon suprasolicitat / durere de tendon'
    when 'ruptura-tendon' then 'Tendon rupt'
    when 'entorsa-articulara' then 'Entorsă / ligament întins'
    when 'luxatie-articulara' then 'Articulație ieșită din loc'
    when 'fractura-osoasa' then 'Os rupt / fractură'
    when 'fractura-de-stres' then 'Fisură osoasă de suprasolicitare'
    else coalesce(nullif(trim(popular_name_ro), ''), name_ro)
  end,
  aliases_ro = case slug
    when 'crampa-musculara' then array(
      select distinct value
      from unnest(coalesce(aliases_ro, '{}') || array['cârcel', 'carcel', 'spasm muscular']) as value
    )
    when 'contractura-musculara' then array(
      select distinct value
      from unnest(coalesce(aliases_ro, '{}') || array['mușchi încordat', 'muschi incordat', 'mușchi blocat', 'muschi blocat']) as value
    )
    when 'intindere-musculara' then array(
      select distinct value
      from unnest(coalesce(aliases_ro, '{}') || array['mușchi întins', 'muschi intins', 'întindere de mușchi', 'intindere de muschi']) as value
    )
    when 'ruptura-musculara' then array(
      select distinct value
      from unnest(coalesce(aliases_ro, '{}') || array['mușchi rupt', 'muschi rupt', 'ruptură fibrară', 'ruptura fibrara']) as value
    )
    else aliases_ro
  end,
  updated_at = now()
where active = true;

alter table public.conditions
  drop constraint if exists conditions_popular_name_ro_not_blank;

alter table public.conditions
  add constraint conditions_popular_name_ro_not_blank
    check (popular_name_ro is null or char_length(trim(popular_name_ro)) > 0);

alter table public.model_muscle_mappings
  add column if not exists display_name_ro text,
  add column if not exists display_name_en text,
  add column if not exists popular_name_ro text,
  add column if not exists entity_type public.anatomical_entity_type,
  add column if not exists laterality public.anatomical_laterality,
  add column if not exists anatomy_structure_id uuid references public.anatomy_structures(id) on delete restrict,
  add column if not exists mapping_confidence smallint,
  add column if not exists review_status text,
  add column if not exists active boolean;

create or replace function public.model_part_display_name_en(p_model_part_key text)
returns text
language plpgsql
immutable
strict
as $$
declare
  v_base text;
  v_side text;
begin
  v_side := case
    when p_model_part_key ~ '-left$' then 'left'
    when p_model_part_key ~ '-right$' then 'right'
    else null
  end;

  v_base := regexp_replace(p_model_part_key, '^muschi-', '');
  v_base := regexp_replace(v_base, '-(left|right)$', '');
  v_base := replace(v_base, '-', ' ');
  v_base := upper(left(v_base, 1)) || substr(v_base, 2);

  if v_side is not null then
    return v_base || ' (' || v_side || ')';
  end if;

  return v_base;
end;
$$;

with resolved as (
  select
    mm.id,
    coalesce(mg_direct.slug, mg_from_muscle.slug) as group_slug,
    m.slug as muscle_slug,
    a.id as anatomy_structure_id
  from public.model_muscle_mappings mm
  left join public.muscles m on m.id = mm.muscle_id
  left join public.muscle_groups mg_from_muscle on mg_from_muscle.id = m.muscle_group_id
  left join public.muscle_groups mg_direct on mg_direct.id = mm.muscle_group_id
  left join public.anatomy_structures a
    on a.slug = coalesce(mg_direct.slug, mg_from_muscle.slug)
   and a.tissue = 'muschi'
)
update public.model_muscle_mappings mm
set
  display_name_ro = coalesce(nullif(trim(mm.model_label), ''), mm.model_selection_id),
  display_name_en = public.model_part_display_name_en(mm.model_selection_id),
  popular_name_ro = case
    when resolved.muscle_slug = 'biceps-brahial' then 'Biceps'
    when resolved.muscle_slug = 'triceps-brahial' then 'Triceps'
    when resolved.muscle_slug in ('gastrocnemian', 'solear') then 'Mușchiul gambei / molet'
    when resolved.muscle_slug = 'drept-abdominal' then 'Mușchii abdomenului / „pătrățele”'
    when resolved.muscle_slug in ('pectoral-mare', 'pectoral-mic') then 'Mușchii pieptului / pectorali'
    when resolved.muscle_slug in ('fesier-mare', 'fesier-mijlociu', 'fesier-mic') then 'Mușchii fesieri'
    when resolved.muscle_slug like 'deltoid-%' then 'Mușchiul umărului'
    when resolved.muscle_slug in ('dorsal-mare', 'trapez', 'rotund-mare') then 'Mușchii spatelui'
    when resolved.group_slug = 'adductori' then 'Mușchii din interiorul coapsei'
    when resolved.group_slug = 'coafa-rotatorilor' then 'Mușchii care stabilizează umărul'
    when resolved.group_slug = 'cvadriceps' then 'Mușchii din fața coapsei / cvadriceps'
    when resolved.group_slug = 'ischiogambieri' then 'Mușchii din spatele coapsei'
    when resolved.group_slug = 'muschii-abdominali' then 'Mușchii abdomenului'
    when resolved.group_slug = 'muschii-antebratului' then 'Mușchii antebrațului'
    when resolved.group_slug = 'muschii-bratului-anteriori' then 'Mușchii din fața brațului / biceps'
    when resolved.group_slug = 'muschii-bratului-posteriori' then 'Mușchii din spatele brațului / triceps'
    when resolved.group_slug = 'muschii-fesieri' then 'Mușchii fesieri'
    when resolved.group_slug = 'muschii-gambei' then 'Mușchiul gambei / molet'
    when resolved.group_slug = 'muschii-gatului' then 'Mușchii gâtului'
    when resolved.group_slug = 'muschii-masticatori' then 'Mușchii maxilarului / pentru mestecat'
    when resolved.group_slug = 'muschii-pieptului' then 'Mușchii pieptului / pectorali'
    when resolved.group_slug = 'muschii-soldului-profunzi' then 'Mușchii profunzi ai șoldului'
    when resolved.group_slug = 'muschii-spatelui-profunzi' then 'Mușchii profunzi ai spatelui'
    when resolved.group_slug = 'muschii-spatelui-superficiali' then 'Mușchii spatelui'
    when resolved.group_slug = 'muschii-tibiali-peronieri' then 'Mușchii din fața și lateralul gambei'
    when resolved.group_slug = 'muschii-umarului' then 'Mușchii umărului'
    else coalesce(nullif(trim(mm.model_label), ''), 'Mușchi')
  end,
  entity_type = case
    when mm.muscle_id is not null then 'muscle'::public.anatomical_entity_type
    else 'muscle_group'::public.anatomical_entity_type
  end,
  laterality = case
    when mm.model_selection_id ~ '-left$' then 'left'::public.anatomical_laterality
    when mm.model_selection_id ~ '-right$' then 'right'::public.anatomical_laterality
    when mm.muscle_group_id is not null then 'bilateral'::public.anatomical_laterality
    else 'midline'::public.anatomical_laterality
  end,
  anatomy_structure_id = resolved.anatomy_structure_id,
  mapping_confidence = case
    when resolved.anatomy_structure_id is not null and mm.muscle_id is not null then 95
    when resolved.anatomy_structure_id is not null and mm.muscle_group_id is not null then 90
    else 50
  end,
  review_status = case
    when resolved.anatomy_structure_id is not null then 'mapped'
    else 'needs_review'
  end,
  active = true,
  updated_at = now()
from resolved
where resolved.id = mm.id;

do $$
begin
  if exists (
    select 1
    from public.model_muscle_mappings
    where anatomy_structure_id is null
       or nullif(trim(display_name_ro), '') is null
       or nullif(trim(display_name_en), '') is null
       or nullif(trim(popular_name_ro), '') is null
       or entity_type is null
       or laterality is null
  ) then
    raise exception 'Every active muscle model mapping must resolve to names, entity type, laterality and an anatomy structure';
  end if;
end $$;

alter table public.model_muscle_mappings
  alter column display_name_ro set not null,
  alter column display_name_en set not null,
  alter column popular_name_ro set not null,
  alter column entity_type set not null,
  alter column laterality set not null,
  alter column anatomy_structure_id set not null,
  alter column mapping_confidence set default 50,
  alter column mapping_confidence set not null,
  alter column review_status set default 'needs_review',
  alter column review_status set not null,
  alter column active set default true,
  alter column active set not null;

alter table public.model_muscle_mappings
  drop constraint if exists model_muscle_mappings_entity_target_check,
  drop constraint if exists model_muscle_mappings_confidence_check,
  drop constraint if exists model_muscle_mappings_review_status_check;

alter table public.model_muscle_mappings
  add constraint model_muscle_mappings_entity_target_check
    check (
      (entity_type = 'muscle' and muscle_id is not null and muscle_group_id is null)
      or
      (entity_type = 'muscle_group' and muscle_group_id is not null and muscle_id is null)
    ),
  add constraint model_muscle_mappings_confidence_check
    check (mapping_confidence between 0 and 100),
  add constraint model_muscle_mappings_review_status_check
    check (review_status in ('needs_review', 'mapped', 'verified', 'archived'));

create unique index if not exists model_muscle_mappings_selection_unique_idx
  on public.model_muscle_mappings (model_name, model_selection_id);

create index if not exists model_muscle_mappings_anatomy_structure_idx
  on public.model_muscle_mappings (anatomy_structure_id, active);

create index if not exists model_muscle_mappings_popular_name_idx
  on public.model_muscle_mappings (popular_name_ro);

insert into public.condition_structures (
  condition_id,
  structure_id,
  relevance,
  relevance_ro,
  relevance_en
)
select
  c.id,
  mapped.structure_id,
  condition_map.relevance,
  condition_map.relevance_ro,
  condition_map.relevance_en
from (
  select distinct anatomy_structure_id as structure_id
  from public.model_muscle_mappings
  where active = true
) mapped
cross join (
  values
    ('crampa-musculara', 3, 'Poate apărea în orice mușchi, mai ales după efort, oboseală sau menținerea unei poziții.', 'May occur in any muscle, especially after exertion, fatigue or prolonged positioning.'),
    ('contractura-musculara', 3, 'Poate produce tensiune persistentă și limitarea mișcării în grupa musculară selectată.', 'May cause persistent tightness and restricted movement in the selected muscle group.'),
    ('intindere-musculara', 4, 'Este o leziune frecventă după suprasolicitare sau mișcare bruscă.', 'A common injury after overload or sudden movement.'),
    ('ruptura-musculara', 2, 'Este mai puțin frecventă, dar trebuie luată în calcul după pocnet, vânătaie sau pierdere de forță.', 'Less common, but relevant after a pop, bruising or loss of strength.'),
    ('febra-musculara-intarziata', 3, 'Poate apărea după un antrenament nou sau mai intens decât de obicei.', 'May occur after unfamiliar or more intense exercise.'),
    ('contuzie-musculara', 2, 'Poate apărea după o lovitură directă în zona musculară selectată.', 'May occur after a direct blow to the selected muscle area.')
) as condition_map(condition_slug, relevance, relevance_ro, relevance_en)
join public.conditions c
  on c.slug = condition_map.condition_slug
 and c.active = true
on conflict (condition_id, structure_id) do update set
  relevance = excluded.relevance,
  relevance_ro = excluded.relevance_ro,
  relevance_en = excluded.relevance_en;

drop view if exists public.model_3d_mappings;

create view public.model_3d_mappings
with (security_invoker = true)
as
select
  mm.id,
  mm.model_name,
  mm.model_selection_id as model_part_key,
  null::text as mesh_name,
  mm.display_name_ro,
  mm.display_name_en,
  mm.popular_name_ro,
  mm.model_label as source_model_label,
  mm.entity_type,
  coalesce(mm.muscle_id, mm.muscle_group_id) as entity_id,
  mm.muscle_id,
  mm.muscle_group_id,
  mm.anatomy_structure_id,
  a.slug as anatomy_structure_slug,
  a.name_ro as anatomy_structure_name_ro,
  a.english_name as anatomy_structure_name_en,
  coalesce(m.name, mg.name) as scientific_name_ro,
  coalesce(m.english_name, mg.english_name) as entity_name_en,
  coalesce(m.latin_name, mg.latin_name) as latin_name,
  mm.laterality,
  mm.match_kind,
  mm.mapping_confidence,
  mm.review_status,
  mm.notes,
  mm.active,
  mm.created_at,
  mm.updated_at
from public.model_muscle_mappings mm
join public.anatomy_structures a on a.id = mm.anatomy_structure_id
left join public.muscles m on m.id = mm.muscle_id
left join public.muscle_groups mg on mg.id = mm.muscle_group_id;

grant select on table public.model_3d_mappings to anon, authenticated;

create or replace function public.get_model_part_medical_context(
  p_model_part_key text
)
returns table (
  model_part_key text,
  display_name_ro text,
  display_name_en text,
  popular_name_ro text,
  entity_type public.anatomical_entity_type,
  laterality public.anatomical_laterality,
  anatomy_structure_slug text,
  anatomy_structure_name_ro text,
  conditions jsonb
)
language sql
stable
security invoker
as $$
  select
    mm.model_selection_id,
    mm.display_name_ro,
    mm.display_name_en,
    mm.popular_name_ro,
    mm.entity_type,
    mm.laterality,
    a.slug,
    a.name_ro,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'slug', c.slug,
          'name_ro', c.name_ro,
          'popular_name_ro', c.popular_name_ro,
          'name_en', c.name_en,
          'scientific_name', c.scientific_name,
          'default_level', c.default_level,
          'triage_priority', c.triage_priority,
          'description_ro', c.description_ro,
          'description_en', c.description_en,
          'relevance', cs.relevance,
          'relevance_ro', cs.relevance_ro,
          'relevance_en', cs.relevance_en
        )
        order by cs.relevance desc, c.triage_priority desc, c.name_ro
      ) filter (where c.id is not null),
      '[]'::jsonb
    ) as conditions
  from public.model_muscle_mappings mm
  join public.anatomy_structures a
    on a.id = mm.anatomy_structure_id
  left join public.condition_structures cs
    on cs.structure_id = a.id
  left join public.conditions c
    on c.id = cs.condition_id
   and c.active = true
  where mm.model_selection_id = p_model_part_key
    and mm.active = true
  group by
    mm.model_selection_id,
    mm.display_name_ro,
    mm.display_name_en,
    mm.popular_name_ro,
    mm.entity_type,
    mm.laterality,
    a.slug,
    a.name_ro;
$$;

grant execute on function public.get_model_part_medical_context(text)
  to anon, authenticated;

commit;
