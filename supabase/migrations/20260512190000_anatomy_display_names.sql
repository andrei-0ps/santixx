
alter table if exists public.anatomy_structures
  add column if not exists common_name_ro text,
  add column if not exists scientific_name_ro text,
  add column if not exists display_name_ro text,
  add column if not exists subtitle_name text,
  add column if not exists english_name text,
  add column if not exists latin_name text,
  add column if not exists aliases_ro text[] not null default '{}',
  add column if not exists missing_ro_display_name boolean not null default false;

alter table if exists public.body_regions
  add column if not exists common_name_ro text,
  add column if not exists scientific_name_ro text,
  add column if not exists display_name_ro text,
  add column if not exists subtitle_name text,
  add column if not exists english_name text,
  add column if not exists latin_name text,
  add column if not exists aliases_ro text[] not null default '{}',
  add column if not exists missing_ro_display_name boolean not null default false;

alter table if exists public.muscles
  add column if not exists common_name_ro text,
  add column if not exists scientific_name_ro text,
  add column if not exists display_name_ro text,
  add column if not exists subtitle_name text,
  add column if not exists english_name text,
  add column if not exists latin_name text,
  add column if not exists aliases_ro text[] not null default '{}',
  add column if not exists missing_ro_display_name boolean not null default false;

alter table if exists public.model_3d_mappings
  add column if not exists common_name_ro text,
  add column if not exists scientific_name_ro text,
  add column if not exists display_name_ro text,
  add column if not exists subtitle_name text,
  add column if not exists english_name text,
  add column if not exists latin_name text,
  add column if not exists aliases_ro text[] not null default '{}',
  add column if not exists missing_ro_display_name boolean not null default false;

create index if not exists anatomy_structures_aliases_ro_idx
  on public.anatomy_structures using gin (aliases_ro);

create index if not exists anatomy_structures_display_lookup_idx
  on public.anatomy_structures (slug, model_selection_id, tissue);

update public.anatomy_structures
set
  scientific_name_ro = coalesce(scientific_name_ro, name_ro),
  latin_name = coalesce(latin_name, name_latin),
  missing_ro_display_name = display_name_ro is null and common_name_ro is null and name_ro is null;

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
    or nullif(trim(coalesce(a.display_name_ro, a.common_name_ro, a.name_ro)), '') is null
  order by a.tissue, a.body_region, a.slug;
$$;

create or replace function public.upsert_anatomy_display_name(
  p_slug text,
  p_tissue public.tissue_type,
  p_body_region text,
  p_model_selection_id text,
  p_name_ro text,
  p_common_name_ro text,
  p_scientific_name_ro text,
  p_display_name_ro text,
  p_subtitle_name text,
  p_english_name text,
  p_latin_name text,
  p_aliases_ro text[]
)
returns void
language sql
as $$
  insert into public.anatomy_structures (
    slug,
    tissue,
    body_region,
    model_selection_id,
    name_ro,
    common_name_ro,
    scientific_name_ro,
    display_name_ro,
    subtitle_name,
    english_name,
    name_latin,
    latin_name,
    aliases_ro,
    description_ro,
    function_ro,
    missing_ro_display_name
  )
  values (
    p_slug,
    p_tissue,
    p_body_region,
    p_model_selection_id,
    coalesce(p_name_ro, p_display_name_ro, p_common_name_ro, p_scientific_name_ro, p_slug),
    p_common_name_ro,
    p_scientific_name_ro,
    p_display_name_ro,
    p_subtitle_name,
    p_english_name,
    p_latin_name,
    p_latin_name,
    coalesce(p_aliases_ro, '{}'),
    '',
    '',
    p_display_name_ro is null and p_common_name_ro is null and p_name_ro is null
  )
  on conflict (slug) do update set
    model_selection_id = coalesce(excluded.model_selection_id, public.anatomy_structures.model_selection_id),
    common_name_ro = excluded.common_name_ro,
    scientific_name_ro = excluded.scientific_name_ro,
    display_name_ro = excluded.display_name_ro,
    subtitle_name = excluded.subtitle_name,
    english_name = excluded.english_name,
    name_latin = coalesce(excluded.name_latin, public.anatomy_structures.name_latin),
    latin_name = coalesce(excluded.latin_name, public.anatomy_structures.latin_name),
    aliases_ro = excluded.aliases_ro,
    missing_ro_display_name = excluded.missing_ro_display_name,
    updated_at = now();
