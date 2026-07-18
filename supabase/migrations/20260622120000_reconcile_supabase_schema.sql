begin;

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

alter table public.ai_knowledge_entries
  add column if not exists embedding extensions.vector(1536),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz,
  add column if not exists tags text[] not null default '{}',
  add column if not exists metadata jsonb not null default '{}';

update public.ai_knowledge_entries
set
  tags = coalesce(tags, '{}'),
  metadata = coalesce(metadata, '{}');

alter table public.ai_knowledge_entries
  alter column tags set default '{}',
  alter column tags set not null,
  alter column metadata set default '{}',
  alter column metadata set not null;

create index if not exists ai_knowledge_embedding_cosine_idx
  on public.ai_knowledge_entries
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100)
  where active = true and embedding is not null;

create index if not exists ai_knowledge_tags_idx
  on public.ai_knowledge_entries using gin (tags);

create index if not exists ai_knowledge_metadata_idx
  on public.ai_knowledge_entries using gin (metadata);

create table if not exists public.ai_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, window_start),
  constraint ai_rate_limits_action_len check (char_length(action) between 1 and 80),
  constraint ai_rate_limits_count_nonnegative check (request_count >= 0)
);

create index if not exists ai_rate_limits_user_action_idx
  on public.ai_rate_limits (user_id, action, window_start desc);

alter table public.ai_rate_limits enable row level security;

drop policy if exists "Users can read own AI rate limits" on public.ai_rate_limits;
drop policy if exists "Users can create own AI rate limits" on public.ai_rate_limits;
drop policy if exists "Users can update own AI rate limits" on public.ai_rate_limits;
drop policy if exists "owner_select" on public.ai_rate_limits;
drop policy if exists "owner_insert" on public.ai_rate_limits;
drop policy if exists "owner_update" on public.ai_rate_limits;

create policy "owner_select"
  on public.ai_rate_limits for select
  using (auth.uid() = user_id);

create policy "owner_insert"
  on public.ai_rate_limits for insert
  with check (auth.uid() = user_id);

create policy "owner_update"
  on public.ai_rate_limits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.ai_rate_limits from anon;
grant select, insert, update on table public.ai_rate_limits to authenticated;
grant all on table public.ai_rate_limits to service_role;

create table if not exists public.organ_systems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  name_en text,
  description_ro text not null default '',
  description_en text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organ_systems
  add column if not exists name_en text,
  add column if not exists description_en text not null default '';

insert into public.organ_systems (
  slug,
  name_ro,
  name_en,
  description_ro,
  description_en
) values
  (
    'cardiovascular',
    'Aparat cardiovascular',
    'Cardiovascular system',
    'Inima și vasele mari implicate în circulație.',
    'The heart and major blood vessels involved in circulation.'
  ),
  (
    'respirator',
    'Aparat respirator',
    'Respiratory system',
    'Organe implicate în respirație și schimbul de gaze.',
    'Organs involved in breathing and gas exchange.'
  ),
  (
    'digestiv',
    'Aparat digestiv',
    'Digestive system',
    'Organe implicate în digestie și absorbția nutrienților.',
    'Organs involved in digestion and nutrient absorption.'
  ),
  (
    'urinar',
    'Aparat urinar',
    'Urinary system',
    'Organe implicate în formarea, transportul și stocarea urinei.',
    'Organs involved in producing, transporting, and storing urine.'
  ),
  (
    'limfatic',
    'Aparat limfatic',
    'Lymphatic system',
    'Organe implicate în filtrarea sângelui și răspunsul imun.',
    'Organs involved in blood filtration and immune response.'
  )
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  name_en = excluded.name_en,
  description_ro = excluded.description_ro,
  description_en = excluded.description_en,
  updated_at = now();

update public.organ_systems
set name_en = name_ro
where nullif(btrim(name_en), '') is null;

alter table public.organ_systems
  alter column name_en set not null;

