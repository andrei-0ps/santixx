begin;

drop view if exists public.model_3d_mappings;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'model_muscle_mappings'
      and column_name = 'model_label'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'model_muscle_mappings'
      and column_name = 'scientific_name_ro'
  ) then
    alter table public.model_muscle_mappings
      rename column model_label to scientific_name_ro;
  end if;
end
$$;

alter table public.model_muscle_mappings
  add column if not exists scientific_name_en text,
  add column if not exists popular_name_en text;

with terminology (
  base_key,
  scientific_ro,
  scientific_en,
  popular_ro,
  popular_en
) as (
  values
    ('muschi-abdominal-part-of-pectoralis-major-muscle', 'Partea abdominală a mușchiului pectoral mare', 'Abdominal part of pectoralis major muscle', 'Partea de jos a mușchiului pieptului', 'Lower part of the chest muscle'),
    ('muschi-acromial-part-of-deltoid-muscle', 'Partea acromială a mușchiului deltoid', 'Acromial part of deltoid muscle', 'Partea laterală a mușchiului umărului', 'Side part of the shoulder muscle'),
    ('muschi-adductor-compartment-of-thigh', 'Compartimentul adductor al coapsei', 'Adductor compartment of thigh', 'Mușchii din interiorul coapsei', 'Inner thigh muscles'),
    ('muschi-adductor-longus', 'Mușchiul adductor lung', 'Adductor longus muscle', 'Mușchi din interiorul coapsei', 'Inner thigh muscle'),
    ('muschi-adductor-magnus', 'Mușchiul adductor mare', 'Adductor magnus muscle', 'Mușchi mare din interiorul coapsei', 'Large inner thigh muscle'),
    ('muschi-anterior-compartment-of-arm', 'Compartimentul anterior al brațului', 'Anterior compartment of arm', 'Mușchii din fața brațului', 'Front upper-arm muscles'),
    ('muschi-anterior-compartment-of-forearm', 'Compartimentul anterior al antebrațului', 'Anterior compartment of forearm', 'Mușchii din fața antebrațului', 'Front forearm muscles'),
    ('muschi-anterior-compartment-of-leg', 'Compartimentul anterior al gambei', 'Anterior compartment of leg', 'Mușchii din fața gambei', 'Front lower-leg muscles'),
    ('muschi-anterior-compartment-of-thigh', 'Compartimentul anterior al coapsei', 'Anterior compartment of thigh', 'Mușchii din fața coapsei', 'Front thigh muscles'),
    ('muschi-ascending-part-of-trapezius-muscle', 'Partea ascendentă a mușchiului trapez', 'Ascending part of trapezius muscle', 'Partea de jos a mușchiului cefei și spatelui', 'Lower part of the neck and upper-back muscle'),
    ('muschi-biceps-brachii-muscle', 'Mușchiul biceps brahial', 'Biceps brachii muscle', 'Bicepsul brațului', 'Biceps muscle'),
    ('muschi-brachioradialis-muscle', 'Mușchiul brahioradial', 'Brachioradialis muscle', 'Mușchiul lateral al antebrațului', 'Outer forearm muscle'),
    ('muschi-clavicular-head-of-pectoralis-major-muscle', 'Capul clavicular al mușchiului pectoral mare', 'Clavicular head of pectoralis major muscle', 'Partea de sus a mușchiului pieptului', 'Upper part of the chest muscle'),
    ('muschi-clavicular-part-of-deltoid-muscle', 'Partea claviculară a mușchiului deltoid', 'Clavicular part of deltoid muscle', 'Partea din față a mușchiului umărului', 'Front part of the shoulder muscle'),
    ('muschi-deep-head-of-pronator-teres', 'Capul profund al mușchiului pronator rotund', 'Deep head of pronator teres muscle', 'Partea profundă a mușchiului care rotește antebrațul', 'Deep part of the forearm-turning muscle'),
    ('muschi-deltoid-muscle', 'Mușchiul deltoid', 'Deltoid muscle', 'Mușchiul umărului', 'Shoulder muscle'),
    ('muschi-descending-part-of-trapezius-muscle', 'Partea descendentă a mușchiului trapez', 'Descending part of trapezius muscle', 'Partea de sus a mușchiului cefei și spatelui', 'Upper part of the neck and upper-back muscle'),
    ('muschi-gastrocnemius-muscle', 'Mușchiul gastrocnemian', 'Gastrocnemius muscle', 'Mușchiul gambei', 'Calf muscle'),
    ('muschi-gluteus-maximus-muscle', 'Mușchiul fesier mare', 'Gluteus maximus muscle', 'Mușchiul fesier / Fund', 'Glute / Buttock muscle'),
    ('muschi-gluteus-medius-muscle', 'Mușchiul fesier mijlociu', 'Gluteus medius muscle', 'Mușchiul lateral al șoldului', 'Side hip muscle'),
    ('muschi-gluteus-minimus-muscle', 'Mușchiul fesier mic', 'Gluteus minimus muscle', 'Mușchiul profund al șoldului', 'Deep hip muscle'),
    ('muschi-infraspinatus-muscle', 'Mușchiul infraspinos', 'Infraspinatus muscle', 'Mușchi din spatele umărului', 'Back shoulder muscle'),
    ('muschi-lateral-head-of-gastrocnemius', 'Capul lateral al mușchiului gastrocnemian', 'Lateral head of gastrocnemius muscle', 'Partea exterioară a mușchiului gambei', 'Outer part of the calf muscle'),
    ('muschi-lateral-head-of-triceps-brachii', 'Capul lateral al mușchiului triceps brahial', 'Lateral head of triceps brachii muscle', 'Partea exterioară a tricepsului', 'Outer part of the triceps'),
    ('muschi-latissimus-dorsi-muscle', 'Mușchiul dorsal mare', 'Latissimus dorsi muscle', 'Mușchiul lateral al spatelui', 'Side back muscle'),
    ('muschi-long-head-of-biceps-brachii', 'Capul lung al mușchiului biceps brahial', 'Long head of biceps brachii muscle', 'Partea lungă a bicepsului', 'Long part of the biceps'),
    ('muschi-long-head-of-biceps-femoris', 'Capul lung al mușchiului biceps femural', 'Long head of biceps femoris muscle', 'Partea lungă a mușchiului din spatele coapsei', 'Long part of the back-thigh muscle'),
    ('muschi-long-head-of-triceps-brachii', 'Capul lung al mușchiului triceps brahial', 'Long head of triceps brachii muscle', 'Partea lungă a tricepsului', 'Long part of the triceps'),
    ('muschi-medial-head-of-gastrocnemius', 'Capul medial al mușchiului gastrocnemian', 'Medial head of gastrocnemius muscle', 'Partea interioară a mușchiului gambei', 'Inner part of the calf muscle'),
    ('muschi-medial-head-of-triceps-brachii', 'Capul medial al mușchiului triceps brahial', 'Medial head of triceps brachii muscle', 'Partea interioară a tricepsului', 'Inner part of the triceps'),
    ('muschi-pectoralis-major-muscle', 'Mușchiul pectoral mare', 'Pectoralis major muscle', 'Mușchiul pieptului', 'Chest muscle'),
    ('muschi-pectoralis-minor-muscle', 'Mușchiul pectoral mic', 'Pectoralis minor muscle', 'Mușchiul pieptului', 'Chest muscle'),
    ('muschi-posterior-compartment-of-thigh', 'Compartimentul posterior al coapsei', 'Posterior compartment of thigh', 'Mușchii din spatele coapsei', 'Back thigh muscles'),
    ('muschi-rectus-abdominis-muscle', 'Mușchiul drept abdominal', 'Rectus abdominis muscle', 'Mușchiul abdomenului / Pătrățele', 'Abs muscle'),
    ('muschi-rectus-femoris-muscle', 'Mușchiul drept femural', 'Rectus femoris muscle', 'Mușchiul din fața coapsei', 'Front thigh muscle'),
    ('muschi-scapular-spinal-part-of-deltoid-muscle', 'Partea spinală a mușchiului deltoid', 'Spinal part of deltoid muscle', 'Partea din spate a mușchiului umărului', 'Back part of the shoulder muscle'),
    ('muschi-semimembranosus-muscle', 'Mușchiul semimembranos', 'Semimembranosus muscle', 'Mușchi din spatele coapsei', 'Back thigh muscle'),
    ('muschi-semitendinosus-muscle', 'Mușchiul semitendinos', 'Semitendinosus muscle', 'Mușchi din spatele coapsei', 'Back thigh muscle'),
    ('muschi-short-head-of-biceps-brachii', 'Capul scurt al mușchiului biceps brahial', 'Short head of biceps brachii muscle', 'Partea scurtă a bicepsului', 'Short part of the biceps'),
    ('muschi-short-head-of-biceps-femoris', 'Capul scurt al mușchiului biceps femural', 'Short head of biceps femoris muscle', 'Partea scurtă a mușchiului din spatele coapsei', 'Short part of the back-thigh muscle'),
    ('muschi-soleus-muscle', 'Mușchiul solear', 'Soleus muscle', 'Mușchiul profund al gambei', 'Deep calf muscle'),
    ('muschi-sternocostal-head-of-pectoralis-major-muscle', 'Capul sternocostal al mușchiului pectoral mare', 'Sternocostal head of pectoralis major muscle', 'Partea centrală a mușchiului pieptului', 'Central part of the chest muscle'),
    ('muschi-subscapularis-muscle', 'Mușchiul subscapular', 'Subscapularis muscle', 'Mușchi profund al umărului', 'Deep shoulder muscle'),
    ('muschi-superficial-head-of-pronator-teres', 'Capul superficial al mușchiului pronator rotund', 'Superficial head of pronator teres muscle', 'Partea superficială a mușchiului care rotește antebrațul', 'Surface part of the forearm-turning muscle'),
    ('muschi-supraspinatus-muscle', 'Mușchiul supraspinos', 'Supraspinatus muscle', 'Mușchi deasupra omoplatului', 'Upper shoulder-blade muscle'),
    ('muschi-teres-major-muscle', 'Mușchiul rotund mare', 'Teres major muscle', 'Mușchi din spatele umărului', 'Back shoulder muscle'),
    ('muschi-teres-minor-muscle', 'Mușchiul rotund mic', 'Teres minor muscle', 'Mușchi mic din spatele umărului', 'Small back shoulder muscle'),
    ('muschi-tibialis-anterior-muscle', 'Mușchiul tibial anterior', 'Tibialis anterior muscle', 'Mușchiul din fața gambei', 'Front shin muscle'),
    ('muschi-transverse-part-of-trapezius-muscle', 'Partea transversă a mușchiului trapez', 'Transverse part of trapezius muscle', 'Partea din mijloc a mușchiului cefei și spatelui', 'Middle part of the neck and upper-back muscle'),
    ('muschi-trapezius-muscle', 'Mușchiul trapez', 'Trapezius muscle', 'Mușchiul cefei și spatelui de sus', 'Neck and upper-back muscle'),
    ('muschi-triceps-brachii-muscle', 'Mușchiul triceps brahial', 'Triceps brachii muscle', 'Tricepsul brațului', 'Triceps muscle'),
    ('muschi-vastus-intermedius-muscle', 'Mușchiul vast intermediar', 'Vastus intermedius muscle', 'Mușchi profund din fața coapsei', 'Deep front thigh muscle'),
    ('muschi-vastus-lateralis-muscle', 'Mușchiul vast lateral', 'Vastus lateralis muscle', 'Mușchiul exterior din fața coapsei', 'Outer front thigh muscle'),
    ('muschi-vastus-medialis-muscle', 'Mușchiul vast medial', 'Vastus medialis muscle', 'Mușchiul interior din fața coapsei', 'Inner front thigh muscle')
),
resolved as (
  select
    mm.id,
    terminology.scientific_ro ||
      case mm.laterality
        when 'left'::public.anatomical_laterality then ' (stânga)'
        when 'right'::public.anatomical_laterality then ' (dreapta)'
        else ''
      end as scientific_name_ro,
    terminology.scientific_en ||
      case mm.laterality
        when 'left'::public.anatomical_laterality then ' (left)'
        when 'right'::public.anatomical_laterality then ' (right)'
        else ''
      end as scientific_name_en,
    terminology.popular_ro ||
      case mm.laterality
        when 'left'::public.anatomical_laterality then ' (stânga)'
        when 'right'::public.anatomical_laterality then ' (dreapta)'
        else ''
      end as popular_name_ro,
    terminology.popular_en ||
      case mm.laterality
        when 'left'::public.anatomical_laterality then ' (left)'
        when 'right'::public.anatomical_laterality then ' (right)'
        else ''
      end as popular_name_en
  from public.model_muscle_mappings mm
  join terminology
    on terminology.base_key = regexp_replace(mm.model_selection_id, '-(left|right)$', '')
)
update public.model_muscle_mappings mm
set
  scientific_name_ro = resolved.scientific_name_ro,
  scientific_name_en = resolved.scientific_name_en,
  popular_name_ro = resolved.popular_name_ro,
  popular_name_en = resolved.popular_name_en,
  display_name_ro = resolved.popular_name_ro,
  display_name_en = resolved.popular_name_en,
  updated_at = now()
