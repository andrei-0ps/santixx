create table if not exists public.organ_systems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ro text not null,
  description_ro text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  glb_node_name text,
  mesh_name text,
  model_key text,
  display_name_ro text not null,
  common_name_ro text,
  scientific_name_ro text,
  english_name text,
  latin_name text,
  organ_system text references public.organ_systems(slug) on update cascade on delete set null,
  body_region text,
  description_ro text not null default '',
  aliases_ro text[] not null default '{}',
  risk_category text not null default 'standard',
  is_selectable boolean not null default true,
  ai_enabled boolean not null default true,
  position_status text not null default 'valid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organ_systems enable row level security;
alter table public.organs enable row level security;

drop policy if exists "Oricine poate citi sistemele de organe" on public.organ_systems;
create policy "Oricine poate citi sistemele de organe"
  on public.organ_systems for select
  using (true);

drop policy if exists "Oricine poate citi organele" on public.organs;
create policy "Oricine poate citi organele"
  on public.organs for select
  using (true);

create index if not exists organs_model_key_idx on public.organs (model_key);
create index if not exists organs_mesh_name_idx on public.organs (mesh_name);
create index if not exists organs_aliases_ro_idx on public.organs using gin (aliases_ro);
create index if not exists organs_selectable_ai_idx on public.organs (is_selectable, ai_enabled);

insert into public.organ_systems (slug, name_ro, description_ro) values
  ('cardiovascular', 'Aparat cardiovascular', 'Inima și vasele mari implicate în circulație.'),
  ('respirator', 'Aparat respirator', 'Organe implicate în respirație și schimbul de gaze.'),
  ('digestiv', 'Aparat digestiv', 'Organe implicate în digestie și absorbția nutrienților.'),
  ('urinar', 'Aparat urinar', 'Organe implicate în formarea, transportul și stocarea urinei.'),
  ('limfatic', 'Aparat limfatic', 'Organe implicate în filtrarea sângelui și răspunsul imun.')
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  description_ro = excluded.description_ro,
  updated_at = now();