create table if not exists public.organs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  glb_node_name text,
  mesh_name text,
  model_key text,
  model_selection_id text unique,
  display_name_ro text not null,
  common_name_ro text,
  popular_name_ro text,
  popular_name_en text,
  scientific_name_ro text,
  scientific_name_en text,
  english_name text,
  latin_name text,
  organ_system text references public.organ_systems(slug) on update cascade on delete set null,
  body_region text,
  description_ro text not null default '',
  description_en text not null default '',
  function_ro text not null default '',
  function_en text not null default '',
  aliases_ro text[] not null default '{}',
  aliases_en text[] not null default '{}',
  risk_category text not null default 'standard',
  is_selectable boolean not null default true,
  ai_enabled boolean not null default true,
  position_status text not null default 'valid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organs
  add column if not exists model_selection_id text,
  add column if not exists popular_name_ro text,
  add column if not exists popular_name_en text,
  add column if not exists scientific_name_en text,
  add column if not exists description_en text not null default '',
  add column if not exists function_ro text not null default '',
  add column if not exists function_en text not null default '',
  add column if not exists aliases_en text[] not null default '{}';

create unique index if not exists organs_model_selection_id_uidx
  on public.organs (model_selection_id)
  where model_selection_id is not null;

create index if not exists organs_model_key_idx on public.organs (model_key);
create index if not exists organs_mesh_name_idx on public.organs (mesh_name);
create index if not exists organs_aliases_ro_idx on public.organs using gin (aliases_ro);
create index if not exists organs_aliases_en_idx on public.organs using gin (aliases_en);
create index if not exists organs_selectable_ai_idx on public.organs (is_selectable, ai_enabled);