$$;

select public.upsert_anatomy_display_name('humerus', 'os', 'brat', 'humerus', 'Humerus', 'Osul brațului', 'Humerus', 'Osul brațului', 'Humerus', 'Humerus', 'Humerus', array['osul brațului','osul bratului','brat','braț','humerus']);
select public.upsert_anatomy_display_name('femur', 'os', 'coapsa_sold_genunchi', 'femur', 'Femur', 'Osul coapsei', 'Femur', 'Osul coapsei', 'Femur', 'Femur', 'Femur', array['osul coapsei','coapsa','femur']);
select public.upsert_anatomy_display_name('radius', 'os', 'antebrat', 'radius', 'Radius', 'Osul lateral al antebrațului', 'Radius', 'Osul lateral al antebrațului', 'Radius', 'Radius', 'Radius', array['radius','osul lateral al antebrațului','osul lateral al antebratului','antebraț','antebrat']);
select public.upsert_anatomy_display_name('ulna', 'os', 'antebrat', 'ulna', 'Ulnă', 'Osul medial al antebrațului', 'Ulna', 'Osul medial al antebrațului', 'Ulna', 'Ulna', 'Ulna', array['ulna','cubitus','osul medial al antebrațului','osul medial al antebratului','antebraț','antebrat']);
select public.upsert_anatomy_display_name('scapula', 'os', 'umar_centura_scapulara', 'scapula', 'Scapulă', 'Omoplatul', 'Scapula', 'Omoplatul', 'Scapula', 'Scapula', 'Scapula', array['omoplat','omoplatul','scapula']);
select public.upsert_anatomy_display_name('clavicula', 'os', 'umar_centura_scapulara', 'clavicula', 'Claviculă', 'Clavicula', 'Clavicula', 'Clavicula', 'Clavicula', 'Clavicle', 'Clavicula', array['claviculă','clavicula','clavicle']);
select public.upsert_anatomy_display_name('rotula', 'os', 'coapsa_sold_genunchi', 'rotula', 'Rotulă', 'Rotula', 'Patela', 'Rotula', 'Patela', 'Patella', 'Patella', array['genunchi','rotulă','rotula','patela','patella']);
select public.upsert_anatomy_display_name('tibia', 'os', 'gamba', 'tibia', 'Tibia', 'Tibia', 'Tibia', 'Tibia', 'Tibia', 'Tibia', 'Tibia', array['tibia','gambă','gamba']);
select public.upsert_anatomy_display_name('fibula', 'os', 'gamba', 'fibula', 'Fibulă', 'Peroneul', 'Fibula', 'Peroneul', 'Fibula', 'Fibula', 'Fibula', array['peroneu','peroneul','fibula','gambă','gamba']);