from resolved
where resolved.id = mm.id;

do $$
declare
  unmapped_count integer;
begin
  select count(*)
  into unmapped_count
  from public.model_muscle_mappings
  where nullif(trim(scientific_name_ro), '') is null
     or nullif(trim(scientific_name_en), '') is null
     or nullif(trim(popular_name_ro), '') is null
     or nullif(trim(popular_name_en), '') is null;

  if unmapped_count > 0 then
    raise exception 'Există % mapări musculare fără nomenclatură completă.', unmapped_count;
  end if;
end
$$;

alter table public.model_muscle_mappings
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null,
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null;

alter table public.model_muscle_mappings
  drop constraint if exists model_muscle_mappings_scientific_name_ro_not_blank,
  drop constraint if exists model_muscle_mappings_scientific_name_en_not_blank,
  drop constraint if exists model_muscle_mappings_popular_name_ro_not_blank,
  drop constraint if exists model_muscle_mappings_popular_name_en_not_blank;

alter table public.model_muscle_mappings
  add constraint model_muscle_mappings_scientific_name_ro_not_blank
    check (char_length(trim(scientific_name_ro)) > 0),
  add constraint model_muscle_mappings_scientific_name_en_not_blank
    check (char_length(trim(scientific_name_en)) > 0),
  add constraint model_muscle_mappings_popular_name_ro_not_blank
    check (char_length(trim(popular_name_ro)) > 0),
  add constraint model_muscle_mappings_popular_name_en_not_blank
    check (char_length(trim(popular_name_en)) > 0);