with organ_seed (
  slug,
  fallback_ro,
  fallback_en,
  fallback_latin,
  glb_node_name,
  mesh_name,
  model_key,
  organ_system,
  body_region,
  description_en,
  function_en,
  aliases_ro,
  aliases_en,
  risk_category,
  is_selectable,
  ai_enabled,
  position_status
) as (
  values
    (
      'organ-inima',
      'Inimă',
      'Heart',
      'Cor',
      'VH_M_heart_right_ventricle,VH_M_heart_left_ventricle',
      'VH_M_heart_right_ventricle',
      '/anatomy/hra/VH_M_Heart.glb',
      'cardiovascular',
      'torace',
      'A muscular organ in the chest that pumps blood through the lungs and the rest of the body.',
      'Pumps blood to the lungs and throughout the body.',
      array['inimă','inima','cord','piept'],
      array['heart','chest'],
      'urgent_if_chest_pain',
      true,
      true,
      'valid'
    ),
    (
      'organ-plamani',
      'Plămâni',
      'Lungs',
      'Pulmones',
      'VH_M_left_lingula_superior_bronchopulmonary_segment,VH_M_right_apical_bronchopulmonary_segment,VH_M_trachea',
      'VH_M_left_lingula_superior_bronchopulmonary_segment',
      '/anatomy/hra/VH_M_Lung.glb',
      'respirator',
      'torace',
      'Paired organs in the chest responsible for gas exchange between air and blood.',
      'Bring oxygen into the blood and remove carbon dioxide.',
      array['plămâni','plamani','respirație','respiratie'],
      array['lungs','breathing','respiration'],
      'urgent_if_breathing_difficulty',
      true,
      true,
      'valid'
    ),
    (
      'organ-ficat',
      'Ficat',
      'Liver',
      'Hepar',
      'VH_M_liver_capsule,VH_M_caudate_lobe_of_liver,VH_M_quadrate_lobe_of_liver',
      'VH_M_liver_capsule',
      '/anatomy/hra/VH_M_Liver.glb',
      'digestiv',
      'abdomen',
      'A large organ in the upper right abdomen involved in metabolism and bile production.',
      'Processes nutrients, produces bile, and helps remove harmful substances.',
      array['ficat','hepatic','bilă','bila'],
      array['liver','hepatic','bile'],
      'standard',
      true,
      true,
      'valid'
    ),
    (
      'organ-rinichi',
      'Rinichi',
      'Kidneys',
      'Renes',
      'VH_M_kidney_capsule_R,VH_M_kidney_capsule_L',
      'VH_M_kidney_capsule_R,VH_M_kidney_capsule_L',
      '/anatomy/hra/VH_M_Kidney_R.glb;/anatomy/hra/VH_M_Kidney_L.glb',
      'urinar',
      'abdomen',
      'Paired organs located toward the back of the abdomen that filter the blood.',
      'Filter the blood, produce urine, and regulate water and salt balance.',
      array['rinichi','rinichii','renal','urină','urina'],
      array['kidney','kidneys','renal','urine'],
      'standard',
      true,
      true,
      'valid'
    ),
    (
      'organ-intestine',
      'Intestine',
      'Intestines',
      'Intestina',
      'VH_M_ileum,VH_M_jejunum,VH_M_duodenum_ascending,VH_M_ascending_colon,VH_M_transverse_colon,VH_M_sigmoid_colon',
      'VH_M_ileum,VH_M_ascending_colon',
      '/anatomy/hra/VH_M_Small_Intestine.glb;/anatomy/hra/SBU_M_Intestine_Large.glb',
      'digestiv',
      'abdomen',
      'Digestive organs that absorb nutrients and help eliminate waste.',
      'Complete digestion, absorb nutrients, and form stool.',
      array['intestine','intestin','intestin subțire','intestin subtire','intestin gros','colon','scaun'],
      array['intestines','small intestine','large intestine','colon','stool'],
      'urgent_if_severe_abdominal_pain',
      true,
      true,
      'valid'
    ),
    (
      'organ-pancreas',
      'Pancreas',
      'Pancreas',
      'Pancreas',
      'VH_M_body_of_pancreas,VH_M_tail_of_pancreas,VH_M_head_of_pancreas',
      'VH_M_body_of_pancreas',
      '/anatomy/hra/VH_M_Pancreas.glb',
      'digestiv',
      'abdomen',
      'An organ behind the stomach with digestive and endocrine functions.',
      'Produces digestive enzymes and hormones that regulate blood glucose.',
      array['pancreas','pancreatic','insulină','insulina','glicemie'],
      array['pancreas','pancreatic','insulin','blood sugar'],
      'standard',
      true,
      true,
      'valid'
    ),
    (
      'organ-vezica-urinara',
      'Vezică urinară',
      'Urinary bladder',
      'Vesica urinaria',
      'VH_M_fundus_of_urinary_bladder_dome,VH_M_trigone_of_urinary_bladder',
      'VH_M_fundus_of_urinary_bladder_dome',
      '/anatomy/hra/VH_M_Urinary_Bladder.glb',
      'urinar',
      'pelvis',
      'A hollow organ in the pelvis that stores urine.',
      'Stores urine before it leaves the body.',
      array['vezică','vezica','vezică urinară','vezica urinara','urină','urina'],
      array['urinary bladder','bladder','urine'],
      'standard',
      true,
      true,
      'valid'
    ),
    (
      'organ-stomac',
      'Stomac',
      'Stomach',
      'Ventriculus',
      null,
      null,
      null,
      'digestiv',
      'abdomen',
      'A hollow digestive organ in the upper abdomen.',
      'Stores and mixes food with gastric juices and begins protein digestion.',
      array['stomac','stomacul','gastric','greață','greata','vărsături','varsaturi'],
      array['stomach','gastric','nausea','vomiting'],
      'standard',
      false,
      false,
      'missing_glb'
    ),
    (
      'organ-splina',
      'Splină',
      'Spleen',
      'Lien',
      null,
      null,
      null,
      'limfatic',
      'abdomen',
      'A lymphatic organ in the upper left abdomen.',
      'Filters the blood and contributes to immune function.',
      array['splină','splina'],
      array['spleen'],
      'standard',
      false,
      false,
      'missing_glb'
    ),
    (
      'organ-esofag',
      'Esofag',
      'Esophagus',
      'Oesophagus',
      null,
      null,
      null,
      'digestiv',
      'gat_torace',
      'A muscular tube that carries food from the throat to the stomach.',
      'Moves swallowed food toward the stomach.',
      array['esofag'],
      array['esophagus','oesophagus'],
      'standard',
      false,
      false,
      'missing_glb'
    ),
    (
      'organ-trahee',
      'Trahee',
      'Trachea',
      'Trachea',
      'VH_M_trachea,VH_M_tracheal_cartilage',
      'VH_M_trachea',
      '/anatomy/hra/VH_M_Lung.glb',
      'respirator',
      'gat_torace',
      'The airway that connects the larynx to the main bronchi.',
      'Carries air toward the lungs.',
      array['trahee','respirație','respiratie'],
      array['trachea','windpipe','breathing'],
      'standard',
      false,
      false,
      'embedded_in_lung_model'
    )
)
insert into public.organs (
  slug,
  glb_node_name,
  mesh_name,
  model_key,
  model_selection_id,
  display_name_ro,
  common_name_ro,
  popular_name_ro,
  popular_name_en,
  scientific_name_ro,
  scientific_name_en,
  english_name,
  latin_name,
  organ_system,
  body_region,
  description_ro,
  description_en,
  function_ro,
  function_en,
  aliases_ro,
  aliases_en,
  risk_category,
  is_selectable,
  ai_enabled,
  position_status
)
select
  s.slug,
  s.glb_node_name,
  s.mesh_name,
  s.model_key,
  coalesce(a.model_selection_id, replace(s.slug, 'organ-', 'organ:')),
  coalesce(a.popular_name_ro, a.display_name_ro, a.name_ro, s.fallback_ro),
  coalesce(a.common_name_ro, a.popular_name_ro, a.name_ro, s.fallback_ro),
  coalesce(a.popular_name_ro, a.display_name_ro, a.name_ro, s.fallback_ro),
  coalesce(a.popular_name_en, a.display_name_en, a.english_name, s.fallback_en),
  coalesce(a.scientific_name_ro, a.name_ro, s.fallback_ro),
  coalesce(a.scientific_name_en, a.english_name, s.fallback_en),
  coalesce(a.popular_name_en, a.english_name, s.fallback_en),
  coalesce(a.latin_name, a.name_latin, s.fallback_latin),
  s.organ_system,
  coalesce(a.body_region, s.body_region),
  coalesce(nullif(a.description_ro, ''), s.fallback_ro),
  s.description_en,
  coalesce(nullif(a.function_ro, ''), s.fallback_ro),
  s.function_en,
  s.aliases_ro,
  s.aliases_en,
  s.risk_category,
  s.is_selectable,
  s.ai_enabled,
  s.position_status