select public.upsert_anatomy_display_name('proximal-phalanx-thumb-hand', 'os', 'mana', 'os-proximal-phalanx-of-thumb', 'Falanga proximală a policelui', 'Falanga proximală a policelui', 'Falanga proximală a policelui', 'Falanga proximală a policelui', 'Proximal phalanx of thumb', 'Proximal phalanx of thumb', null, array['police','deget mare','falanga policelui']);
select public.upsert_anatomy_display_name('distal-phalanx-thumb-hand', 'os', 'mana', 'os-distal-phalanx-of-thumb', 'Falanga distală a policelui', 'Falanga distală a policelui', 'Falanga distală a policelui', 'Falanga distală a policelui', 'Distal phalanx of thumb', 'Distal phalanx of thumb', null, array['police','deget mare','falanga policelui']);
select public.upsert_anatomy_display_name('proximal-phalanx-index-finger-hand', 'os', 'mana', 'os-proximal-phalanx-of-index-finger', 'Falanga proximală a degetului arătător', 'Falanga proximală a degetului arătător', 'Falanga proximală a degetului arătător', 'Falanga proximală a degetului arătător', 'Proximal phalanx of index finger', 'Proximal phalanx of index finger', null, array['deget arătător','deget aratator','arătător','aratator','falanga degetului arătător']);
select public.upsert_anatomy_display_name('middle-phalanx-index-finger-hand', 'os', 'mana', 'os-middle-phalanx-of-index-finger', 'Falanga mijlocie a degetului arătător', 'Falanga mijlocie a degetului arătător', 'Falanga mijlocie a degetului arătător', 'Falanga mijlocie a degetului arătător', 'Middle phalanx of index finger', 'Middle phalanx of index finger', null, array['deget arătător','deget aratator','arătător','aratator','falanga degetului arătător']);
select public.upsert_anatomy_display_name('distal-phalanx-index-finger-hand', 'os', 'mana', 'os-distal-phalanx-of-index-finger', 'Falanga distală a degetului arătător', 'Falanga distală a degetului arătător', 'Falanga distală a degetului arătător', 'Falanga distală a degetului arătător', 'Distal phalanx of index finger', 'Distal phalanx of index finger', null, array['deget arătător','deget aratator','arătător','aratator','falanga degetului arătător']);
select public.upsert_anatomy_display_name('proximal-phalanx-middle-finger-hand', 'os', 'mana', 'os-proximal-phalanx-of-middle-finger', 'Falanga proximală a degetului mijlociu', 'Falanga proximală a degetului mijlociu', 'Falanga proximală a degetului mijlociu', 'Falanga proximală a degetului mijlociu', 'Proximal phalanx of middle finger', 'Proximal phalanx of middle finger', null, array['deget mijlociu','mijlociu','falanga degetului mijlociu']);
select public.upsert_anatomy_display_name('middle-phalanx-middle-finger-hand', 'os', 'mana', 'os-middle-phalanx-of-middle-finger', 'Falanga mijlocie a degetului mijlociu', 'Falanga mijlocie a degetului mijlociu', 'Falanga mijlocie a degetului mijlociu', 'Falanga mijlocie a degetului mijlociu', 'Middle phalanx of middle finger', 'Middle phalanx of middle finger', null, array['deget mijlociu','mijlociu','falanga degetului mijlociu']);
select public.upsert_anatomy_display_name('distal-phalanx-middle-finger-hand', 'os', 'mana', 'os-distal-phalanx-of-middle-finger', 'Falanga distală a degetului mijlociu', 'Falanga distală a degetului mijlociu', 'Falanga distală a degetului mijlociu', 'Falanga distală a degetului mijlociu', 'Distal phalanx of middle finger', 'Distal phalanx of middle finger', null, array['deget mijlociu','mijlociu','falanga degetului mijlociu']);
select public.upsert_anatomy_display_name('proximal-phalanx-ring-finger-hand', 'os', 'mana', 'os-proximal-phalanx-of-fourth-finger', 'Falanga proximală a degetului inelar', 'Falanga proximală a degetului inelar', 'Falanga proximală a degetului inelar', 'Falanga proximală a degetului inelar', 'Proximal phalanx of fourth finger', 'Proximal phalanx of fourth finger', null, array['deget inelar','inelar','falanga degetului inelar','fourth finger','ring finger']);
select public.upsert_anatomy_display_name('middle-phalanx-ring-finger-hand', 'os', 'mana', 'os-middle-phalanx-of-fourth-finger', 'Falanga mijlocie a degetului inelar', 'Falanga mijlocie a degetului inelar', 'Falanga mijlocie a degetului inelar', 'Falanga mijlocie a degetului inelar', 'Middle phalanx of fourth finger', 'Middle phalanx of fourth finger', null, array['deget inelar','inelar','falanga degetului inelar','fourth finger','ring finger']);
select public.upsert_anatomy_display_name('distal-phalanx-ring-finger-hand', 'os', 'mana', 'os-distal-phalanx-of-fourth-finger', 'Falanga distală a degetului inelar', 'Falanga distală a degetului inelar', 'Falanga distală a degetului inelar', 'Falanga distală a degetului inelar', 'Distal phalanx of fourth finger', 'Distal phalanx of fourth finger', null, array['deget inelar','inelar','falanga degetului inelar','fourth finger','ring finger']);
select public.upsert_anatomy_display_name('proximal-phalanx-little-finger-hand', 'os', 'mana', 'os-proximal-phalanx-of-little-finger', 'Falanga proximală a degetului mic', 'Falanga proximală a degetului mic', 'Falanga proximală a degetului mic', 'Falanga proximală a degetului mic', 'Proximal phalanx of little finger', 'Proximal phalanx of little finger', null, array['deget mic','degetul mic','falanga degetului mic','little finger']);
select public.upsert_anatomy_display_name('middle-phalanx-little-finger-hand', 'os', 'mana', 'os-middle-phalanx-of-little-finger', 'Falanga mijlocie a degetului mic', 'Falanga mijlocie a degetului mic', 'Falanga mijlocie a degetului mic', 'Falanga mijlocie a degetului mic', 'Middle phalanx of little finger', 'Middle phalanx of little finger', null, array['deget mic','degetul mic','falanga degetului mic','little finger']);
select public.upsert_anatomy_display_name('distal-phalanx-little-finger-hand', 'os', 'mana', 'os-distal-phalanx-of-little-finger', 'Falanga distală a degetului mic', 'Falanga distală a degetului mic', 'Falanga distală a degetului mic', 'Falanga distală a degetului mic', 'Distal phalanx of little finger', 'Distal phalanx of little finger', null, array['deget mic','degetul mic','falanga degetului mic','little finger']);