insert into public.organs (
  slug,
  glb_node_name,
  mesh_name,
  model_key,
  display_name_ro,
  common_name_ro,
  scientific_name_ro,
  english_name,
  latin_name,
  organ_system,
  body_region,
  description_ro,
  aliases_ro,
  risk_category,
  is_selectable,
  ai_enabled,
  position_status
) values
  (
    'organ-inima',
    'VH_M_heart_right_ventricle,VH_M_heart_left_ventricle',
    'VH_M_heart_right_ventricle',
    '/anatomy/hra/VH_M_Heart.glb',
    'Inimă',
    'Inimă',
    'Inimă',
    'Heart',
    'Cor',
    'cardiovascular',
    'torace',
    'Organ muscular situat în torace, între plămâni, ușor spre stânga liniei mediane.',
    array['inimă','inima','cord','heart','cor','piept'],
    'urgent_if_chest_pain',
    true,
    true,
    'valid'
  ),
  (
    'organ-plamani',
    'VH_M_left_lingula_superior_bronchopulmonary_segment,VH_M_right_apical_bronchopulmonary_segment,VH_M_trachea',
    'VH_M_left_lingula_superior_bronchopulmonary_segment',
    '/anatomy/hra/VH_M_Lung.glb',
    'Plămâni',
    'Plămâni',
    'Plămâni',
    'Lungs',
    'Pulmones',
    'respirator',
    'torace',
    'Organe pereche din torace, responsabile de schimbul de gaze dintre aer și sânge.',
    array['plămâni','plamani','lungs','pulmones','respirație','respiratie'],
    'urgent_if_breathing_difficulty',
    true,
    true,
    'valid'
  ),
  (
    'organ-ficat',
    'VH_M_liver_capsule,VH_M_caudate_lobe_of_liver,VH_M_quadrate_lobe_of_liver',
    'VH_M_liver_capsule',
    '/anatomy/hra/VH_M_Liver.glb',
    'Ficat',
    'Ficat',
    'Ficat',
    'Liver',
    'Hepar',
    'digestiv',
    'abdomen',
    'Organ voluminos din abdomenul superior drept, implicat în metabolism și producerea bilei.',
    array['ficat','liver','hepar','hepatic','bilă','bila'],
    'standard',
    true,
    true,
    'valid'
  ),
  (
    'organ-rinichi',
    'VH_M_kidney_capsule_R,VH_M_kidney_capsule_L',
    'VH_M_kidney_capsule_R,VH_M_kidney_capsule_L',
    '/anatomy/hra/VH_M_Kidney_R.glb;/anatomy/hra/VH_M_Kidney_L.glb',
    'Rinichi',
    'Rinichi',
    'Rinichi',
    'Kidneys',
    'Renes',
    'urinar',
    'abdomen',
    'Organe pereche situate posterior în abdomen, aproape de coloana lombară.',
    array['rinichi','rinichii','kidney','kidneys','renal','renes','urină','urina'],
    'standard',
    true,
    true,
    'valid'
  ),
  (
    'organ-intestine',
    'VH_M_ileum,VH_M_jejunum,VH_M_duodenum_ascending,VH_M_ascending_colon,VH_M_transverse_colon,VH_M_sigmoid_colon',
    'VH_M_ileum,VH_M_ascending_colon',
    '/anatomy/hra/VH_M_Small_Intestine.glb;/anatomy/hra/SBU_M_Intestine_Large.glb',
    'Intestine',
    'Intestine',
    'Intestin subțire și intestin gros',
    'Intestines',
    'Intestina',
    'digestiv',
    'abdomen',
    'Segmente digestive care ocupă cavitatea abdominală și participă la absorbție și eliminare.',
    array['intestine','intestin','intestin subțire','intestin subtire','intestin gros','colon','scaun'],
    'urgent_if_severe_abdominal_pain',
    true,
    true,
    'valid'
  ),
  (
    'organ-pancreas',
    'VH_M_body_of_pancreas,VH_M_tail_of_pancreas,VH_M_head_of_pancreas',
    'VH_M_body_of_pancreas',
    '/anatomy/hra/VH_M_Pancreas.glb',
    'Pancreas',
    'Pancreas',
    'Pancreas',
    'Pancreas',
    'Pancreas',
    'digestiv',
    'abdomen',
    'Organ alungit din abdomenul superior, posterior de stomac, cu rol digestiv și endocrin.',
    array['pancreas','pancreatic','insulină','insulina','glicemie'],
    'standard',
    true,
    true,
    'valid'
  ),
  (
    'organ-vezica-urinara',
    'VH_M_fundus_of_urinary_bladder_dome,VH_M_trigone_of_urinary_bladder',
    'VH_M_fundus_of_urinary_bladder_dome',
    '/anatomy/hra/VH_M_Urinary_Bladder.glb',
    'Vezică urinară',
    'Vezică urinară',
    'Vezică urinară',
    'Urinary bladder',
    'Vesica urinaria',
    'urinar',
    'pelvis',
    'Organ cavitar centrat în pelvis, cu rol de stocare a urinei.',
    array['vezică','vezica','vezică urinară','vezica urinara','bladder','urină','urina'],
    'standard',
    true,
    true,
    'valid'
  ),
  (
    'organ-stomac',
    null,
    null,
    null,
    'Stomac',
    'Stomac',
    'Stomac',
    'Stomach',
    'Ventriculus',
    'digestiv',
    'abdomen',
    'Organ digestiv fără GLB disponibil în setul curent; nu este activat pentru selecție până la mapare.',
    array['stomac','stomacul','gastric','greață','greata','vărsături','varsaturi'],
    'standard',
    false,
    false,
    'missing_glb'
  ),
  (
    'organ-splina',
    null,
    null,
    null,
    'Splină',
    'Splină',
    'Splină',
    'Spleen',
    'Lien',
    'limfatic',
    'abdomen',
    'Organ limfatic fără GLB disponibil în setul curent; nu este activat pentru selecție până la mapare.',
    array['splină','splina','spleen','lien'],
    'standard',
    false,
    false,
    'missing_glb'
  ),
  (
    'organ-esofag',
    null,
    null,
    null,
    'Esofag',
    'Esofag',
    'Esofag',
    'Esophagus',
    'Oesophagus',
    'digestiv',
    'gat_torace',
    'Tub digestiv fără GLB separat disponibil în setul curent; nu este activat pentru selecție până la mapare.',
    array['esofag','oesophagus','esophagus'],
    'standard',
    false,
    false,
    'missing_glb'
  ),
  (
    'organ-trahee',
    'VH_M_trachea,VH_M_tracheal_cartilage',
    'VH_M_trachea',
    '/anatomy/hra/VH_M_Lung.glb',
    'Trahee',
    'Trahee',
    'Trahee',
    'Trachea',
    'Trachea',
    'respirator',
    'gat_torace',
    'Traheea există în GLB-ul plămânilor, dar nu este expusă ca organ separat selectabil.',
    array['trahee','trachea','respirație','respiratie'],
    'standard',
    false,
    false,
    'embedded_in_lung_model'
  )
on conflict (slug) do update set
  glb_node_name = excluded.glb_node_name,
  mesh_name = excluded.mesh_name,
  model_key = excluded.model_key,
  display_name_ro = excluded.display_name_ro,
  common_name_ro = excluded.common_name_ro,
  scientific_name_ro = excluded.scientific_name_ro,
  english_name = excluded.english_name,
  latin_name = excluded.latin_name,
  organ_system = excluded.organ_system,
  body_region = excluded.body_region,
  description_ro = excluded.description_ro,
  aliases_ro = excluded.aliases_ro,
  risk_category = excluded.risk_category,
  is_selectable = excluded.is_selectable,
  ai_enabled = excluded.ai_enabled,
  position_status = excluded.position_status,
  updated_at = now();