from organ_seed s
left join public.anatomy_structures a on a.slug = s.slug
on conflict (slug) do update set
  glb_node_name = excluded.glb_node_name,
  mesh_name = excluded.mesh_name,
  model_key = excluded.model_key,
  model_selection_id = excluded.model_selection_id,
  display_name_ro = excluded.display_name_ro,
  common_name_ro = excluded.common_name_ro,
  popular_name_ro = excluded.popular_name_ro,
  popular_name_en = excluded.popular_name_en,
  scientific_name_ro = excluded.scientific_name_ro,
  scientific_name_en = excluded.scientific_name_en,
  english_name = excluded.english_name,
  latin_name = excluded.latin_name,
  organ_system = excluded.organ_system,
  body_region = excluded.body_region,
  description_ro = excluded.description_ro,
  description_en = excluded.description_en,
  function_ro = excluded.function_ro,
  function_en = excluded.function_en,
  aliases_ro = excluded.aliases_ro,
  aliases_en = excluded.aliases_en,
  risk_category = excluded.risk_category,
  is_selectable = excluded.is_selectable,
  ai_enabled = excluded.ai_enabled,
  position_status = excluded.position_status,
  updated_at = now();

alter table public.organs
  alter column popular_name_ro set not null,
  alter column popular_name_en set not null,
  alter column scientific_name_ro set not null,
  alter column scientific_name_en set not null;

create table if not exists public.internal_organs (
  slug text primary key,
  name_ro text not null,
  latin_name text,
  category_ro text not null,
  body_region text not null,
  difficulty text not null default 'incepator',
  description_ro text not null default '',
  function_ro text not null default '',
  origin_ro text not null default '',
  insertion_ro text not null default '',
  innervation_ro text not null default '',
  action_ro text not null default '',
  quiz jsonb not null default '[]'::jsonb,
  model_selection_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.internal_organs (
  slug,
  name_ro,
  latin_name,
  category_ro,
  body_region,
  difficulty,
  description_ro,
  function_ro,
  origin_ro,
  insertion_ro,
  innervation_ro,
  action_ro,
  quiz,
  model_selection_id
)
select
  o.slug,
  o.popular_name_ro,
  o.latin_name,
  coalesce(os.name_ro, 'Organ intern'),
  coalesce(o.body_region, 'necunoscut'),
  'incepator',
  o.description_ro,
  o.function_ro,
  '',
  '',
  '',
  o.function_ro,
  '[]'::jsonb,
  o.model_selection_id
from public.organs o
left join public.organ_systems os on os.slug = o.organ_system
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  latin_name = excluded.latin_name,
  category_ro = excluded.category_ro,
  body_region = excluded.body_region,
  difficulty = excluded.difficulty,
  description_ro = excluded.description_ro,
  function_ro = excluded.function_ro,
  origin_ro = excluded.origin_ro,
  insertion_ro = excluded.insertion_ro,
  innervation_ro = excluded.innervation_ro,
  action_ro = excluded.action_ro,
  quiz = excluded.quiz,
  model_selection_id = excluded.model_selection_id,
  updated_at = now();

alter table public.organ_systems enable row level security;
alter table public.organs enable row level security;
alter table public.internal_organs enable row level security;

drop policy if exists "Oricine poate citi sistemele de organe" on public.organ_systems;
drop policy if exists "public_read" on public.organ_systems;
create policy "public_read"
  on public.organ_systems for select
  using (true);

drop policy if exists "Oricine poate citi organele" on public.organs;
drop policy if exists "public_read" on public.organs;
create policy "public_read"
  on public.organs for select
  using (true);

drop policy if exists "Oricine poate citi organele interne" on public.internal_organs;
drop policy if exists "public_read" on public.internal_organs;
create policy "public_read"
  on public.internal_organs for select
  using (true);

revoke all on table public.organ_systems, public.organs, public.internal_organs from anon, authenticated;
grant select on table public.organ_systems, public.organs, public.internal_organs to anon, authenticated;
grant all on table public.organ_systems, public.organs, public.internal_organs to service_role;

drop trigger if exists organ_systems_set_updated_at on public.organ_systems;
create trigger organ_systems_set_updated_at
before update on public.organ_systems
for each row execute function public.set_updated_at();

drop trigger if exists organs_set_updated_at on public.organs;
create trigger organs_set_updated_at
before update on public.organs
for each row execute function public.set_updated_at();

drop function if exists public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
);