select public.upsert_anatomy_display_name('biceps-brachii', 'muschi', 'brat', 'muschi-biceps-brachii', 'Mușchiul biceps al brațului', 'Mușchiul biceps al brațului', 'Biceps brahial', 'Mușchiul biceps al brațului', 'Biceps brahial', 'Biceps brachii', 'Musculus biceps brachii', array['biceps','mușchiul brațului','muschiul bratului','biceps brahial']);
select public.upsert_anatomy_display_name('triceps-brachii', 'muschi', 'brat', 'muschi-triceps-brachii', 'Mușchiul triceps al brațului', 'Mușchiul triceps al brațului', 'Triceps brahial', 'Mușchiul triceps al brațului', 'Triceps brahial', 'Triceps brachii', 'Musculus triceps brachii', array['triceps','mușchiul brațului','muschiul bratului','triceps brahial']);
select public.upsert_anatomy_display_name('brachioradialis', 'muschi', 'antebrat', 'muschi-brachioradialis', 'Mușchiul lateral al antebrațului', 'Mușchiul lateral al antebrațului', 'Brahioradial', 'Mușchiul lateral al antebrațului', 'Brahioradial', 'Brachioradialis', 'Musculus brachioradialis', array['brahioradial','brachioradialis','antebraț','antebrat']);
select public.upsert_anatomy_display_name('forearm-flexors', 'muschi', 'antebrat', 'muschi-forearm-flexors', 'Mușchii flexori ai antebrațului', 'Mușchii flexori ai antebrațului', 'Flexorii antebrațului', 'Mușchii flexori ai antebrațului', 'Flexorii antebrațului', 'Forearm flexors', null, array['flexori antebraț','flexori antebrat','mușchii flexori ai antebrațului','muschi flexori antebrat']);
select public.upsert_anatomy_display_name('forearm-extensors', 'muschi', 'antebrat', 'muschi-forearm-extensors', 'Mușchii extensori ai antebrațului', 'Mușchii extensori ai antebrațului', 'Extensorii antebrațului', 'Mușchii extensori ai antebrațului', 'Extensorii antebrațului', 'Forearm extensors', null, array['extensori antebraț','extensori antebrat','mușchii extensori ai antebrațului','muschi extensori antebrat']);
select public.upsert_anatomy_display_name('deltoid', 'muschi', 'umar_centura_scapulara', 'muschi-deltoid', 'Mușchiul umărului', 'Mușchiul umărului', 'Deltoid', 'Mușchiul umărului', 'Deltoid', 'Deltoid', 'Musculus deltoideus', array['deltoid','umăr','umar','mușchiul umărului']);
select public.upsert_anatomy_display_name('pectoralis-major', 'muschi', 'torace', 'muschi-pectoralis-major', 'Mușchiul pieptului', 'Mușchiul pieptului', 'Pectoral mare', 'Mușchiul pieptului', 'Pectoral mare', 'Pectoralis major', 'Musculus pectoralis major', array['pectoral','piept','mușchiul pieptului','pectoralis major']);
select public.upsert_anatomy_display_name('latissimus-dorsi', 'muschi', 'spate', 'muschi-latissimus-dorsi', 'Mușchiul mare al spatelui', 'Mușchiul mare al spatelui', 'Marele dorsal', 'Mușchiul mare al spatelui', 'Marele dorsal', 'Latissimus dorsi', 'Musculus latissimus dorsi', array['marele dorsal','spate','mușchiul spatelui','latissimus dorsi']);
select public.upsert_anatomy_display_name('rectus-abdominis', 'muschi', 'abdomen', 'muschi-rectus-abdominis', 'Mușchiul abdominal central', 'Mușchiul abdominal central', 'Drept abdominal', 'Mușchiul abdominal central', 'Drept abdominal', 'Rectus abdominis', 'Musculus rectus abdominis', array['abdomen','abdominal','drept abdominal','rectus abdominis']);
select public.upsert_anatomy_display_name('external-oblique', 'muschi', 'abdomen', 'muschi-external-oblique', 'Mușchiul abdominal lateral', 'Mușchiul abdominal lateral', 'Oblic extern abdominal', 'Mușchiul abdominal lateral', 'Oblic extern abdominal', 'External oblique', 'Musculus obliquus externus abdominis', array['oblic extern','abdominal lateral','external oblique']);
select public.upsert_anatomy_display_name('gluteus-maximus', 'muschi', 'sold', 'muschi-gluteus-maximus', 'Mușchiul fesier mare', 'Mușchiul fesier mare', 'Fesier mare', 'Mușchiul fesier mare', 'Fesier mare', 'Gluteus maximus', 'Musculus gluteus maximus', array['fesier','fesier mare','gluteus maximus']);
select public.upsert_anatomy_display_name('quadriceps', 'muschi', 'coapsa_sold_genunchi', 'muschi-quadriceps', 'Mușchii coapsei din față', 'Mușchii coapsei din față', 'Cvadriceps', 'Mușchii coapsei din față', 'Cvadriceps', 'Quadriceps', null, array['cvadriceps','coapsa față','coapsa fata','quadriceps']);
select public.upsert_anatomy_display_name('hamstrings', 'muschi', 'coapsa_sold_genunchi', 'muschi-hamstrings', 'Mușchii coapsei din spate', 'Mușchii coapsei din spate', 'Ischiogambieri', 'Mușchii coapsei din spate', 'Ischiogambieri', 'Hamstrings', null, array['ischiogambieri','coapsa spate','hamstrings']);
select public.upsert_anatomy_display_name('gastrocnemius', 'muschi', 'gamba', 'muschi-gastrocnemius', 'Mușchiul gambei', 'Mușchiul gambei', 'Gastrocnemian', 'Mușchiul gambei', 'Gastrocnemian', 'Gastrocnemius', 'Musculus gastrocnemius', array['gambă','gamba','gastrocnemian','gastrocnemius']);
select public.upsert_anatomy_display_name('soleus', 'muschi', 'gamba', 'muschi-soleus', 'Mușchiul profund al gambei', 'Mușchiul profund al gambei', 'Solear', 'Mușchiul profund al gambei', 'Solear', 'Soleus', 'Musculus soleus', array['solear','soleus','gambă','gamba']);
select public.upsert_anatomy_display_name('tibialis-anterior', 'muschi', 'gamba', 'muschi-tibialis-anterior', 'Mușchiul din fața gambei', 'Mușchiul din fața gambei', 'Tibial anterior', 'Mușchiul din fața gambei', 'Tibial anterior', 'Tibialis anterior', 'Musculus tibialis anterior', array['tibial anterior','fața gambei','fata gambei','tibialis anterior']);

drop function if exists public.upsert_anatomy_display_name(
  text,
  public.tissue_type,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[]
);