create index if not exists idx_model_muscle_mappings_popular_name_en
  on public.model_muscle_mappings (popular_name_en);

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
  mm.popular_name_en,
  mm.scientific_name_ro,
  mm.scientific_name_en,
  mm.entity_type,
  coalesce(mm.muscle_id, mm.muscle_group_id) as entity_id,
  mm.muscle_id,
  mm.muscle_group_id,
  mm.anatomy_structure_id,
  a.slug as anatomy_structure_slug,
  a.name_ro as anatomy_structure_name_ro,
  a.english_name as anatomy_structure_name_en,
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

drop function if exists public.get_model_part_medical_context(text);

create function public.get_model_part_medical_context(
  p_model_part_key text
)
returns table (
  model_part_key text,
  popular_name_ro text,
  popular_name_en text,
  scientific_name_ro text,
  scientific_name_en text,
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
    mm.popular_name_ro,
    mm.popular_name_en,
    mm.scientific_name_ro,
    mm.scientific_name_en,
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
    )
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
    mm.popular_name_ro,
    mm.popular_name_en,
    mm.scientific_name_ro,
    mm.scientific_name_en,
    mm.entity_type,
    mm.laterality,
    a.slug,
    a.name_ro;
$$;

grant execute on function public.get_model_part_medical_context(text)
  to anon, authenticated;

commit;