create function public.match_ai_knowledge_entries(
  p_query_embedding extensions.vector(1536),
  p_ai_layer text default null,
  p_body_region text default null,
  p_structure_slug text default null,
  p_categories public.knowledge_category[] default null,
  p_tags text[] default null,
  p_match_threshold double precision default 0.72,
  p_match_count integer default 8
)
returns table (
  id uuid,
  tissue public.tissue_type,
  structure_slug text,
  model_selection_id text,
  body_region text,
  category public.knowledge_category,
  title_ro text,
  content_ro text,
  title_en text,
  content_en text,
  display_name_ro text,
  display_name_en text,
  priority smallint,
  tags text[],
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    k.id,
    k.tissue,
    k.structure_slug,
    k.model_selection_id,
    k.body_region,
    k.category,
    k.title_ro,
    k.content_ro,
    k.title_en,
    k.content_en,
    k.display_name_ro,
    k.display_name_en,
    k.priority,
    k.tags,
    k.metadata,
    1 - (k.embedding <=> p_query_embedding) as similarity
  from public.ai_knowledge_entries k
  where k.active = true
    and k.embedding is not null
    and (
      p_ai_layer is null
      or (p_ai_layer = 'skeleton' and k.tissue = 'os')
      or (p_ai_layer = 'muscular' and k.tissue = 'muschi')
      or (p_ai_layer = 'organs' and k.tissue = 'organ')
    )
    and (
      p_body_region is null
      or k.body_region = p_body_region
      or k.structure_slug = p_structure_slug
    )
    and (
      p_categories is null
      or cardinality(p_categories) = 0
      or k.category = any(p_categories)
    )
    and (
      p_tags is null
      or cardinality(p_tags) = 0
      or k.tags && p_tags
    )
    and 1 - (k.embedding <=> p_query_embedding) >= p_match_threshold
  order by
    case when p_structure_slug is not null and k.structure_slug = p_structure_slug then 0 else 1 end,
    case when p_body_region is not null and k.body_region = p_body_region then 0 else 1 end,
    similarity desc,
    k.priority desc
  limit greatest(1, least(coalesce(p_match_count, 8), 30));
$$;

revoke all on function public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
) from public;

grant execute on function public.match_ai_knowledge_entries(
  extensions.vector,
  text,
  text,
  text,
  public.knowledge_category[],
  text[],
  double precision,
  integer
) to authenticated, service_role;