insert into public.anatomy_structures (
  slug,
  name_ro,
  common_name_ro,
  scientific_name_ro,
  display_name_ro,
  subtitle_name,
  english_name,
  name_latin,
  latin_name,
  tissue,
  body_region,
  model_selection_id,
  description_ro,
  function_ro,
  aliases_ro,
  missing_ro_display_name
)
select
  slug,
  display_name_ro,
  common_name_ro,
  scientific_name_ro,
  display_name_ro,
  coalesce(latin_name, english_name),
  english_name,
  latin_name,
  latin_name,
  'organ'::public.tissue_type,
  coalesce(body_region, 'necunoscut'),
  replace(slug, 'organ-', 'organ:'),
  description_ro,
  '',
  aliases_ro,
  false
from public.organs
where ai_enabled = true
on conflict (slug) do update set
  name_ro = excluded.name_ro,
  common_name_ro = excluded.common_name_ro,
  scientific_name_ro = excluded.scientific_name_ro,
  display_name_ro = excluded.display_name_ro,
  subtitle_name = excluded.subtitle_name,
  english_name = excluded.english_name,
  name_latin = excluded.name_latin,
  latin_name = excluded.latin_name,
  tissue = excluded.tissue,
  body_region = excluded.body_region,
  model_selection_id = excluded.model_selection_id,
  description_ro = excluded.description_ro,
  aliases_ro = excluded.aliases_ro,
  missing_ro_display_name = false,
  updated_at = now();

insert into public.ai_knowledge_entries (
  tissue,
  structure_slug,
  model_selection_id,
  body_region,
  category,
  title_ro,
  content_ro,
  priority,
  tags,
  metadata
)
select
  'organ'::public.tissue_type,
  o.slug,
  replace(o.slug, 'organ-', 'organ:'),
  o.body_region,
  'anatomie'::public.knowledge_category,
  'Organ intern: ' || o.display_name_ro,
  o.description_ro || coalesce(' Denumire latină: ' || o.latin_name || '.', ''),
  8,
  array_remove(array[o.body_region, lower(o.display_name_ro), o.organ_system, 'organ'], null),
  jsonb_build_object(
    'model_key', o.model_key,
    'glb_node_name', o.glb_node_name,
    'mesh_name', o.mesh_name,
    'risk_category', o.risk_category,
    'position_status', o.position_status
  )
from public.organs o
where o.ai_enabled = true
  and not exists (
    select 1
    from public.ai_knowledge_entries k
    where k.tissue = 'organ'
      and k.structure_slug = o.slug
      and k.category = 'anatomie'
  );

insert into public.ai_knowledge_entries (
  tissue,
  structure_slug,
  model_selection_id,
  body_region,
  category,
  title_ro,
  content_ro,
  priority,
  tags,
  metadata
)
select
  'organ'::public.tissue_type,
  o.slug,
  replace(o.slug, 'organ-', 'organ:'),
  o.body_region,
  'intrebari_clarificare'::public.knowledge_category,
  'Triaj pentru organe: ' || o.display_name_ro,
  'Întrebări potrivite: unde simți durerea, cât de severă este, debut brusc sau treptat, febră, greață, vărsături, dificultăți de respirație, durere în piept, sânge în urină sau scaun, amețeală, confuzie, slăbiciune importantă, agravare.',
  8,
  array_remove(array[o.body_region, lower(o.display_name_ro), 'triaj-organe'], null),
  jsonb_build_object('flow', 'organs')
from public.organs o
where o.ai_enabled = true
  and not exists (
    select 1
    from public.ai_knowledge_entries k
    where k.tissue = 'organ'
      and k.structure_slug = o.slug
      and k.category = 'intrebari_clarificare'
  );

insert into public.ai_knowledge_entries (
  tissue,
  structure_slug,
  model_selection_id,
  body_region,
  category,
  title_ro,
  content_ro,
  priority,
  tags,
  metadata
)
select
  'organ'::public.tissue_type,
  o.slug,
  replace(o.slug, 'organ-', 'organ:'),
  o.body_region,
  'semne_alarma'::public.knowledge_category,
  'Semne de alarmă pentru organe: ' || o.display_name_ro,
  'Semne de alarmă: durere în piept, dificultăți de respirație, durere abdominală severă, durere bruscă foarte intensă, leșin, sânge în urină, sânge în scaun, sânge în vărsături, febră mare, confuzie, abdomen rigid, durere puternică în partea dreaptă jos, simptome neurologice bruște. Recomandă consult urgent sau urgență înainte de întrebări suplimentare.',
  10,
  array_remove(array[o.body_region, lower(o.display_name_ro), 'semne-alarma-organe'], null),
  jsonb_build_object('flow', 'organs')
from public.organs o
where o.ai_enabled = true
  and not exists (
    select 1
    from public.ai_knowledge_entries k
    where k.tissue = 'organ'
      and k.structure_slug = o.slug
      and k.category = 'semne_alarma'
  );

create or replace function public.match_ai_knowledge_entries(
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
  priority smallint,
  tags text[],
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
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