create or replace function public.list_missing_romanian_display_names()
returns table (
  id uuid,
  slug text,
  tissue public.tissue_type,
  model_selection_id text,
  name_ro text,
  english_name text,
  display_name_ro text,
  common_name_ro text,
  missing_ro_display_name boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.id,
    a.slug,
    a.tissue,
    a.model_selection_id,
    a.name_ro,
    a.english_name,
    a.display_name_ro,
    a.common_name_ro,
    a.missing_ro_display_name
  from public.anatomy_structures a
  where a.missing_ro_display_name = true
    or nullif(btrim(coalesce(a.popular_name_ro, a.display_name_ro, a.common_name_ro, a.name_ro)), '') is null
    or nullif(btrim(a.popular_name_en), '') is null
  order by a.tissue, a.body_region, a.slug;
$$;

revoke all on function public.list_missing_romanian_display_names() from public;
grant execute on function public.list_missing_romanian_display_names() to anon, authenticated, service_role;

create or replace function public.check_ai_rate_limit(
  p_action text,
  p_limit integer default 12,
  p_window_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_action text := left(coalesce(nullif(btrim(p_action), ''), 'ai'), 80);
  v_window_seconds integer := greatest(10, least(coalesce(p_window_seconds, 60), 86400));
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 1000));
  v_window_start timestamptz;
  v_count integer;
  v_retry_after integer;
begin
  if v_user_id is null then
    raise exception 'auth.uid() is required for AI rate limiting';
  end if;

  v_window_start :=
    to_timestamp(floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds);

  insert into public.ai_rate_limits (user_id, action, window_start, request_count, updated_at)
  values (v_user_id, v_action, v_window_start, 1, now())
  on conflict (user_id, action, window_start)
  do update set
    request_count = public.ai_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  v_retry_after := greatest(
    1,
    ceil(extract(epoch from (v_window_start + make_interval(secs => v_window_seconds) - now())))::integer
  );

  return jsonb_build_object(
    'allowed', v_count <= v_limit,
    'remaining', greatest(v_limit - v_count, 0),
    'retry_after_seconds', case when v_count <= v_limit then 0 else v_retry_after end
  );
end;
$$;

revoke all on function public.check_ai_rate_limit(text, integer, integer) from public;
grant execute on function public.check_ai_rate_limit(text, integer, integer) to authenticated, service_role;

create or replace function public.auth_email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(btrim(p_email))
  );
$$;

revoke all on function public.auth_email_exists(text) from public;
grant execute on function public.auth_email_exists(text) to anon, authenticated, service_role;

create or replace function public.delete_current_new_google_user()
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_created_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'auth.uid() is required';
  end if;

  select created_at
  into v_created_at
  from auth.users
  where id = v_user_id;

  if v_created_at is null then
    return false;
  end if;

  if v_created_at < now() - interval '10 minutes' then
    raise exception 'Only a newly created account can be removed by this flow';
  end if;

  if not exists (
    select 1
    from auth.identities
    where user_id = v_user_id
      and provider = 'google'
  ) then
    raise exception 'Only a newly created Google account can be removed by this flow';
  end if;

  delete from auth.users
  where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.delete_current_new_google_user() from public;
grant execute on function public.delete_current_new_google_user() to authenticated, service_role;

comment on table public.ai_rate_limits is
  'Contoare persistente pentru limitarea cererilor AI ale utilizatorilor autentificați.';

comment on table public.organ_systems is
  'Catalog bilingv al sistemelor de organe folosit de interfață și de contextul AI.';

comment on table public.organs is
  'Catalog canonic bilingv al organelor, cu mapări către modelul 3D.';

comment on table public.internal_organs is
  'Catalog de compatibilitate pentru conținutul educațional despre organe interne.';

do $$
declare
  v_missing text[];
begin
  select array_agg(required_relation)
  into v_missing
  from unnest(array[
    'public.ai_rate_limits',
    'public.internal_organs',
    'public.organ_systems',
    'public.organs'
  ]) as required_relation
  where to_regclass(required_relation) is null;

  if v_missing is not null then
    raise exception 'Schema reconciliation failed; missing relations: %', array_to_string(v_missing, ', ');
  end if;

  if exists (
    select 1
    from unnest(array[
      'embedding',
      'embedding_model',
      'embedding_updated_at',
      'tags',
      'metadata'
    ]) as required_column
    where not exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'ai_knowledge_entries'
        and c.column_name = required_column
    )
  ) then
    raise exception 'Schema reconciliation failed; ai_knowledge_entries is incomplete';
  end if;

  if to_regprocedure('public.check_ai_rate_limit(text,integer,integer)') is null
    or to_regprocedure('public.auth_email_exists(text)') is null
    or to_regprocedure('public.delete_current_new_google_user()') is null
    or to_regprocedure('public.list_missing_romanian_display_names()') is null
  then
    raise exception 'Schema reconciliation failed; one or more required RPC functions are missing';
  end if;

  if (select count(*) from public.organs) < 11 then
    raise exception 'Schema reconciliation failed; organ catalog contains fewer than 11 rows';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
